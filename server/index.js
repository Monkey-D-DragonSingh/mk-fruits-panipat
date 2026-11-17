require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

let nodemailer = null;
try { nodemailer = require("nodemailer"); } catch { nodemailer = null; }

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "1mb" }));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbReady = Boolean(
  supabaseUrl &&
    supabaseKey &&
    !String(supabaseUrl).includes("placeholder") &&
    !String(supabaseUrl).includes("YOUR_PROJECT_REF") &&
    !String(supabaseKey).includes("placeholder") &&
    !String(supabaseKey).includes("YOUR_SERVICE_ROLE_KEY")
);
const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-key",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/* ---------- Storage (local JSON fallback DB + outbox) ---------- */
const DATA_DIR = path.join(__dirname, "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const LOGIN_ATTEMPTS_FILE = path.join(DATA_DIR, "login_attempts.json");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function readJson(file, fallback) {
  try {
    ensureDataDir();
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2), "utf8");
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
function writeJson(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}
function genId() {
  return (crypto.randomUUID && crypto.randomUUID()) || `id_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------- Auth (hashed password support + signed expiring sessions + rate limit) ---------- */
const AUTH_SECRET = process.env.AUTH_SECRET || crypto.createHash("sha256").update(String(process.env.OWNER_PASSWORD || "dev-secret") + "|mkfp").digest("hex");
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_HOURS || 12) * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
function verifyPassword(input) {
  const hash = process.env.OWNER_PASSWORD_HASH;
  if (hash) {
    // format: scrypt$<salt-hex>$<hash-hex>
    const parts = String(hash).split("$");
    if (parts.length === 3 && parts[0] === "scrypt") {
      const salt = Buffer.from(parts[1], "hex");
      const expected = Buffer.from(parts[2], "hex");
      const derived = crypto.scryptSync(String(input), salt, expected.length);
      return crypto.timingSafeEqual(derived, expected);
    }
    // fallback: direct hash compare
    return safeEqual(crypto.createHash("sha256").update(String(input)).digest("hex"), hash);
  }
  return String(input) === String(process.env.OWNER_PASSWORD || "");
}
function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}
function verifyToken(token) {
  try {
    const [body, sig] = String(token || "").split(".");
    if (!body || !sig) return null;
    const expected = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64url");
    if (!safeEqual(sig, expected)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload || !payload.exp || Date.now() > payload.exp) return null;
    const sessions = readJson(SESSIONS_FILE, []);
    const found = sessions.find((s) => s.jti === payload.jti && !s.revoked && s.exp > Date.now());
    if (!found) return null;
    return payload;
  } catch {
    return null;
  }
}
function issueSession() {
  const now = Date.now();
  const payload = { jti: genId(), iat: now, exp: now + SESSION_TTL_MS };
  const token = signToken(payload);
  const sessions = readJson(SESSIONS_FILE, []).filter((s) => s.exp > now && !s.revoked);
  sessions.push({ jti: payload.jti, exp: payload.exp, createdAt: now });
  writeJson(SESSIONS_FILE, sessions.slice(-500));
  return token;
}
function revokeSession(token) {
  try {
    const [body] = String(token || "").split(".");
    if (!body) return;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    const sessions = readJson(SESSIONS_FILE, []);
    const next = sessions.map((s) => (s.jti === payload.jti ? { ...s, revoked: true } : s));
    writeJson(SESSIONS_FILE, next);
  } catch {}
}
function authRequired(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ ok: false, error: "unauthorized" });
  req.auth = payload;
  next();
}
function rateLimitLogin(req, res, next) {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").toString().split(",")[0].trim();
  const now = Date.now();
  const all = readJson(LOGIN_ATTEMPTS_FILE, {});
  const entry = all[ip] || { count: 0, resetAt: now + LOGIN_WINDOW_MS };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + LOGIN_WINDOW_MS; }
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    all[ip] = entry; writeJson(LOGIN_ATTEMPTS_FILE, all);
    return res.status(429).json({ ok: false, error: "Too many login attempts. Please try again later." });
  }
  req._loginRate = { ip, all, entry };
  next();
}
function recordLoginFailure(req) {
  const ctx = req._loginRate; if (!ctx) return;
  ctx.entry.count += 1; ctx.all[ctx.ip] = ctx.entry; writeJson(LOGIN_ATTEMPTS_FILE, ctx.all);
}
function clearLoginFailures(req) {
  const ctx = req._loginRate; if (!ctx) return;
  ctx.entry.count = 0; ctx.entry.resetAt = Date.now() + LOGIN_WINDOW_MS; ctx.all[ctx.ip] = ctx.entry; writeJson(LOGIN_ATTEMPTS_FILE, ctx.all);
}

/* ---------- Notifications (outbox + webhook/email) ---------- */
const OWNER_PHONE = process.env.OWNER_NOTIFY_PHONE || "8221900072";
const OWNER_EMAIL = process.env.OWNER_NOTIFY_EMAIL || "mkfreshfruitpanipat@gmail.com";
const NOTIFY_WEBHOOK_URL = process.env.NOTIFY_WEBHOOK_URL || "";

function bookingSummary(b) {
  return `MK Fruit Booking ${b.ref || b.id}\nName: ${b.name}\nPhone: ${b.phone}\nDate: ${b.date} ${b.time}\nGuests: ${b.guests}\nVenue/Notes: ${b.notes || "-"}`;
}
async function sendEmail(to, subject, text) {
  if (!nodemailer || !process.env.SMTP_HOST || !to) return { ok: false, error: "SMTP not configured" };
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text });
  return { ok: true };
}
async function sendWebhook(event, payload) {
  if (!NOTIFY_WEBHOOK_URL) return { ok: false, error: "Webhook not configured" };
  const res = await fetch(NOTIFY_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.NOTIFY_WEBHOOK_SECRET ? { "x-webhook-secret": process.env.NOTIFY_WEBHOOK_SECRET } : {}) }, body: JSON.stringify({ event, ...payload }) });
  if (!res.ok) throw new Error(`Webhook ${res.status}`);
  return { ok: true };
}
function createNotificationRecords(booking) {
  const now = new Date().toISOString();
  const waText = encodeURIComponent(bookingSummary(booking));
  const records = [
    { id: genId(), booking_id: booking.id, booking_ref: booking.ref, channel: "owner_whatsapp", recipient: OWNER_PHONE, payload: { text: bookingSummary(booking), waLink: `https://wa.me/91${String(OWNER_PHONE).replace(/\D/g, "").slice(-10)}?text=${waText}` }, status: "pending", attempts: 0, last_error: null, created_at: now, sent_at: null },
    { id: genId(), booking_id: booking.id, booking_ref: booking.ref, channel: "owner_email", recipient: OWNER_EMAIL, payload: { subject: `New Booking ${booking.ref}`, text: bookingSummary(booking) }, status: "pending", attempts: 0, last_error: null, created_at: now, sent_at: null },
  ];
  if (booking.email) records.push({ id: genId(), booking_id: booking.id, booking_ref: booking.ref, channel: "customer_email", recipient: booking.email, payload: { subject: `Booking Received ${booking.ref} - MK Fruit Panipat`, text: `Thank you ${booking.name},\n\nWe received your wedding fruit stall booking request.\n\n${bookingSummary(booking)}\n\nWe will confirm via call/WhatsApp within 24 hours.\n\nMK Fruit Panipat` }, status: "pending", attempts: 0, last_error: null, created_at: now, sent_at: null });
  if (NOTIFY_WEBHOOK_URL) records.push({ id: genId(), booking_id: booking.id, booking_ref: booking.ref, channel: "webhook", recipient: NOTIFY_WEBHOOK_URL, payload: { booking }, status: "pending", attempts: 0, last_error: null, created_at: now, sent_at: null });
  return records;
}
async function enqueueNotifications(booking) {
  const records = createNotificationRecords(booking);
  if (dbReady) {
    // best-effort: store in Supabase if notifications table exists
    try {
      await supabase.from("notifications").insert(records.map((r) => ({ booking_id: r.booking_id, booking_ref: r.booking_ref, channel: r.channel, recipient: r.recipient, payload: r.payload, status: r.status, attempts: r.attempts, last_error: r.last_error })));
    } catch {}
  }
  const list = readJson(NOTIFICATIONS_FILE, []);
  writeJson(NOTIFICATIONS_FILE, [...records, ...list].slice(0, 2000));
  return records;
}
async function processPendingNotifications(limit = 20) {
  let processed = 0, sent = 0, failed = 0;
  let list = readJson(NOTIFICATIONS_FILE, []);
  const pending = list.filter((n) => n.status === "pending").slice(0, limit);
  for (const n of pending) {
    processed++;
    try {
      if (n.channel === "owner_email" || n.channel === "customer_email") {
        const r = await sendEmail(n.recipient, n.payload.subject, n.payload.text);
        if (!r.ok && !NOTIFY_WEBHOOK_URL) throw new Error(r.error || "email not sent");
        if (!r.ok && NOTIFY_WEBHOOK_URL) await sendWebhook("notification", n);
      } else if (n.channel === "webhook") {
        await sendWebhook("booking_notification", n.payload);
      } else if (n.channel === "owner_whatsapp") {
        // no direct WhatsApp API configured: mark as prepared (link available) or forward to webhook
        if (NOTIFY_WEBHOOK_URL) await sendWebhook("owner_whatsapp", n.payload);
        else { n.status = "sent"; n.sent_at = new Date().toISOString(); n.last_error = "prepared (open waLink/manual send)"; sent++; continue; }
      } else {
        if (NOTIFY_WEBHOOK_URL) await sendWebhook("notification", n);
      }
      n.status = "sent"; n.sent_at = new Date().toISOString(); n.last_error = null; sent++;
    } catch (e) {
      n.attempts = (n.attempts || 0) + 1; n.last_error = String(e.message || e); if (n.attempts >= 5) n.status = "failed"; failed++;
    }
  }
  writeJson(NOTIFICATIONS_FILE, list);
  return { processed, sent, failed };
}

/* ---------- Bookings helpers ---------- */
function normalizeBooking(row) { return row; }
async function listAllBookings(status) {
  if (dbReady) {
    let query = supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (status) query = supabase.from("bookings").select("*").eq("status", status).order("created_at", { ascending: false });
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }
  let data = readJson(BOOKINGS_FILE, []);
  if (status) data = data.filter((b) => b.status === status);
  data.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  return data;
}

/* ---------- Routes ---------- */
app.post("/api/owner/login", rateLimitLogin, (req, res) => {
  const { password } = req.body || {};
  if (!password || !verifyPassword(password)) {
    recordLoginFailure(req);
    return res.status(401).json({ ok: false, error: "Invalid owner password" });
  }
  clearLoginFailures(req);
  const token = issueSession();
  return res.json({ ok: true, token, expiresInMs: SESSION_TTL_MS });
});

app.post("/api/owner/logout", authRequired, (req, res) => {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  revokeSession(token);
  return res.json({ ok: true });
});

app.post("/api/bookings", async (req, res) => {
  const { name, phone, email, date, time, guests, package: pkg, notes, items, ref } = req.body || {};
  if (!name || !phone || !date || !time || !guests) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }
  const bookingRef = ref || `MKFP-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
  const now = new Date().toISOString();
  const base = {
    ref: bookingRef, name: String(name).trim(), phone: String(phone).trim(), email: email ? String(email).trim() : null,
    date, time, guests: Number(guests), package: pkg || "Wedding Fruit Stall", notes: notes ? String(notes).trim() : null,
    items: Array.isArray(items) ? items : [], status: "pending",
  };

  let saved;
  if (dbReady) {
    const { data, error } = await supabase.from("bookings").insert([base]).select().single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    saved = data;
  } else {
    saved = { id: genId(), ...base, created_at: now, updated_at: now };
    const list = readJson(BOOKINGS_FILE, []);
    list.unshift(saved);
    writeJson(BOOKINGS_FILE, list.slice(0, 2000));
  }

  let notifications = [];
  try { notifications = await enqueueNotifications(saved); } catch {}
  // best-effort immediate processing (webhook/email) without blocking too long
  try { await processPendingNotifications(10); } catch {}

  return res.status(201).json({ ok: true, data: saved, storage: dbReady ? "supabase" : "local", notificationsQueued: notifications.length });
});

app.get("/api/bookings", authRequired, async (req, res) => {
  try {
    const data = await listAllBookings(req.query.status);
    return res.json({ ok: true, data, storage: dbReady ? "supabase" : "local" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/bookings/export", authRequired, async (req, res) => {
  try {
    const data = await listAllBookings();
    const format = String(req.query.format || "json").toLowerCase();
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    if (format === "csv") {
      const cols = ["ref","id","name","phone","email","date","time","guests","package","status","notes","created_at","updated_at"];
      const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines = [cols.join(",")].concat(data.map((b) => cols.map((c) => esc(b[c])).join(",")));
      const csv = lines.join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="mkfp-bookings-${ts}.csv"`);
      return res.send(csv);
    }
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="mkfp-bookings-${ts}.json"`);
    return res.send(JSON.stringify({ ok: true, exportedAt: new Date().toISOString(), count: data.length, data }, null, 2));
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.patch("/api/bookings/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ ok: false, error: "status required" });
  if (dbReady) {
    const { data, error } = await supabase.from("bookings").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  }
  const list = readJson(BOOKINGS_FILE, []);
  const idx = list.findIndex((b) => String(b.id) === String(id) || String(b.ref) === String(id));
  if (idx === -1) return res.status(404).json({ ok: false, error: "Booking not found" });
  list[idx] = { ...list[idx], status, updated_at: new Date().toISOString() };
  writeJson(BOOKINGS_FILE, list);
  return res.json({ ok: true, data: list[idx] });
});

app.delete("/api/bookings/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  if (dbReady) {
    const { data, error } = await supabase.from("bookings").delete().eq("id", id).select().single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  }
  const list = readJson(BOOKINGS_FILE, []);
  const idx = list.findIndex((b) => String(b.id) === String(id) || String(b.ref) === String(id));
  if (idx === -1) return res.status(404).json({ ok: false, error: "Booking not found" });
  const [removed] = list.splice(idx, 1);
  writeJson(BOOKINGS_FILE, list);
  return res.json({ ok: true, data: removed });
});

// Cron endpoint — processes notification outbox (call via external cron/scheduler)
app.get("/api/cron", async (req, res) => {
  const secret = req.headers["x-cron-secret"] || req.query.secret;
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) return res.status(401).json({ ok: false, error: "unauthorized" });
  try {
    const result = await processPendingNotifications(50);
    const pendingCount = readJson(NOTIFICATIONS_FILE, []).filter((n) => n.status === "pending").length;
    return res.json({ ok: true, ran: true, notifications: { ...result, pending: pendingCount } });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, db: dbReady ? "supabase" : "local", time: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`MK Fruit Panipat API listening on port ${PORT} (db: ${dbReady ? "supabase" : "local"})`));

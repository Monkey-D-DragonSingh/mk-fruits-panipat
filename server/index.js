require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

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

/* ---------- Local JSON database fallback (used when Supabase not connected) ---------- */
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "bookings.json");

function ensureLocalDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");
}
function readLocalBookings() {
  try {
    ensureLocalDb();
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function writeLocalBookings(list) {
  ensureLocalDb();
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}
function genId() {
  return (crypto.randomUUID && crypto.randomUUID()) || `loc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------- Owner sessions ---------- */
const sessions = new Map();
function issueToken() {
  const token = `${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 12)}`;
  sessions.set(token, { createdAt: Date.now() });
  // simple cleanup: drop sessions older than 12h
  for (const [t, s] of sessions) {
    if (Date.now() - s.createdAt > 12 * 60 * 60 * 1000) sessions.delete(t);
  }
  return token;
}
function authRequired(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  next();
}

// Owner login (used by the separate owner panel)
app.post("/api/owner/login", (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== process.env.OWNER_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Invalid owner password" });
  }
  const token = issueToken();
  return res.json({ ok: true, token });
});

// Create a booking (called from the customer facing form)
app.post("/api/bookings", async (req, res) => {
  const { name, phone, email, date, time, guests, package: pkg, notes, items, ref } = req.body || {};
  if (!name || !phone || !date || !time || !guests || !pkg) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }
  const bookingRef = ref || `MKFP-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
  const now = new Date().toISOString();
  const row = {
    id: genId(),
    ref: bookingRef,
    name,
    phone,
    email: email || null,
    date,
    time,
    guests: Number(guests),
    package: pkg,
    notes: notes || null,
    items: Array.isArray(items) ? items : [],
    status: "pending",
    created_at: now,
    updated_at: now,
  };

  if (dbReady) {
    const { data, error } = await supabase.from("bookings").insert([{
      ref: row.ref, name: row.name, phone: row.phone, email: row.email, date: row.date, time: row.time,
      guests: row.guests, package: row.package, notes: row.notes, items: row.items, status: row.status,
    }]).select().single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(201).json({ ok: true, data });
  }

  const list = readLocalBookings();
  list.unshift(row);
  writeLocalBookings(list.slice(0, 2000));
  return res.status(201).json({ ok: true, data: row, storage: "local" });
});

// List bookings (owner only — requires bearer token)
app.get("/api/bookings", authRequired, async (req, res) => {
  if (dbReady) {
    let query = supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (req.query.status) query = supabase.from("bookings").select("*").eq("status", req.query.status).order("created_at", { ascending: false });
    const { data, error } = await query;
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  }
  let data = readLocalBookings();
  if (req.query.status) data = data.filter((b) => b.status === req.query.status);
  data.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  return res.json({ ok: true, data, storage: "local" });
});

// Update booking status (owner only — requires bearer token)
app.patch("/api/bookings/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ ok: false, error: "status required" });
  if (dbReady) {
    const { data, error } = await supabase.from("bookings").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  }
  const list = readLocalBookings();
  const idx = list.findIndex((b) => String(b.id) === String(id) || String(b.ref) === String(id));
  if (idx === -1) return res.status(404).json({ ok: false, error: "Booking not found" });
  list[idx] = { ...list[idx], status, updated_at: new Date().toISOString() };
  writeLocalBookings(list);
  return res.json({ ok: true, data: list[idx] });
});

// Delete booking (owner only — requires bearer token)
app.delete("/api/bookings/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  if (dbReady) {
    const { data, error } = await supabase.from("bookings").delete().eq("id", id).select().single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  }
  const list = readLocalBookings();
  const idx = list.findIndex((b) => String(b.id) === String(id) || String(b.ref) === String(id));
  if (idx === -1) return res.status(404).json({ ok: false, error: "Booking not found" });
  const [removed] = list.splice(idx, 1);
  writeLocalBookings(list);
  return res.json({ ok: true, data: removed });
});

// Cron endpoint — protected via x-cron-secret header (for cronbot / scheduled jobs)
app.get("/api/cron", async (req, res) => {
  const secret = req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ ok: false, error: "unauthorized" });
  // TODO: send WhatsApp/SMS/email reminders for upcoming bookings, cleanup, etc.
  return res.json({ ok: true, ran: true });
});

app.listen(PORT, () => console.log(`MK Fruits Panipat API listening on port ${PORT}`));

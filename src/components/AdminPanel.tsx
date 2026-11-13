import { useEffect, useState, type FormEvent } from "react";
import {
  deleteBooking,
  exportBookings,
  getBookings,
  loginOwner,
  logoutOwner,
  updateBookingStatus,
  type Booking,
} from "../lib/api";
import { deleteLocalBooking, getLocalBookings, updateLocalBooking } from "../lib/localBookings";

const TOKEN_KEY = "mkfp_owner_token";

function toWaNumber(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
}

function AdminBookingCard({
  b,
  onStatus,
  onDelete,
}: {
  b: Booking;
  onStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const status = b.status || "pending";
  const id = String(b.id || b.ref || "");
  const tel = `tel:${String(b.phone || "").replace(/\s/g, "")}`;
  const waNum = toWaNumber(b.phone || "");
  const waText = encodeURIComponent(`Hi ${b.name}, regarding your MK Fruits wedding fruit stall booking ${b.ref || id} on ${b.date} (${b.time}) for ${b.guests} guests.`);
  const waLink = waNum ? `https://wa.me/${waNum}?text=${waText}` : "";

  return (
    <article className="admin-card">
      <div className="admin-card-top">
        <span className="admin-ref">{b.ref || b.id}</span>
        <span className={`admin-status status-${status}`}>{status}</span>
      </div>
      <div className="admin-meta">
        <p>
          <strong>Name:</strong> {b.name}
        </p>
        <p>
          <strong>Phone:</strong>{" "}
          <a href={tel} style={{ color: "var(--color-primary)" }}>{b.phone}</a>
        </p>
        {b.email ? (
          <p>
            <strong>Email:</strong> <a href={`mailto:${b.email}`} style={{ color: "var(--color-primary)" }}>{b.email}</a>
          </p>
        ) : null}
        <p>
          <strong>Event Date:</strong> {b.date}
        </p>
        <p>
          <strong>Time:</strong> {b.time}
        </p>
        <p>
          <strong>Guests:</strong> {String(b.guests ?? "")}
        </p>
        {b.package ? (
          <p>
            <strong>Service:</strong> {b.package}
          </p>
        ) : null}
        {b.notes ? (
          <p>
            <strong>Notes:</strong> {b.notes}
          </p>
        ) : null}
        {b._local ? (
          <p>
            <strong>Source:</strong> Local (not synced to database)
          </p>
        ) : null}
      </div>
      <div className="admin-actions-row">
        <a className="btn btn-secondary btn-sm" href={tel}>Call</a>
        {waLink ? <a className="btn btn-secondary btn-sm" href={waLink} target="_blank" rel="noreferrer">WhatsApp</a> : null}
        {status === "pending" ? (
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => onStatus(id, "confirmed")}>
            Mark Confirmed
          </button>
        ) : null}
        {status === "confirmed" ? (
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => onStatus(id, "completed")}>
            Mark Completed
          </button>
        ) : null}
        <button className="btn btn-secondary btn-sm" type="button" onClick={() => onStatus(id, "cancelled")}>
          Cancel
        </button>
        <button className="btn btn-primary btn-sm" type="button" onClick={() => onDelete(id)}>
          Delete
        </button>
      </div>
    </article>
  );
}

export default function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [gateError, setGateError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setToken(null);
      setPassword("");
      setGateError("");
      setBookings([]);
      setActionError("");
      setPwVisible(false);
      setSearch("");
      try {
        sessionStorage.removeItem(TOKEN_KEY);
      } catch {
        /* storage unavailable */
      }
    }
  }, [open]);

  function mergeBookings(remote: Booking[]): Booking[] {
    const local = getLocalBookings();
    const remoteKeys = new Set(remote.map((b) => String(b.id || b.ref || "")));
    const extras = local.filter((b) => {
      const key = String(b.id || b.ref || "");
      return key && !remoteKeys.has(key);
    });
    return [...extras, ...remote];
  }

  async function loadBookings(bearer: string) {
    const res = await getBookings(bearer);
    if (res.ok && res.data) {
      setBookings(mergeBookings(res.data));
      setActionError("");
      return;
    }
    const local = getLocalBookings();
    setBookings(local);
    setActionError(local.length ? "Showing locally saved bookings (backend/database unavailable)." : (res.error || "Failed to load bookings."));
  }

  useEffect(() => {
    if (!open || !token) return;
    const bearer = token;
    let cancelled = false;
    setLoading(true);
    loadBookings(bearer).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, token]);

  useEffect(() => {
    if (!open || !token) return;
    const handler = () => {
      void loadBookings(token);
    };
    window.addEventListener("mkfp:bookings-updated", handler);
    return () => window.removeEventListener("mkfp:bookings-updated", handler);
  }, [open, token]);

  if (!open) return null;

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (password.trim().length < 4) {
      setGateError("Please enter the owner password.");
      return;
    }
    const res = await loginOwner(password);
    if (res.ok && res.token) {
      setToken(res.token);
      setPassword("");
      setGateError("");
      setActionError("");
    } else {
      setGateError(res.error || "Invalid owner password. Please try again.");
    }
  }

  async function handleRefresh() {
    if (!token) return;
    setLoading(true);
    await loadBookings(token);
    setLoading(false);
  }

  async function handleStatus(id: string, status: string) {
    if (!token) return;
    const target = bookings.find((b) => String(b.id) === String(id) || String(b.ref) === String(id));
    if (target?._local) {
      updateLocalBooking(id, status);
      await loadBookings(token);
      return;
    }
    const res = await updateBookingStatus(token, id, status);
    if (res.ok) {
      await loadBookings(token);
    } else {
      setActionError(res.error || "Failed to update booking.");
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    const target = bookings.find((b) => String(b.id) === String(id) || String(b.ref) === String(id));
    if (target?._local) {
      deleteLocalBooking(id);
      await loadBookings(token);
      return;
    }
    const res = await deleteBooking(token, id);
    if (res.ok) {
      await loadBookings(token);
    } else {
      setActionError(res.error || "Failed to delete booking.");
    }
  }

  async function handleLogout() {
    if (token) await logoutOwner(token);
    setToken(null);
    setBookings([]);
    setActionError("");
  }

  async function handleExport(format: "json" | "csv") {
    if (!token) return;
    const res = await exportBookings(token, format);
    if (!res.ok) setActionError(res.error || "Export failed");
  }

  const q = search.trim().toLowerCase();
  const filteredBookings = q
    ? bookings.filter((b) => {
        const hay = [b.name, b.phone, b.email, b.ref, b.id, b.package]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
    : bookings;

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => (b.status || "pending") === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
  };

  return (
    <div className="admin-overlay" role="dialog" aria-modal="true" aria-label="Owner panel">
      <div className="admin-overlay-backdrop" onClick={onClose} />
      <div className="admin-overlay-panel">
        <div className="admin-overlay-head">
          <div>
            <p className="eyebrow">Owner Panel</p>
            <h2>Bookings Dashboard</h2>
          </div>
          <button className="btn btn-secondary btn-sm" type="button" onClick={async () => { if (token) await logoutOwner(token); try { sessionStorage.removeItem(TOKEN_KEY); } catch {} setToken(null); onClose(); }} aria-label="Close owner panel">
            Close
          </button>
        </div>

        {!token ? (
          <div id="ownerGate">
            <form className="booking-form" id="ownerPasswordForm" onSubmit={handleLogin} noValidate>
              <div className="field">
                <label htmlFor="ownerPassword">
                  Owner Password <span className="optional">(only the owner should open this panel)</span>
                </label>
                <div className="input-with-toggle">
                  <input
                    className="input"
                    type={pwVisible ? "text" : "password"}
                    id="ownerPassword"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter owner password"
                    autoComplete="off"
                  />
                  <button
                    className="password-toggle"
                    id="ownerPasswordToggle"
                    type="button"
                    aria-label={pwVisible ? "Hide password" : "Show password"}
                    aria-pressed={pwVisible}
                    onClick={() => setPwVisible((v) => !v)}
                  >
                    {pwVisible ? (
                      <svg className="pw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5s8.577 2.911 9.963 7.178c.07.207.07.431 0 .639a1.012 1.012 0 010-.639C20.577 7.51 16.64 4.5 12 4.5 7.36 4.5 3.423 7.51 2.036 12.322z" />
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg className="pw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228C3.28 8.2 1 10.58 1 13.5a10.523 10.523 0 0 0 2 9.977c.338.072.678.194.997.291M6.228 6.228 3 3m3.228 3.228 3.65 3.65m2.83-2.83 3.65-3.65m0 0a3 3 0 1 0 5.001-5.001M3 3l9.228 9.228" />
                        <line x1="8" y1="8" x2="16" y2="16" />
                        <line x1="16" y1="8" x2="8" y2="16" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="field-error" id="ownerGateError">
                  {gateError}
                </p>
              </div>
              <button className="btn btn-primary btn-block btn-lg" type="submit">
                Open Dashboard
              </button>
              <p className="form-note">This panel is private to the business owner. Customers never see it.</p>
            </form>
          </div>
        ) : (
          <>
            <div className="admin-stats" id="adminStats">
              <div className="admin-stat">
                <strong id="statTotal">{stats.total}</strong>
                <span>Total Bookings</span>
              </div>
              <div className="admin-stat">
                <strong id="statPending">{stats.pending}</strong>
                <span>Pending</span>
              </div>
              <div className="admin-stat">
                <strong id="statConfirmed">{stats.confirmed}</strong>
                <span>Confirmed</span>
              </div>
            </div>

            <div className="admin-actions">
              <button className="btn btn-secondary" id="adminRefresh" type="button" onClick={handleRefresh}>
                {loading ? "Refreshing…" : "Refresh Bookings"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => handleExport("csv")}>
                Export CSV
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => handleExport("json")}>
                Export JSON
              </button>
              <button className="btn btn-secondary" id="adminLogout" type="button" onClick={handleLogout}>
                Owner Logout
              </button>
            </div>

            <div className="field" style={{ maxWidth: 520, margin: "0 auto 20px" }}>
              <label htmlFor="adminSearch">Search booking</label>
              <input
                className="input"
                type="search"
                id="adminSearch"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, ref..."
                autoComplete="off"
              />
              {q ? (
                <p className="form-note" style={{ marginTop: 8 }}>
                  Showing {filteredBookings.length} of {bookings.length} bookings
                </p>
              ) : null}
            </div>

            {actionError ? <p className="field-error" style={{ textAlign: "center", marginBottom: 16 }}>{actionError}</p> : null}

            <div id="adminList" className="admin-list">
              {loading ? <div className="admin-empty">Loading bookings…</div> : null}
              {!loading && bookings.length === 0 ? <div className="admin-empty">No bookings yet. New wedding fruit stall booking requests will appear here.</div> : null}
              {!loading && bookings.length > 0 && filteredBookings.length === 0 ? <div className="admin-empty">No bookings match "{search}".</div> : null}
              {!loading
                ? filteredBookings.map((b) => <AdminBookingCard key={String(b.id || b.ref || `${b.name}-${b.date}`)} b={b} onStatus={handleStatus} onDelete={handleDelete} />)
                : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

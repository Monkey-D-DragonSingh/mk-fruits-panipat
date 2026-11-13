export const API_BASE = import.meta.env.DEV ? `http://${window.location.hostname}:3001` : "";

export interface Booking {
  id?: string;
  ref?: string;
  name: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  guests: number;
  package?: string;
  notes?: string;
  items?: any[];
  status?: string;
  createdAt?: string;
  created_at?: string;
  updated_at?: string;
  _local?: boolean;
}

export async function submitBooking(input: Omit<Booking, "id" | "status" | "createdAt">): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json.ok) return { ok: false, error: (json && json.error) || "Booking submission failed" };
    return { ok: true, data: json.data };
  } catch (err) {
    return { ok: false, error: "Backend not reachable yet — kept local" };
  }
}

export async function loginOwner(password: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/owner/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json.ok || !json.token) return { ok: false, error: (json && json.error) || "Invalid owner password" };
    return { ok: true, token: json.token };
  } catch (err) {
    return { ok: false, error: "Backend not reachable" };
  }
}

export async function getBookings(token: string): Promise<{ ok: boolean; data?: any[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/bookings`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json.ok) return { ok: false, error: (json && json.error) || "Failed to load bookings" };
    return { ok: true, data: json.data || [] };
  } catch (err) {
    return { ok: false, error: "Backend not reachable" };
  }
}

export async function updateBookingStatus(token: string, id: string, status: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json.ok) return { ok: false, error: (json && json.error) || "Failed to update" };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Backend not reachable" };
  }
}

export async function deleteBooking(token: string, id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json.ok) return { ok: false, error: (json && json.error) || "Failed to delete" };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Backend not reachable" };
  }
}

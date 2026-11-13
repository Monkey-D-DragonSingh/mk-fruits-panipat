import type { Booking } from "./api";

const KEY = "mkfp_local_bookings";

function read(): any[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: any[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export function getLocalBookings(): Booking[] {
  return read() as Booking[];
}

export function saveLocalBooking(b: Booking) {
  const items = read();
  items.unshift({ ...b, _local: true });
  write(items.slice(0, 100));
}

export function updateLocalBooking(id: string, status: string) {
  const items = read().map((b) => (String(b.id) === String(id) || String(b.ref) === String(id) ? { ...b, status } : b));
  write(items);
}

export function deleteLocalBooking(id: string) {
  const items = read().filter((b) => String(b.id) !== String(id) && String(b.ref) !== String(id));
  write(items);
}

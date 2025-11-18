export function todayISO(ref: Date = new Date()): string {
  const d = ref;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function weekRange(ref: Date = new Date()): { monday: Date; sunday: Date } {
  const now = new Date(ref);
  const day = now.getDay(); // 0 Sunday..6 Saturday
  const diffToMonday = (day + 6) % 7; // days since Monday
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

export function formatDate(d: Date): string {
  return todayISO(d);
}

export function daysAgo(n: number, ref: Date = new Date()): Date {
  const d = new Date(ref);
  d.setDate(d.getDate() - n);
  return d;
}


export function rupiah(value: number): string {
  return "Rp " + new Intl.NumberFormat("id-ID").format(Math.max(0, Math.round(value)));
}

export function waLink(number: string, text: string): string {
  const clean = (number || "").replace(/[^0-9]/g, "");
  const normalized = clean.startsWith("0") ? "62" + clean.slice(1) : clean;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function tanggal(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function waktu(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

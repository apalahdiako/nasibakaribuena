import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone } from "lucide-react";
import { ordersQuery } from "@/lib/queries";
import { useRealtime } from "@/hooks/useRealtime";
import { rupiah, tanggal, waLink } from "@/lib/format";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/pelanggan")({ component: Customers });

type Row = {
  key: string;
  name: string;
  phone: string;
  orders: number;
  total: number;
  last: string;
};

function Customers() {
  const { data: orders = [] } = useQuery(ordersQuery);
  const [q, setQ] = useState("");
  useRealtime({ channelName: "crm", tables: { orders_log: ["orders_log"] } });

  const rows = useMemo(() => {
    const map = new Map<string, Row>();
    for (const o of orders) {
      const key = (o.phone || o.customer_name || "anonim").trim().toLowerCase();
      const row = map.get(key) ?? { key, name: o.customer_name || "Tanpa nama", phone: o.phone, orders: 0, total: 0, last: o.created_at };
      row.orders += 1;
      row.total += o.total;
      if (o.created_at > row.last) {
        row.last = o.created_at;
        row.name = o.customer_name || row.name;
      }
      map.set(key, row);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [orders]);

  const filtered = rows.filter((r) => (r.name + r.phone).toLowerCase().includes(q.toLowerCase()));
  const repeat = rows.filter((r) => r.orders > 1).length;

  const stats = [
    { label: "Total pelanggan", value: rows.length },
    { label: "Repeat customer", value: repeat },
    { label: "Pelanggan baru", value: rows.length - repeat },
    { label: "Belanja rata-rata", value: rupiah(rows.length ? rows.reduce((s, r) => s + r.total, 0) / rows.length : 0) },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Pelanggan (CRM)</h1>
        <p className="text-sm text-muted-foreground">Dirangkum otomatis dari riwayat pesanan.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-extrabold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau nomor…" className="pl-9" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Belum ada pelanggan tercatat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Nama</th>
                  <th className="p-3">Kontak</th>
                  <th className="p-3">Order</th>
                  <th className="p-3">Total belanja</th>
                  <th className="p-3">Terakhir</th>
                  <th className="p-3">Segmen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.key} className="border-t border-border">
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3">
                      {r.phone ? (
                        <a href={waLink(r.phone, `Halo ${r.name}, ada promo baru dari Nasi Bakar Ibu Ena!`)} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          <Phone className="h-3 w-3" /> {r.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">{r.orders}</td>
                    <td className="p-3 font-semibold">{rupiah(r.total)}</td>
                    <td className="p-3">{tanggal(r.last)}</td>
                    <td className="p-3">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-[0.7rem] font-semibold " +
                          (r.orders > 1 ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground")
                        }
                      >
                        {r.orders > 1 ? "Repeat" : "Baru"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

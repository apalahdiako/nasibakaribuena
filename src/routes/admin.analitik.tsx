import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Download } from "lucide-react";
import { ordersQuery, type OrderLog } from "@/lib/queries";
import { useRealtime } from "@/hooks/useRealtime";
import { rupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/analitik")({ component: Analytics });

const COLORS = ["#111111", "#c9a227", "#7c9a6d", "#8b8b8b", "#d97706"];
type Item = { name?: string; qty?: number };

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function Analytics() {
  const { data: orders = [] } = useQuery(ordersQuery);
  const [days, setDays] = useState(7);
  useRealtime({ channelName: "analytics", tables: { orders_log: ["orders_log"] } });

  const scoped = useMemo(() => {
    const min = Date.now() - days * 864e5;
    return orders.filter((o) => new Date(o.created_at).getTime() >= min && o.status !== "batal");
  }, [orders, days]);

  const revenue = scoped.reduce((s, o) => s + o.total, 0);
  const aov = scoped.length ? revenue / scoped.length : 0;

  const trend = useMemo(() => {
    const map = new Map<string, { day: string; omzet: number; order: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      map.set(dayKey(d), { day: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }), omzet: 0, order: 0 });
    }
    for (const o of scoped) {
      const k = dayKey(new Date(o.created_at));
      const row = map.get(k);
      if (row) {
        row.omzet += o.total;
        row.order += 1;
      }
    }
    return Array.from(map.values());
  }, [scoped, days]);

  const byChannel = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of scoped) m.set(o.channel, (m.get(o.channel) ?? 0) + o.total);
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [scoped]);

  const topMenu = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of scoped) {
      const items = Array.isArray(o.items) ? (o.items as Item[]) : [];
      for (const it of items) m.set(it.name ?? "Item", (m.get(it.name ?? "Item") ?? 0) + (it.qty ?? 1));
    }
    return Array.from(m, ([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [scoped]);

  const hourly = useMemo(() => {
    const arr = Array.from({ length: 24 }, (_, h) => ({ jam: `${String(h).padStart(2, "0")}`, order: 0 }));
    for (const o of scoped) arr[new Date(o.created_at).getHours()]!.order += 1;
    return arr;
  }, [scoped]);

  const maxHour = Math.max(1, ...hourly.map((h) => h.order));

  function exportCsv() {
    const rows: (string | number)[][] = [
      ["Tanggal", "Nama", "Kanal", "Status", "Total"],
      ...scoped.map((o: OrderLog) => [
        new Date(o.created_at).toLocaleString("id-ID"),
        o.customer_name,
        o.channel,
        o.status,
        o.total,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${days}hari.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cards = [
    { label: "Omzet", value: rupiah(revenue) },
    { label: "Transaksi", value: scoped.length },
    { label: "Rata-rata transaksi (AOV)", value: rupiah(aov) },
    { label: "Kanal aktif", value: byChannel.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Sales & Analytics</h1>
          <p className="text-sm text-muted-foreground">Data langsung dari pesanan yang tercatat.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-9 rounded-xl border border-border bg-card px-3 text-sm"
          >
            <option value={7}>7 hari</option>
            <option value={30}>30 hari</option>
            <option value={90}>90 hari</option>
          </select>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-extrabold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft xl:col-span-2">
          <h2 className="mb-4 text-sm font-bold">Tren omzet</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} width={70} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                <Tooltip formatter={(v) => rupiah(Number(v))} />
                <Line type="monotone" dataKey="omzet" stroke="#111111" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-4 text-sm font-bold">Kontribusi kanal</h2>
          <div className="h-64">
            {byChannel.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byChannel} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                    {byChannel.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v) => rupiah(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-4 text-sm font-bold">Menu terlaris</h2>
          <div className="h-64">
            {topMenu.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topMenu} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" fontSize={11} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={110} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#c9a227" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-4 text-sm font-bold">Heatmap jam ramai</h2>
          <div className="grid grid-cols-12 gap-1">
            {hourly.map((h) => (
              <div key={h.jam} className="text-center">
                <div
                  className="mx-auto h-8 w-full rounded-md"
                  style={{ backgroundColor: `rgba(17,17,17,${0.08 + (h.order / maxHour) * 0.85})` }}
                  title={`${h.jam}:00 — ${h.order} order`}
                />
                <span className="text-[0.6rem] text-muted-foreground">{h.jam}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

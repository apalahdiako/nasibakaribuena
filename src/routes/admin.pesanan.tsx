import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, Phone, MapPin, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ordersQuery, type OrderLog } from "@/lib/queries";
import { useRealtime, useNotificationSound } from "@/hooks/useRealtime";
import { logActivity } from "@/lib/activity";
import { rupiah, waktu, waLink } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/pesanan")({ component: OrdersBoard });

const COLUMNS = [
  { key: "baru", label: "Baru", tone: "bg-amber-500" },
  { key: "dikonfirmasi", label: "Dikonfirmasi", tone: "bg-sky-500" },
  { key: "diproses", label: "Dimasak", tone: "bg-orange-500" },
  { key: "siap", label: "Siap Diantar", tone: "bg-violet-500" },
  { key: "selesai", label: "Selesai", tone: "bg-emerald-500" },
] as const;

type Item = { name?: string; qty?: number; spicy?: string; note?: string };

function itemsOf(order: OrderLog): Item[] {
  return Array.isArray(order.items) ? (order.items as Item[]) : [];
}

function OrdersBoard() {
  const qc = useQueryClient();
  const ping = useNotificationSound();
  const [sound, setSound] = useState(true);
  const [channel, setChannel] = useState("semua");
  const [range, setRange] = useState<"hari" | "7" | "semua">("hari");
  const { data: orders = [], isLoading } = useQuery(ordersQuery);

  useRealtime({
    channelName: "orders-board",
    tables: { orders_log: ["orders_log"] },
    onEvent: (_t, payload) => {
      if (payload.eventType !== "INSERT") return;
      const row = payload.new as OrderLog;
      if (sound) ping();
      toast.success(`Pesanan baru dari ${row.customer_name || "pelanggan"}`, { description: rupiah(row.total) });
    },
  });

  useEffect(() => {
    document.title = "Pesanan — Dashboard Ibu Ena";
  }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    return orders.filter((o) => {
      if (channel !== "semua" && o.channel !== channel) return false;
      const age = now - new Date(o.created_at).getTime();
      if (range === "hari" && age > 864e5) return false;
      if (range === "7" && age > 7 * 864e5) return false;
      return true;
    });
  }, [orders, channel, range]);

  const channels = useMemo(() => Array.from(new Set(orders.map((o) => o.channel))), [orders]);

  async function move(order: OrderLog, status: string) {
    qc.setQueryData<OrderLog[]>(["orders_log"], (prev) =>
      (prev ?? []).map((o) => (o.id === order.id ? { ...o, status } : o)),
    );
    const { error } = await supabase.from("orders_log").update({ status }).eq("id", order.id);
    if (error) {
      toast.error("Gagal memperbarui status");
      qc.invalidateQueries({ queryKey: ["orders_log"] });
      return;
    }
    void logActivity("ubah status pesanan", "orders_log", `${order.customer_name} → ${status}`);
  }

  async function cancel(order: OrderLog) {
    await move(order, "batal");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Order Management</h1>
          <p className="text-sm text-muted-foreground">Papan kanban realtime — status berubah langsung di semua layar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="h-9 rounded-xl border border-border bg-card px-3 text-sm capitalize"
          >
            <option value="semua">Semua kanal</option>
            {channels.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as typeof range)}
            className="h-9 rounded-xl border border-border bg-card px-3 text-sm"
          >
            <option value="hari">24 jam terakhir</option>
            <option value="7">7 hari</option>
            <option value="semua">Semua</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => setSound((s) => !s)} className="gap-2">
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {sound ? "Suara aktif" : "Suara mati"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-5">
          {COLUMNS.map((c) => (
            <div key={c.key} className="h-56 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {COLUMNS.map((col, idx) => {
            const cards = filtered.filter((o) => o.status === col.key);
            const next = COLUMNS[idx + 1];
            return (
              <section key={col.key} className="rounded-2xl border border-border bg-card/60 p-3">
                <header className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <span className={`h-2 w-2 rounded-full ${col.tone}`} />
                    {col.label}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{cards.length}</span>
                </header>
                <div className="space-y-3">
                  {cards.length === 0 && <p className="px-1 pb-2 text-xs text-muted-foreground">Kosong</p>}
                  {cards.map((o) => (
                    <article key={o.id} className="rounded-xl border border-border bg-card p-3 shadow-soft">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold">{o.customer_name || "Tanpa nama"}</p>
                          <p className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                            <Clock className="h-3 w-3" /> {waktu(o.created_at)} · <span className="capitalize">{o.channel}</span>
                          </p>
                        </div>
                        <span className="text-sm font-bold">{rupiah(o.total)}</span>
                      </div>
                      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                        {itemsOf(o).map((it, i) => (
                          <li key={i}>
                            {it.qty ?? 1}× {it.name ?? "Item"}
                            {it.spicy ? ` · ${it.spicy}` : ""}
                          </li>
                        ))}
                      </ul>
                      {o.address && (
                        <p className="mt-2 flex items-start gap-1 text-[0.7rem] text-muted-foreground">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {o.address}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {next && (
                          <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => move(o, next.key)}>
                            {next.label}
                          </Button>
                        )}
                        {o.phone && (
                          <a
                            href={waLink(o.phone, `Halo ${o.customer_name}, pesanan Anda di Nasi Bakar Ibu Ena sedang kami proses.`)}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs"
                          >
                            <Phone className="h-3 w-3" /> WA
                          </a>
                        )}
                        {col.key !== "selesai" && (
                          <button onClick={() => cancel(o)} className="h-7 rounded-md px-2 text-xs text-destructive hover:bg-destructive/10">
                            Batal
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {filtered.some((o) => o.status === "batal") && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-bold">Dibatalkan</h2>
          <div className="flex flex-wrap gap-2">
            {filtered
              .filter((o) => o.status === "batal")
              .map((o) => (
                <span key={o.id} className="rounded-full bg-muted px-3 py-1 text-xs">
                  {o.customer_name} · {rupiah(o.total)}
                </span>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

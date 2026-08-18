import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { notificationsQuery } from "@/lib/queries";
import { useRealtime } from "@/hooks/useRealtime";
import { tanggal, waktu } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/notifikasi")({ component: NotifPage });

const TYPES = ["semua", "transaksi", "voucher", "kasbon", "invoice", "review", "komplain", "stok"] as const;

function NotifPage() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery(notificationsQuery);
  const [filter, setFilter] = useState<string>("semua");
  useRealtime({ channelName: "notif-page", tables: { notifications: ["notifications"] } });

  const shown = items.filter((n) => filter === "semua" || n.type === filter);
  const unread = items.filter((n) => !n.is_read).length;

  async function markAll() {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }
  async function toggle(id: string, is_read: boolean) {
    await supabase.from("notifications").update({ is_read: !is_read }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Notifikasi</h1>
          <p className="text-sm text-muted-foreground">{unread} belum dibaca • update otomatis realtime.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={markAll}>
          <CheckCheck className="h-4 w-4" /> Tandai semua dibaca
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={
              "rounded-full border px-3 py-1 text-xs capitalize " +
              (filter === t ? "border-foreground bg-foreground text-background" : "border-border")
            }
          >
            {t}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {shown.map((n) => (
          <li key={n.id} className={"flex items-start gap-3 px-4 py-3 " + (n.is_read ? "" : "bg-accent/40")}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{n.title}</p>
              {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
              <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                {n.type} • {tanggal(n.created_at)} {waktu(n.created_at)}
              </p>
            </div>
            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => toggle(n.id, n.is_read)}>
              {n.is_read ? "Tandai belum" : "Tandai dibaca"}
            </button>
          </li>
        ))}
        {!shown.length && <li className="px-4 py-10 text-center text-sm text-muted-foreground">Belum ada notifikasi.</li>}
      </ul>
    </div>
  );
}

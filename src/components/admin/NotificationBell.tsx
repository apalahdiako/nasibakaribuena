import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { notificationsQuery, type Notification } from "@/lib/queries";
import { useNotificationSound } from "@/hooks/useRealtime";
import { waktu } from "@/lib/format";

export function NotificationBell() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery(notificationsQuery);
  const [open, setOpen] = useState(false);
  const ping = useNotificationSound();

  useEffect(() => {
    const channel = supabase
      .channel("notif-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const n = payload.new as Notification;
        qc.invalidateQueries({ queryKey: ["notifications"] });
        ping();
        toast(n.title, { description: n.body ?? undefined });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, ping]);

  const unread = items.filter((n) => !n.is_read);

  async function markAllRead() {
    if (!unread.length) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unread.map((n) => n.id));
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-border hover:bg-accent"
        aria-label="Notifikasi"
      >
        <Bell className="h-4 w-4" />
        {unread.length > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[0.6rem] font-bold text-destructive-foreground">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <p className="text-sm font-semibold">Notifikasi</p>
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={markAllRead}>
                Tandai dibaca
              </button>
            </div>
            <ul className="max-h-80 divide-y divide-border overflow-y-auto text-left">
              {items.slice(0, 20).map((n) => (
                <li key={n.id} className={"px-4 py-2.5 " + (n.is_read ? "" : "bg-accent/40")}>
                  <p className="text-xs font-semibold">{n.title}</p>
                  {n.body && <p className="text-[0.7rem] text-muted-foreground">{n.body}</p>}
                  <p className="mt-0.5 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                    {n.type} • {waktu(n.created_at)}
                  </p>
                </li>
              ))}
              {!items.length && <li className="px-4 py-6 text-center text-xs text-muted-foreground">Belum ada notifikasi.</li>}
            </ul>
            <Link
              to="/admin/notifikasi"
              onClick={() => setOpen(false)}
              className="block border-t border-border px-4 py-2.5 text-center text-xs font-semibold hover:bg-accent"
            >
              Lihat semua
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

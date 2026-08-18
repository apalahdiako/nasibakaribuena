import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Check, X, MessageSquareReply, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { reviewsQuery, menuQuery, type Review } from "@/lib/queries";
import { useRealtime } from "@/hooks/useRealtime";
import { logActivity } from "@/lib/activity";
import { tanggal, waktu, waLink } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/review")({ component: ReviewPage });

const STATUS = ["semua", "baru", "disetujui", "ditolak"] as const;

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={"h-3.5 w-3.5 " + (i <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
      ))}
    </span>
  );
}

function ReviewPage() {
  const qc = useQueryClient();
  const { data: reviews = [] } = useQuery(reviewsQuery);
  const { data: menu = [] } = useQuery(menuQuery);
  useRealtime({ channelName: "reviews", tables: { reviews: ["reviews"] } });

  const [status, setStatus] = useState<string>("semua");
  const [rating, setRating] = useState<number>(0);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [replyFor, setReplyFor] = useState<Review | null>(null);
  const [reply, setReply] = useState("");

  const shown = useMemo(
    () =>
      reviews.filter((r) => {
        const d = r.created_at.slice(0, 10);
        if (status !== "semua" && r.status !== status) return false;
        if (rating && r.rating !== rating) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
        if (q.trim()) {
          const needle = q.trim().toLowerCase();
          const hay = `${r.customer_name} ${r.phone ?? ""} ${r.comment ?? ""}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      }),
    [reviews, status, rating, q, from, to],
  );

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const pending = reviews.filter((r) => r.status === "baru").length;
  const complaints = reviews.filter((r) => r.is_complaint).length;

  async function moderate(r: Review, next: "disetujui" | "ditolak") {
    const { error } = await supabase
      .from("reviews")
      .update({ status: next, is_published: next === "disetujui" })
      .eq("id", r.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void logActivity("moderasi review", "reviews", `${r.customer_name} → ${next}`);
    qc.invalidateQueries({ queryKey: ["reviews"] });
    toast.success(next === "disetujui" ? "Review ditayangkan." : "Review ditolak.");
  }

  async function sendReply() {
    if (!replyFor) return;
    const { error } = await supabase.from("reviews").update({ admin_reply: reply || null }).eq("id", replyFor.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void logActivity("balas review", "reviews", replyFor.customer_name);
    setReplyFor(null);
    setReply("");
    qc.invalidateQueries({ queryKey: ["reviews"] });
    toast.success("Balasan tersimpan.");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Review & Komplain</h1>
        <p className="text-sm text-muted-foreground">
          Rata-rata <strong>{avg.toFixed(1)}★</strong> dari {reviews.length} ulasan • {pending} menunggu moderasi • {complaints} komplain.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari pelanggan / isi ulasan…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Dari tanggal</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Sampai tanggal</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          {STATUS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={
                "rounded-full border px-3 py-1 text-xs capitalize " +
                (status === s ? "border-foreground bg-foreground text-background" : "border-border")
              }
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          {[0, 5, 4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setRating(r)}
              className={
                "rounded-full border px-3 py-1 text-xs " +
                (rating === r ? "border-foreground bg-foreground text-background" : "border-border")
              }
            >
              {r === 0 ? "Semua rating" : `${r}★`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {shown.map((r) => {
          const item = menu.find((m) => m.id === r.menu_item_id);
          return (
            <article key={r.id} className="space-y-2 rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {r.customer_name}
                    {r.is_complaint && (
                      <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-[0.65rem] font-bold text-destructive">
                        Komplain
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tanggal(r.created_at)} {waktu(r.created_at)} {item ? `• ${item.name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Stars value={r.rating} />
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold capitalize " +
                      (r.status === "disetujui"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : r.status === "ditolak"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground")
                    }
                  >
                    {r.status}
                  </span>
                </div>
              </div>

              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              {r.admin_reply && (
                <p className="rounded-xl bg-accent/50 p-3 text-sm">
                  <span className="font-semibold">Balasan admin: </span>
                  {r.admin_reply}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => moderate(r, "disetujui")}>
                  <Check className="h-3.5 w-3.5" /> Setujui
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => moderate(r, "ditolak")}>
                  <X className="h-3.5 w-3.5" /> Tolak
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    setReplyFor(r);
                    setReply(r.admin_reply ?? "");
                  }}
                >
                  <MessageSquareReply className="h-3.5 w-3.5" /> Balas
                </Button>
                {r.phone && (
                  <a
                    className="rounded-md border border-border px-3 py-1.5 text-xs"
                    href={waLink(r.phone, `Halo ${r.customer_name}, terima kasih atas ulasannya untuk Nasi Bakar Ibu Ena 🙏`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </article>
          );
        })}
        {!shown.length && <p className="py-12 text-center text-sm text-muted-foreground">Tidak ada review sesuai filter.</p>}
      </div>

      {replyFor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setReplyFor(null)}>
          <div className="w-full max-w-md space-y-3 rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold">Balas {replyFor.customer_name}</h2>
            <Textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Tulis balasan (opsional)…" />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={sendReply}>
                Simpan balasan
              </Button>
              <Button variant="outline" onClick={() => setReplyFor(null)}>
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

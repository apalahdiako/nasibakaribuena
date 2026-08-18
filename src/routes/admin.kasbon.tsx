import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, X, Check, Ban, Wallet, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { kasbonQuery, type Kasbon } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";
import { logActivity } from "@/lib/activity";
import { rupiah, tanggal, waLink } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/kasbon")({ component: KasbonPage });

type Payment = { id: string; kasbon_id: string; amount: number; paid_at: string; actor_email: string | null };

const STATUSES = ["semua", "pengajuan", "disetujui", "ditolak", "sebagian", "lunas"] as const;

const badge: Record<string, string> = {
  pengajuan: "bg-amber-500/15 text-amber-600",
  disetujui: "bg-sky-500/15 text-sky-600",
  ditolak: "bg-destructive/10 text-destructive",
  sebagian: "bg-indigo-500/15 text-indigo-600",
  lunas: "bg-emerald-500/15 text-emerald-600",
};

function KasbonPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: rows = [] } = useQuery(kasbonQuery);
  const { data: payments = [] } = useQuery({
    queryKey: ["kasbon_payments"],
    queryFn: async (): Promise<Payment[]> => {
      const { data, error } = await supabase
        .from("kasbon_payments")
        .select("id, kasbon_id, amount, paid_at, actor_email")
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  useRealtime({ channelName: "kasbon", tables: { kasbon: ["kasbon"], notifications: ["kasbon_payments"] } });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("semua");
  const [form, setForm] = useState<{ name: string; phone: string; amount: number; due_date: string; note: string } | null>(null);
  const [payFor, setPayFor] = useState<Kasbon | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [detail, setDetail] = useState<Kasbon | null>(null);

  const shown = useMemo(
    () =>
      rows.filter((k) => {
        if (status !== "semua" && k.status !== status) return false;
        if (q.trim() && !`${k.name} ${k.phone ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
        return true;
      }),
    [rows, q, status],
  );

  const outstanding = rows
    .filter((k) => ["disetujui", "sebagian"].includes(k.status))
    .reduce((s, k) => s + (Number(k.amount) - Number(k.paid_amount)), 0);

  async function submitRequest() {
    if (!form?.name || !form.amount) {
      toast.error("Nama dan nominal wajib diisi");
      return;
    }
    const { error } = await supabase.from("kasbon").insert({
      name: form.name,
      phone: form.phone || null,
      amount: form.amount,
      due_date: form.due_date || null,
      note: form.note || null,
      status: "pengajuan",
      requested_by: user?.email ?? null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    void logActivity("ajukan kasbon", "kasbon", `${form.name} • ${rupiah(form.amount)}`);
    setForm(null);
    qc.invalidateQueries({ queryKey: ["kasbon"] });
    toast.success("Pengajuan kasbon dikirim.");
  }

  async function decide(k: Kasbon, approve: boolean) {
    const reason = approve ? null : prompt("Alasan penolakan?") ?? "";
    const { error } = await supabase
      .from("kasbon")
      .update({
        status: approve ? "disetujui" : "ditolak",
        approved_by: user?.email ?? null,
        approved_at: new Date().toISOString(),
        reject_reason: reason,
      })
      .eq("id", k.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void logActivity(approve ? "setujui kasbon" : "tolak kasbon", "kasbon", k.name);
    qc.invalidateQueries({ queryKey: ["kasbon"] });
  }

  async function savePayment() {
    if (!payFor || payAmount <= 0) {
      toast.error("Nominal pembayaran tidak valid");
      return;
    }
    const { error } = await supabase.from("kasbon_payments").insert({
      kasbon_id: payFor.id,
      amount: payAmount,
      actor_email: user?.email ?? null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    void logActivity("catat bayar kasbon", "kasbon", `${payFor.name} • ${rupiah(payAmount)}`);
    setPayFor(null);
    setPayAmount(0);
    qc.invalidateQueries({ queryKey: ["kasbon"] });
    qc.invalidateQueries({ queryKey: ["kasbon_payments"] });
    toast.success("Pembayaran tercatat.");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Kasbon</h1>
          <p className="text-sm text-muted-foreground">Sisa piutang aktif {rupiah(outstanding)} dari {rows.length} pengajuan.</p>
        </div>
        <Button className="gap-2" onClick={() => setForm({ name: "", phone: "", amount: 0, due_date: "", note: "" })}>
          <Plus className="h-4 w-4" /> Ajukan kasbon
        </Button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari nama / nomor HP…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
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
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Nama</th>
              <th className="px-4 py-2">Nominal</th>
              <th className="px-4 py-2">Terbayar</th>
              <th className="px-4 py-2">Sisa</th>
              <th className="px-4 py-2">Jatuh tempo</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.map((k) => {
              const sisa = Number(k.amount) - Number(k.paid_amount);
              return (
                <tr key={k.id} className="align-middle">
                  <td className="px-4 py-2">
                    <button className="font-semibold hover:underline" onClick={() => setDetail(k)}>
                      {k.name}
                    </button>
                    <p className="text-xs text-muted-foreground">{k.phone ?? "—"}</p>
                  </td>
                  <td className="px-4 py-2">{rupiah(Number(k.amount))}</td>
                  <td className="px-4 py-2">{rupiah(Number(k.paid_amount))}</td>
                  <td className="px-4 py-2 font-semibold">{rupiah(sisa)}</td>
                  <td className="px-4 py-2">{k.due_date ? tanggal(k.due_date) : "—"}</td>
                  <td className="px-4 py-2">
                    <span className={"rounded-full px-2 py-0.5 text-[0.65rem] font-semibold capitalize " + (badge[k.status] ?? "bg-muted")}>
                      {k.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap justify-end gap-1">
                      {k.status === "pengajuan" && (
                        <>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => decide(k, true)}>
                            <Check className="h-3.5 w-3.5" /> Setujui
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => decide(k, false)}>
                            <Ban className="h-3.5 w-3.5" /> Tolak
                          </Button>
                        </>
                      )}
                      {["disetujui", "sebagian"].includes(k.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => {
                            setPayFor(k);
                            setPayAmount(sisa);
                          }}
                        >
                          <Wallet className="h-3.5 w-3.5" /> Bayar
                        </Button>
                      )}
                      {k.phone && (
                        <a
                          className="rounded-md border border-border px-2 py-1 text-xs"
                          href={waLink(k.phone, `Halo ${k.name}, pengingat kasbon Nasi Bakar Ibu Ena sebesar ${rupiah(sisa)}.`)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WA
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!shown.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Belum ada kasbon.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setForm(null)}>
          <div className="w-full max-w-md space-y-3 rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Pengajuan kasbon</h2>
              <button onClick={() => setForm(null)} aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-1.5">
              <Label>Nama</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>No. HP</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Nominal</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Jatuh tempo</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Catatan</Label>
              <Textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <Button className="w-full" onClick={submitRequest}>
              Kirim pengajuan
            </Button>
          </div>
        </div>
      )}

      {payFor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setPayFor(null)}>
          <div className="w-full max-w-sm space-y-3 rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold">Bayar kasbon {payFor.name}</h2>
            <p className="text-sm text-muted-foreground">
              Sisa {rupiah(Number(payFor.amount) - Number(payFor.paid_amount))}
            </p>
            <Input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} />
            <Button className="w-full" onClick={savePayment}>
              Catat pembayaran
            </Button>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setDetail(null)}>
          <div className="w-full max-w-md space-y-3 rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Histori {detail.name}</h2>
              <button onClick={() => setDetail(null)} aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Diajukan oleh {detail.requested_by ?? "—"}</li>
              <li>Disetujui oleh {detail.approved_by ?? "—"}</li>
              {detail.reject_reason && <li className="text-destructive">Alasan tolak: {detail.reject_reason}</li>}
              {detail.note && <li>Catatan: {detail.note}</li>}
            </ul>
            <div className="divide-y divide-border rounded-xl border border-border">
              {payments
                .filter((p) => p.kasbon_id === detail.id)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>{tanggal(p.paid_at)}</span>
                    <span className="font-semibold">{rupiah(Number(p.amount))}</span>
                  </div>
                ))}
              {!payments.some((p) => p.kasbon_id === detail.id) && (
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">Belum ada pembayaran.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

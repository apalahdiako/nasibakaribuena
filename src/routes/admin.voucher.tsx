import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { vouchersQuery, type Voucher } from "@/lib/queries";
import { useRealtime } from "@/hooks/useRealtime";
import { logActivity } from "@/lib/activity";
import { rupiah, tanggal } from "@/lib/format";
import { checkVoucher } from "@/lib/voucher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/voucher")({ component: VoucherPage });

type Draft = Partial<Voucher>;

const EMPTY: Draft = {
  code: "",
  discount_type: "persen",
  discount_value: 10,
  min_spend: 0,
  quota: 0,
  is_active: true,
  starts_at: null,
  ends_at: null,
};

type Redemption = {
  id: string;
  code: string;
  ref_type: string;
  customer_name: string | null;
  discount_amount: number;
  created_at: string;
};

function VoucherPage() {
  const qc = useQueryClient();
  const { data: vouchers = [] } = useQuery(vouchersQuery);
  const { data: redemptions = [] } = useQuery({
    queryKey: ["voucher_redemptions"],
    queryFn: async (): Promise<Redemption[]> => {
      const { data, error } = await supabase
        .from("voucher_redemptions")
        .select("id, code, ref_type, customer_name, discount_amount, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  useRealtime({ channelName: "vouchers", tables: { notifications: ["voucher_redemptions"] } });

  async function save() {
    const code = (draft?.code ?? "").trim().toUpperCase();
    if (!code) {
      toast.error("Kode voucher wajib diisi");
      return;
    }
    setBusy(true);
    const payload = {
      code,
      discount_type: draft?.discount_type ?? "persen",
      discount_value: Number(draft?.discount_value ?? 0),
      min_spend: Number(draft?.min_spend ?? 0),
      quota: Number(draft?.quota ?? 0),
      starts_at: draft?.starts_at || null,
      ends_at: draft?.ends_at || null,
      is_active: draft?.is_active ?? true,
    };
    const res = draft?.id
      ? await supabase.from("vouchers").update(payload).eq("id", draft.id)
      : await supabase.from("vouchers").insert(payload);
    setBusy(false);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    void logActivity(draft?.id ? "ubah voucher" : "buat voucher", "vouchers", code);
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["vouchers"] });
    toast.success("Voucher tersimpan");
  }

  async function remove(v: Voucher) {
    if (!confirm(`Hapus voucher ${v.code}?`)) return;
    const { error } = await supabase.from("vouchers").delete().eq("id", v.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void logActivity("hapus voucher", "vouchers", v.code);
    qc.invalidateQueries({ queryKey: ["vouchers"] });
  }

  async function toggle(v: Voucher) {
    await supabase.from("vouchers").update({ is_active: !v.is_active }).eq("id", v.id);
    qc.invalidateQueries({ queryKey: ["vouchers"] });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Voucher</h1>
          <p className="text-sm text-muted-foreground">Kode diskon untuk kasir/POS dan invoice B2B.</p>
        </div>
        <Button className="gap-2" onClick={() => setDraft({ ...EMPTY })}>
          <Plus className="h-4 w-4" /> Voucher baru
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vouchers.map((v) => {
          const state = checkVoucher(v, Number(v.min_spend));
          return (
            <article key={v.id} className="space-y-2 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 font-mono text-lg font-bold">
                    <Ticket className="h-4 w-4" /> {v.code}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {v.discount_type === "persen" ? `${Number(v.discount_value)}%` : rupiah(Number(v.discount_value))} diskon
                  </p>
                </div>
                <Switch checked={v.is_active} onCheckedChange={() => toggle(v)} />
              </div>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                <li>Min. belanja {rupiah(Number(v.min_spend))}</li>
                <li>Kuota {v.quota > 0 ? `${v.used_count}/${v.quota}` : `tanpa batas (${v.used_count} dipakai)`}</li>
                <li>
                  Periode {v.starts_at ? tanggal(v.starts_at) : "—"} s/d {v.ends_at ? tanggal(v.ends_at) : "—"}
                </li>
              </ul>
              <p className={"text-xs font-semibold " + (state.ok ? "text-emerald-600" : "text-destructive")}>
                {state.ok ? "Siap dipakai" : state.reason}
              </p>
              <div className="flex gap-1 pt-1">
                <Button size="icon" variant="ghost" onClick={() => setDraft(v)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(v)} aria-label="Hapus">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </article>
          );
        })}
        {!vouchers.length && <p className="text-sm text-muted-foreground">Belum ada voucher.</p>}
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Riwayat pemakaian</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2">Kode</th>
                <th className="px-4 py-2">Sumber</th>
                <th className="px-4 py-2">Pelanggan</th>
                <th className="px-4 py-2 text-right">Diskon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {redemptions.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2">{tanggal(r.created_at)}</td>
                  <td className="px-4 py-2 font-mono">{r.code}</td>
                  <td className="px-4 py-2 uppercase">{r.ref_type}</td>
                  <td className="px-4 py-2">{r.customer_name ?? "—"}</td>
                  <td className="px-4 py-2 text-right">{rupiah(Number(r.discount_amount))}</td>
                </tr>
              ))}
              {!redemptions.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada voucher yang dipakai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setDraft(null)}>
          <div className="w-full max-w-md space-y-3 rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{draft.id ? "Edit voucher" : "Voucher baru"}</h2>
              <button onClick={() => setDraft(null)} aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-1.5">
              <Label>Kode</Label>
              <Input
                value={draft.code ?? ""}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                placeholder="ENAHEMAT10"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Tipe diskon</Label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={draft.discount_type ?? "persen"}
                  onChange={(e) => setDraft({ ...draft, discount_type: e.target.value })}
                >
                  <option value="persen">Persen (%)</option>
                  <option value="nominal">Nominal (Rp)</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Nilai</Label>
                <Input
                  type="number"
                  value={Number(draft.discount_value ?? 0)}
                  onChange={(e) => setDraft({ ...draft, discount_value: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Min. belanja</Label>
                <Input
                  type="number"
                  value={Number(draft.min_spend ?? 0)}
                  onChange={(e) => setDraft({ ...draft, min_spend: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Kuota (0 = bebas)</Label>
                <Input
                  type="number"
                  value={Number(draft.quota ?? 0)}
                  onChange={(e) => setDraft({ ...draft, quota: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Mulai</Label>
                <Input type="date" value={draft.starts_at ?? ""} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Berakhir</Label>
                <Input type="date" value={draft.ends_at ?? ""} onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={draft.is_active ?? true} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
              Aktif
            </label>
            <Button onClick={save} disabled={busy} className="w-full">
              {busy ? "Menyimpan…" : "Simpan"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

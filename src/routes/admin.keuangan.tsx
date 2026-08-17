import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { accountsQuery, journalQuery, transactionsQuery } from "@/lib/queries";
import { useRealtime } from "@/hooks/useRealtime";
import { rupiah, tanggal } from "@/lib/format";
import { logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/keuangan")({ component: Keuangan });

function Keuangan() {
  const qc = useQueryClient();
  const { data: accounts = [] } = useQuery(accountsQuery);
  const { data: journal = [] } = useQuery(journalQuery);
  const { data: trx = [] } = useQuery(transactionsQuery);
  useRealtime({ channelName: "finance", tables: { transactions: ["transactions", "journal_entries"] } });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), desc: "", code: "", debit: "", credit: "" });
  const [range, setRange] = useState(30);

  const since = useMemo(() => Date.now() - range * 86400000, [range]);
  const periodJournal = journal.filter((j) => new Date(j.entry_date).getTime() >= since);

  const typeOf = (code: string) => accounts.find((a) => a.code === code)?.type ?? "lainnya";
  const pendapatan = periodJournal.filter((j) => typeOf(j.account_code) === "pendapatan").reduce((s, j) => s + Number(j.credit), 0);
  const beban = periodJournal.filter((j) => typeOf(j.account_code) === "beban").reduce((s, j) => s + Number(j.debit), 0);
  const laba = pendapatan - beban;
  const kas = periodJournal.filter((j) => typeOf(j.account_code) === "aset").reduce((s, j) => s + Number(j.debit) - Number(j.credit), 0);
  const omzetKasir = trx.filter((t) => new Date(t.created_at).getTime() >= since).reduce((s, t) => s + Number(t.total), 0);

  async function addEntry() {
    if (!form.code || !form.desc) {
      toast.error("Pilih akun dan isi keterangan.");
      return;
    }
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("journal_entries").insert({
      entry_date: form.date,
      description: form.desc,
      account_code: form.code,
      debit: Number(form.debit) || 0,
      credit: Number(form.credit) || 0,
      ref_type: "manual",
      actor_email: auth.user?.email ?? null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    void logActivity("jurnal manual", "journal_entries", form.desc);
    setOpen(false);
    setForm({ date: new Date().toISOString().slice(0, 10), desc: "", code: "", debit: "", credit: "" });
    qc.invalidateQueries({ queryKey: ["journal_entries"] });
    toast.success("Jurnal tercatat.");
  }

  function exportKledo() {
    const rows = [
      ["Tanggal", "Nomor Akun", "Nama Akun", "Keterangan", "Debit", "Kredit"],
      ...periodJournal.map((j) => [
        j.entry_date,
        j.account_code,
        accounts.find((a) => a.code === j.account_code)?.name ?? "",
        j.description,
        String(j.debit),
        String(j.credit),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `jurnal-kledo-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cards = [
    { label: "Pendapatan", value: pendapatan },
    { label: "Beban", value: beban },
    { label: "Laba bersih", value: laba },
    { label: "Omzet kasir", value: omzetKasir },
    { label: "Arus kas (aset)", value: kas },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Keuangan & Akuntansi</h1>
          <p className="text-sm text-muted-foreground">Jurnal otomatis dari kasir, laba rugi, dan ekspor siap Kledo.</p>
        </div>
        <div className="flex gap-2">
          <select
            className="rounded-md border border-input bg-background px-3 text-sm"
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
          >
            <option value={7}>7 hari</option>
            <option value={30}>30 hari</option>
            <option value={90}>90 hari</option>
            <option value={365}>1 tahun</option>
          </select>
          <Button variant="outline" className="gap-2" onClick={exportKledo}>
            <Download className="h-4 w-4" /> Ekspor
          </Button>
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Jurnal
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">{c.label}</p>
            <p className={"mt-1 text-lg font-bold " + (c.label === "Laba bersih" && c.value < 0 ? "text-destructive" : "")}>
              {rupiah(c.value)}
            </p>
          </div>
        ))}
      </div>

      <section className="overflow-x-auto rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Buku Jurnal</h2>
        </div>
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Akun</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3 text-right">Debit</th>
              <th className="px-4 py-3 text-right">Kredit</th>
            </tr>
          </thead>
          <tbody>
            {periodJournal.slice(0, 100).map((j) => (
              <tr key={j.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2.5 text-muted-foreground">{tanggal(j.entry_date)}</td>
                <td className="px-4 py-2.5 font-mono text-xs">
                  {j.account_code} · {accounts.find((a) => a.code === j.account_code)?.name}
                </td>
                <td className="px-4 py-2.5">{j.description}</td>
                <td className="px-4 py-2.5 text-right">{Number(j.debit) ? rupiah(Number(j.debit)) : "—"}</td>
                <td className="px-4 py-2.5 text-right">{Number(j.credit) ? rupiah(Number(j.credit)) : "—"}</td>
              </tr>
            ))}
            {!periodJournal.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Belum ada jurnal pada periode ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="font-semibold">Bagan Akun (COA)</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <div key={a.id} className="rounded-xl border border-border px-3 py-2 text-sm">
              <span className="font-mono text-xs text-muted-foreground">{a.code}</span>
              <p className="font-medium">{a.name}</p>
              <p className="text-xs capitalize text-muted-foreground">{a.type}</p>
            </div>
          ))}
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Jurnal Manual</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Tanggal</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Akun</Label>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              >
                <option value="">— Pilih akun —</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.code}>
                    {a.code} · {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Keterangan</Label>
              <Input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Debit</Label>
                <Input type="number" value={form.debit} onChange={(e) => setForm({ ...form, debit: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Kredit</Label>
                <Input type="number" value={form.credit} onChange={(e) => setForm({ ...form, credit: e.target.value })} />
              </div>
            </div>
            <Button onClick={addEntry}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

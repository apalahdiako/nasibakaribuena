import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Download, Trash2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { invoicesQuery, invoiceItemsQuery, type Invoice } from "@/lib/queries";
import { useRealtime } from "@/hooks/useRealtime";
import { rupiah, tanggal, waLink } from "@/lib/format";
import { logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/invoice")({ component: InvoicePage });

const STATUS = ["draft", "terkirim", "lunas", "batal"] as const;
type Line = { name: string; qty: number; price: number };

function InvoicePage() {
  const qc = useQueryClient();
  const { data: invoices = [] } = useQuery(invoicesQuery);
  const { data: allItems = [] } = useQuery(invoiceItemsQuery);
  useRealtime({ channelName: "invoices", tables: { invoices: ["invoices"] } });

  const [open, setOpen] = useState(false);
  const [client, setClient] = useState("");
  const [phone, setPhone] = useState("");
  const [due, setDue] = useState("");
  const [lines, setLines] = useState<Line[]>([{ name: "", qty: 1, price: 0 }]);
  const [filter, setFilter] = useState<string>("semua");

  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const shown = invoices.filter((i) => filter === "semua" || i.status === filter);
  const outstanding = invoices.filter((i) => i.status === "terkirim").reduce((s, i) => s + Number(i.total), 0);

  async function create() {
    if (!client || !lines.some((l) => l.name)) {
      toast.error("Isi nama klien dan minimal satu item.");
      return;
    }
    const { data, error } = await supabase
      .from("invoices")
      .insert({
        customer_name: client,
        customer_phone: phone || null,
        due_date: due || null,
        subtotal: total,
        total,
        status: "draft",
      })
      .select()
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Gagal membuat invoice.");
      return;
    }
    await supabase
      .from("invoice_items")
      .insert(lines.filter((l) => l.name).map((l) => ({ invoice_id: data.id, name: l.name, qty: l.qty, price: l.price })));
    void logActivity("buat invoice", "invoices", data.invoice_no ?? client);
    setOpen(false);
    setClient("");
    setPhone("");
    setDue("");
    setLines([{ name: "", qty: 1, price: 0 }]);
    qc.invalidateQueries();
    toast.success("Invoice dibuat.");
  }

  async function setStatus(inv: Invoice, status: string) {
    await supabase
      .from("invoices")
      .update({ status })
      .eq("id", inv.id);
    void logActivity("ubah status invoice", "invoices", `${inv.invoice_no} → ${status}`);
    qc.invalidateQueries({ queryKey: ["invoices"] });
  }

  async function remove(id: string) {
    await supabase.from("invoices").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["invoices"] });
  }

  function sendWa(inv: Invoice) {
    const items = allItems.filter((it) => it.invoice_id === inv.id);
    const rows = items.map((it) => `• ${it.name} x${it.qty} — ${rupiah(Number(it.price) * it.qty)}`).join("\n");
    const text = `*INVOICE ${inv.invoice_no}*\nNasi Bakar Ibu Ena\n\nKepada: ${inv.customer_name}\nJatuh tempo: ${inv.due_date ? tanggal(inv.due_date) : "-"}\n\n${rows}\n\n*TOTAL: ${rupiah(Number(inv.total))}*\n\nMohon konfirmasi pembayaran. Terima kasih 🙏`;
    if (inv.customer_phone) window.open(waLink(inv.customer_phone, text), "_blank");
    else toast.error("Nomor klien belum diisi.");
  }

  function exportCsv() {
    const rows = [
      ["No Invoice", "Klien", "Tanggal", "Jatuh Tempo", "Total", "Status"],
      ...invoices.map((i) => [i.invoice_no, i.customer_name, tanggal(i.created_at), i.due_date ?? "", String(i.total), i.status]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Invoice B2B</h1>
          <p className="text-sm text-muted-foreground">
            Outstanding: <strong>{rupiah(outstanding)}</strong> dari {invoices.filter((i) => i.status === "terkirim").length} invoice.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={exportCsv}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Invoice Baru
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["semua", ...STATUS].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={
              "rounded-full border px-3 py-1 text-xs capitalize " +
              (filter === s ? "border-foreground bg-foreground text-background" : "border-border")
            }
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Klien</th>
              <th className="px-4 py-3">Jatuh tempo</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((i) => (
              <tr key={i.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{i.invoice_no}</td>
                <td className="px-4 py-3 font-medium">{i.customer_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{i.due_date ? tanggal(i.due_date) : "—"}</td>
                <td className="px-4 py-3 font-semibold">{rupiah(Number(i.total))}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs capitalize"
                    value={i.status}
                    onChange={(e) => setStatus(i, e.target.value)}
                  >
                    {STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => sendWa(i)}>
                      <Send className="h-3.5 w-3.5" /> WA
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(i.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Belum ada invoice pada filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice Baru</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Nama klien / perusahaan</Label>
              <Input value={client} onChange={(e) => setClient(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>No. WhatsApp</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Jatuh tempo</Label>
                <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Item</Label>
              {lines.map((l, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_70px_100px] gap-2">
                  <Input
                    placeholder="Deskripsi"
                    value={l.name}
                    onChange={(e) => setLines(lines.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
                  />
                  <Input
                    type="number"
                    value={l.qty}
                    onChange={(e) => setLines(lines.map((x, i) => (i === idx ? { ...x, qty: Number(e.target.value) } : x)))}
                  />
                  <Input
                    type="number"
                    value={l.price}
                    onChange={(e) => setLines(lines.map((x, i) => (i === idx ? { ...x, price: Number(e.target.value) } : x)))}
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setLines([...lines, { name: "", qty: 1, price: 0 }])}>
                + Tambah baris
              </Button>
            </div>
            <p className="text-right font-bold">Total: {rupiah(total)}</p>
            <Button onClick={create}>Simpan Invoice</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

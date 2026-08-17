import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Plus, Trash2, Receipt, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { menuQuery, recipesQuery, type MenuItem } from "@/lib/queries";
import { useRealtime } from "@/hooks/useRealtime";
import { rupiah, waLink } from "@/lib/format";
import { logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/kasir")({ component: Kasir });

type Line = { id: string; name: string; price: number; qty: number };
const METHODS = ["tunai", "kartu", "transfer", "qris"] as const;

function Kasir() {
  const qc = useQueryClient();
  const { data: menu = [] } = useQuery(menuQuery);
  const { data: recipes = [] } = useQuery(recipesQuery);
  useRealtime({ channelName: "pos", tables: { menu_items: ["menu_items"], transactions: ["transactions"] } });

  const [q, setQ] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [discountType, setDiscountType] = useState<"nominal" | "persen">("nominal");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("tunai");
  const [paid, setPaid] = useState("");
  const [busy, setBusy] = useState(false);

  const available = menu.filter(
    (m) => m.is_available && (m.name + (m.category ?? "")).toLowerCase().includes(q.toLowerCase()),
  );

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const discount = useMemo(() => {
    const v = Number(discountInput) || 0;
    return Math.min(subtotal, discountType === "persen" ? (subtotal * v) / 100 : v);
  }, [discountInput, discountType, subtotal]);
  const total = Math.max(0, subtotal - discount);
  const change = Math.max(0, (Number(paid) || 0) - total);

  function add(item: MenuItem) {
    setLines((prev) => {
      const found = prev.find((l) => l.id === item.id);
      if (found) return prev.map((l) => (l.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { id: item.id, name: item.name, price: Number(item.price), qty: 1 }];
    });
  }
  function setQty(id: string, delta: number) {
    setLines((prev) => prev.flatMap((l) => (l.id === id ? (l.qty + delta <= 0 ? [] : [{ ...l, qty: l.qty + delta }]) : [l])));
  }
  function reset() {
    setLines([]);
    setName("");
    setPhone("");
    setDiscountInput("");
    setPaid("");
    setMethod("tunai");
  }

  function receiptText(trxNo: string) {
    const rows = lines.map((l) => `• ${l.name} x${l.qty} — ${rupiah(l.price * l.qty)}`).join("\n");
    return `*STRUK NASI BAKAR IBU ENA*\nNo: ${trxNo}\n\n${rows}\n\nSubtotal: ${rupiah(subtotal)}\nDiskon: ${rupiah(discount)}\n*TOTAL: ${rupiah(total)}*\nBayar (${method}): ${rupiah(Number(paid) || 0)}\nKembali: ${rupiah(change)}\n\nTerima kasih 🙏`;
  }

  async function checkout() {
    if (!lines.length) return toast.error("Keranjang masih kosong.");
    if (method === "tunai" && (Number(paid) || 0) < total) return toast.error("Jumlah bayar kurang dari total.");
    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    const { data: trx, error } = await supabase
      .from("transactions")
      .insert({
        customer_name: name || null,
        customer_phone: phone || null,
        subtotal,
        discount,
        total,
        paid: Number(paid) || total,
        change_due: change,
        payment_method: method,
        cashier_email: auth.user?.email ?? null,
      })
      .select()
      .single();
    if (error || !trx) {
      setBusy(false);
      return toast.error(error?.message ?? "Gagal menyimpan transaksi.");
    }

    await supabase.from("transaction_items").insert(
      lines.map((l) => ({ transaction_id: trx.id, menu_item_id: l.id, name: l.name, qty: l.qty, price: l.price })),
    );

    // kurangi stok bahan sesuai resep
    const usage = new Map<string, number>();
    for (const l of lines) {
      for (const r of recipes.filter((r) => r.menu_item_id === l.id)) {
        usage.set(r.ingredient_id, (usage.get(r.ingredient_id) ?? 0) + Number(r.qty) * l.qty);
      }
    }
    if (usage.size) {
      await supabase.from("stock_movements").insert(
        Array.from(usage.entries()).map(([ingredient_id, used]) => ({
          ingredient_id,
          change: -used,
          reason: "penjualan",
          note: trx.trx_no,
          actor_email: auth.user?.email ?? null,
        })),
      );
    }

    void logActivity("transaksi_kasir", "transactions", trx.trx_no);
    qc.invalidateQueries();
    setBusy(false);
    toast.success(`Transaksi ${trx.trx_no} tersimpan.`);
    if (phone) window.open(waLink(phone, receiptText(trx.trx_no)), "_blank");
    reset();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Kasir / POS</h1>
        <p className="text-sm text-muted-foreground">Input transaksi langsung, stok bahan & jurnal tercatat otomatis.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Cari menu…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {available.map((m) => (
              <button
                key={m.id}
                onClick={() => add(m)}
                className="rounded-2xl border border-border bg-card p-4 text-left transition hover:border-foreground"
              >
                <p className="text-sm font-semibold">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.category}</p>
                <p className="mt-2 font-bold">{rupiah(Number(m.price))}</p>
              </button>
            ))}
            {!available.length && <p className="text-sm text-muted-foreground">Tidak ada menu tersedia.</p>}
          </div>
        </div>

        <aside className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Receipt className="h-4 w-4" /> Keranjang
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Nama customer" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="No. HP (opsional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="space-y-2">
            {lines.map((l) => (
              <div key={l.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{rupiah(l.price * l.qty)}</p>
                </div>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.id, -1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-5 text-center text-sm font-semibold">{l.qty}</span>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.id, 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setLines((p) => p.filter((x) => x.id !== l.id))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {!lines.length && <p className="py-4 text-center text-sm text-muted-foreground">Belum ada item.</p>}
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Diskon</Label>
            <div className="flex gap-2">
              <Input type="number" min={0} value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} placeholder="0" />
              <select
                className="rounded-md border border-input bg-background px-3 text-sm"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "nominal" | "persen")}
              >
                <option value="nominal">Rp</option>
                <option value="persen">%</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Metode pembayaran</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={
                    "rounded-lg border px-2 py-1.5 text-xs capitalize transition " +
                    (method === m ? "border-foreground bg-foreground text-background" : "border-border")
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <Input type="number" min={0} value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="Jumlah bayar" />

          <dl className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>Subtotal</dt>
              <dd>{rupiah(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Diskon</dt>
              <dd>-{rupiah(discount)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>Total</dt>
              <dd>{rupiah(total)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Kembalian</dt>
              <dd>{rupiah(change)}</dd>
            </div>
          </dl>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={reset}>
              Batal
            </Button>
            <Button className="flex-1" onClick={checkout} disabled={busy}>
              {busy ? "Menyimpan…" : "Bayar & Struk"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

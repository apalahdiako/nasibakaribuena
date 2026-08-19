import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2, ShoppingBag, TicketPercent, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useCart, buildOrderText } from "@/lib/cart";
import { rupiah, waLink } from "@/lib/format";
import { settingsQuery } from "@/lib/queries";
import { validateVoucherCode, redeemVoucher, type Voucher } from "@/lib/voucher";

export function CartSheet() {
  const { items, total, count, open, setOpen, updateQty, remove, clear } = useCart();
  const { data: settings } = useQuery(settingsQuery);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [sending, setSending] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [applied, setApplied] = useState<{ voucher: Voucher; discount: number } | null>(null);

  const discount = applied ? Math.min(applied.discount, total) : 0;
  const grandTotal = Math.max(0, total - discount);

  // Voucher batal otomatis bila isi keranjang berubah sehingga syaratnya tak lagi terpenuhi.
  useEffect(() => {
    if (!applied) return;
    if (items.length === 0) {
      setApplied(null);
      return;
    }
    if (total < Number(applied.voucher.min_spend)) {
      setApplied(null);
      toast.info("Voucher dilepas karena total belanja di bawah minimum.");
    }
  }, [items.length, total, applied]);

  async function applyVoucher() {
    setChecking(true);
    const res = await validateVoucherCode(voucherCode, total);
    setChecking(false);
    if (!res.ok) {
      setApplied(null);
      toast.error(res.reason);
      return;
    }
    setApplied({ voucher: res.voucher, discount: res.discount });
    toast.success(`Voucher ${res.voucher.code} dipakai — hemat ${rupiah(res.discount)}`);
  }

  async function checkout(channel: "whatsapp" | "gofood" | "grabfood") {
    if (items.length === 0) return;
    if (channel === "whatsapp" && name.trim().length < 2) {
      toast.error("Isi nama pemesan dulu ya.");
      return;
    }
    setSending(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const baseText = buildOrderText({
      items,
      total: grandTotal,
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      origin,
    });
    const text = applied
      ? `${baseText}\n\nVoucher: ${applied.voucher.code} (-${rupiah(discount)})`
      : baseText;

    const { error } = await supabase.from("orders_log").insert({
      customer_name: name.trim().slice(0, 100),
      phone: phone.trim().slice(0, 30),
      address: address.trim().slice(0, 300),
      items: items.map((i) => ({
        name: i.name,
        qty: i.qty,
        spicy: i.spicy,
        note: i.note,
        price: i.price,
        subtotal: i.price * i.qty,
      })),
      total: grandTotal,
      channel,
      note: applied ? `Voucher ${applied.voucher.code} -${discount}` : "",
    });
    if (error) console.error(error);

    if (applied) {
      try {
        await redeemVoucher({
          voucher: applied.voucher,
          discount,
          refType: "web",
          customerName: name.trim() || null,
        });
      } catch (err) {
        console.error(err);
      }
    }

    let url = "";
    if (channel === "whatsapp") url = waLink(settings?.wa_number ?? "6283160599421", text);
    if (channel === "gofood") url = settings?.gofood_url || "";
    if (channel === "grabfood") url = settings?.grabfood_url || "";

    setSending(false);
    if (!url) {
      toast.error("Link channel ini belum diatur admin. Silakan pesan via WhatsApp.");
      return;
    }
    window.open(url, "_blank", "noopener");
    toast.success("Pesanan dikirim. Lanjutkan di aplikasi yang terbuka.");
  }


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display flex items-center gap-2 text-lg">
            <ShoppingBag className="h-5 w-5 text-primary" /> Ringkasan Pesanan ({count})
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {items.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Keranjang masih kosong. Pilih menu favoritmu dulu ya.
            </p>
          )}

          {items.map((item) => (
            <div key={item.key} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} loading="lazy" className="h-16 w-16 rounded-xl object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.spicy ?? "Tanpa level pedas"}
                  {item.note ? ` • ${item.note}` : ""}
                </p>
                <p className="mt-1 text-sm font-bold text-primary">{rupiah(item.price * item.qty)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => remove(item.key)} aria-label="Hapus" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex items-center rounded-full border border-border">
                  <button className="grid h-7 w-7 place-items-center" aria-label="Kurangi" onClick={() => updateQty(item.key, item.qty - 1)}>
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                  <button className="grid h-7 w-7 place-items-center" aria-label="Tambah" onClick={() => updateQty(item.key, item.qty + 1)}>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {items.length > 0 && (
            <div className="space-y-3 rounded-2xl bg-muted/60 p-4">
              <div className="grid gap-1.5">
                <Label htmlFor="cart-name">Nama pemesan</Label>
                <Input id="cart-name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cart-phone">No. HP</Label>
                <Input id="cart-phone" value={phone} maxLength={30} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cart-address">Alamat pengantaran</Label>
                <Textarea
                  id="cart-address"
                  value={address}
                  maxLength={300}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat lengkap (opsional bila ambil di outlet)"
                  rows={2}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cart-voucher" className="flex items-center gap-1.5">
                  <TicketPercent className="h-4 w-4 text-primary" /> Kode voucher
                </Label>
                {applied ? (
                  <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/5 px-3 py-2">
                    <div className="text-xs">
                      <p className="font-bold text-primary">{applied.voucher.code}</p>
                      <p className="text-muted-foreground">Hemat {rupiah(discount)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setApplied(null);
                        setVoucherCode("");
                      }}
                      aria-label="Lepas voucher"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      id="cart-voucher"
                      value={voucherCode}
                      maxLength={30}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: HEMAT10"
                    />
                    <Button variant="outline" disabled={checking} onClick={applyVoucher}>
                      {checking ? "Cek…" : "Pakai"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-3 border-t border-border bg-background px-5 py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{rupiah(total)}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-sm text-primary">
                <span>Diskon voucher {applied?.voucher.code}</span>
                <span>-{rupiah(discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total bayar</span>
              <span className="font-display text-xl font-extrabold text-primary">{rupiah(grandTotal)}</span>
            </div>
            <Button variant="gold" className="w-full" disabled={sending} onClick={() => checkout("whatsapp")}>
              Pesan via WhatsApp
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={sending} onClick={() => checkout("gofood")}>
                GoFood
              </Button>
              <Button variant="outline" disabled={sending} onClick={() => checkout("grabfood")}>
                GrabFood
              </Button>
            </div>
            <button onClick={clear} className="w-full text-center text-xs text-muted-foreground hover:text-destructive">
              Kosongkan keranjang
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

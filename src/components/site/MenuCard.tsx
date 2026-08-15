import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCart, type SpicyLevel } from "@/lib/cart";
import { rupiah } from "@/lib/format";
import type { MenuItem } from "@/lib/queries";

const LEVELS: SpicyLevel[] = ["Tidak Pedas", "Pedas Sedang", "Pedas"];

export function MenuCard({ item }: { item: MenuItem }) {
  const { add, setOpen } = useCart();
  const [qty, setQty] = useState(1);
  const [spicy, setSpicy] = useState<SpicyLevel>("Pedas Sedang");
  const [note, setNote] = useState("");
  const soldOut = item.status !== "aktif";

  function handleAdd() {
    add({
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      qty,
      spicy: item.has_spicy_option ? spicy : null,
      note: note.slice(0, 200),
      imageUrl: item.image_url,
    });
    toast.success(`${item.name} ditambahkan ke pesanan`);
    setQty(1);
    setNote("");
    setOpen(true);
  }

  return (
    <article className="flex h-full flex-col overflow-hidden border border-border bg-card">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : null}
        {item.badge ? (
          <span className="absolute top-3 left-3 bg-foreground px-3 py-1 text-[0.65rem] font-semibold tracking-wider text-background uppercase">
            {item.badge}
          </span>
        ) : null}
        {soldOut ? (
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/60 text-sm font-bold text-background">
            {item.status === "habis" ? "Habis Hari Ini" : "Tidak Tersedia"}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 text-center">
        <div>
          <p className="text-[0.65rem] font-medium tracking-[0.2em] text-muted-foreground uppercase">{item.category}</p>
          <h3 className="mt-1.5 font-display text-lg font-semibold text-foreground">{item.name}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        </div>

        <p className="font-display text-lg font-semibold text-foreground">{rupiah(item.price)}</p>


        {!soldOut && (
          <div className="mt-auto space-y-3">
            {item.has_spicy_option && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {LEVELS.map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setSpicy(lv)}
                    className={
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                      (spicy === lv
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-muted-foreground hover:border-foreground/40")
                    }
                  >
                    {lv}
                  </button>
                ))}
              </div>
            )}


            <Textarea
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan (mis. tanpa bawang goreng)"
              className="min-h-[38px] resize-none text-sm"
              rows={1}
            />

            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-border">
                <button
                  type="button"
                  aria-label="Kurangi"
                  className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-sm font-bold">{qty}</span>
                <button
                  type="button"
                  aria-label="Tambah"
                  className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => setQty((q) => Math.min(50, q + 1))}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button className="flex-1" onClick={handleAdd}>
                <ShoppingBag className="mr-1.5 h-4 w-4" /> Tambah
              </Button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

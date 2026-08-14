import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type SpicyLevel = "Tidak Pedas" | "Pedas Sedang" | "Pedas";

export type CartItem = {
  key: string;
  id: string;
  name: string;
  slug: string;
  price: number;
  qty: number;
  spicy: SpicyLevel | null;
  note: string;
  imageUrl: string | null;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: Omit<CartItem, "key">) => void;
  updateQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nbie-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, "key">) => {
    const key = `${item.id}__${item.spicy ?? "-"}__${item.note.trim().toLowerCase()}`;
    setItems((prev) => {
      const found = prev.find((p) => p.key === key);
      if (found) {
        return prev.map((p) => (p.key === key ? { ...p, qty: p.qty + item.qty } : p));
      }
      return [...prev, { ...item, key }];
    });
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((p) => p.key !== key) : prev.map((p) => (p.key === key ? { ...p, qty } : p)),
    );
  }, []);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((p) => p.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);
    return { items, count, total, add, updateQty, remove, clear, open, setOpen };
  }, [items, add, updateQty, remove, clear, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart harus dipakai di dalam CartProvider");
  return ctx;
}

export function buildOrderText(params: {
  items: CartItem[];
  total: number;
  name: string;
  address: string;
  phone: string;
  origin: string;
}): string {
  const lines: string[] = ["Halo Admin Nasi Bakar Ibu Ena, saya mau pesan:", ""];
  params.items.forEach((item, idx) => {
    const spicy = item.spicy ? ` (${item.spicy})` : "";
    lines.push(`${idx + 1}. ${item.name}${spicy} x${item.qty} — Rp ${new Intl.NumberFormat("id-ID").format(item.price * item.qty)}`);
    if (item.note.trim()) lines.push(`   Catatan: ${item.note.trim()}`);
    if (params.origin) lines.push(`   Foto: ${params.origin}/menu/${item.slug}`);
  });
  lines.push("");
  lines.push(`Total: Rp ${new Intl.NumberFormat("id-ID").format(params.total)}`);
  lines.push(`Nama: ${params.name || "___"}`);
  lines.push(`No. HP: ${params.phone || "___"}`);
  lines.push(`Alamat: ${params.address || "___"}`);
  return lines.join("\n");
}

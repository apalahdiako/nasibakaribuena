import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, PackagePlus, AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ingredientsQuery, movementsQuery, recipesQuery, menuQuery, type Ingredient } from "@/lib/queries";
import { useRealtime } from "@/hooks/useRealtime";
import { rupiah, tanggal, waktu } from "@/lib/format";
import { logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/inventori")({ component: Inventori });

type Draft = Partial<Ingredient>;

function Inventori() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery(ingredientsQuery);
  const { data: movements = [] } = useQuery(movementsQuery);
  const { data: recipes = [] } = useQuery(recipesQuery);
  const { data: menu = [] } = useQuery(menuQuery);
  useRealtime({
    channelName: "inventory",
    tables: { ingredients: ["ingredients"], notifications: ["notifications"] },
  });

  const [draft, setDraft] = useState<Draft | null>(null);
  const [restock, setRestock] = useState<Ingredient | null>(null);
  const [qty, setQty] = useState("");
  const [recipeFor, setRecipeFor] = useState<string>("");

  const low = items.filter((i) => Number(i.stock) <= Number(i.min_stock));

  async function save() {
    if (!draft?.name) return;
    const payload = {
      name: draft.name,
      unit: draft.unit || "gram",
      stock: Number(draft.stock) || 0,
      min_stock: Number(draft.min_stock) || 0,
      cost_per_unit: Number(draft.cost_per_unit) || 0,
      supplier: draft.supplier || null,
    };
    const { error } = draft.id
      ? await supabase.from("ingredients").update(payload).eq("id", draft.id)
      : await supabase.from("ingredients").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    void logActivity(draft.id ? "ubah bahan" : "tambah bahan", "ingredients", payload.name);
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["ingredients"] });
    toast.success("Bahan tersimpan.");
  }

  async function doRestock() {
    if (!restock) return;
    const change = Number(qty);
    if (!change) {
      toast.error("Isi jumlah restock.");
      return;
    }
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("stock_movements").insert({
      ingredient_id: restock.id,
      change,
      reason: change > 0 ? "restock" : "penyesuaian",
      actor_email: auth.user?.email ?? null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    void logActivity("restock", "ingredients", `${restock.name} ${change > 0 ? "+" : ""}${change}`);
    setRestock(null);
    setQty("");
    qc.invalidateQueries();
    toast.success("Stok diperbarui.");
  }

  async function remove(id: string) {
    await supabase.from("ingredients").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["ingredients"] });
  }

  async function setRecipeQty(menuId: string, ingredientId: string, value: number) {
    if (!value) {
      await supabase.from("recipes").delete().eq("menu_item_id", menuId).eq("ingredient_id", ingredientId);
    } else {
      await supabase.from("recipes").upsert(
        { menu_item_id: menuId, ingredient_id: ingredientId, qty: value },
        { onConflict: "menu_item_id,ingredient_id" },
      );
    }
    qc.invalidateQueries({ queryKey: ["recipes"] });
  }

  const hpp = (menuId: string) =>
    recipes
      .filter((r) => r.menu_item_id === menuId)
      .reduce((s, r) => {
        const ing = items.find((i) => i.id === r.ingredient_id);
        return s + Number(r.qty) * Number(ing?.cost_per_unit ?? 0);
      }, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Inventori & Resep</h1>
          <p className="text-sm text-muted-foreground">Stok bahan baku realtime, otomatis berkurang tiap transaksi kasir.</p>
        </div>
        <Button onClick={() => setDraft({ unit: "gram" })} className="gap-2">
          <Plus className="h-4 w-4" /> Bahan Baru
        </Button>
      </div>

      {low.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>{low.length} bahan menipis:</strong> {low.map((i) => `${i.name} (${i.stock} ${i.unit})`).join(", ")}
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Bahan</th>
              <th className="px-4 py-3">Stok</th>
              <th className="px-4 py-3">Min</th>
              <th className="px-4 py-3">Harga/unit</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-medium">{i.name}</td>
                <td className={"px-4 py-3 " + (Number(i.stock) <= Number(i.min_stock) ? "font-semibold text-destructive" : "")}>
                  {Number(i.stock)} {i.unit}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{Number(i.min_stock)}</td>
                <td className="px-4 py-3">{rupiah(Number(i.cost_per_unit))}</td>
                <td className="px-4 py-3 text-muted-foreground">{i.supplier ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setRestock(i)}>
                      <PackagePlus className="h-3.5 w-3.5" /> Restock
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDraft(i)}>
                      Edit
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(i.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Belum ada bahan baku. Tambahkan untuk mulai hitung HPP.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="font-semibold">Resep per Menu</h2>
        <p className="text-sm text-muted-foreground">Tentukan pemakaian bahan agar stok & HPP terhitung otomatis.</p>
        <select
          className="mt-3 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={recipeFor}
          onChange={(e) => setRecipeFor(e.target.value)}
        >
          <option value="">— Pilih menu —</option>
          {menu.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {recipeFor && (
          <div className="mt-4 space-y-2">
            {items.map((i) => {
              const r = recipes.find((x) => x.menu_item_id === recipeFor && x.ingredient_id === i.id);
              return (
                <div key={i.id} className="flex items-center gap-3">
                  <span className="flex-1 text-sm">
                    {i.name} <span className="text-muted-foreground">({i.unit})</span>
                  </span>
                  <Input
                    type="number"
                    min={0}
                    className="w-28"
                    defaultValue={r ? Number(r.qty) : ""}
                    onBlur={(e) => setRecipeQty(recipeFor, i.id, Number(e.target.value) || 0)}
                  />
                </div>
              );
            })}
            <p className="pt-2 text-sm font-semibold">HPP menu ini: {rupiah(hpp(recipeFor))}</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="font-semibold">Histori Pemakaian</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {movements.slice(0, 25).map((m) => {
            const ing = items.find((i) => i.id === m.ingredient_id);
            return (
              <li key={m.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                <span>
                  <strong>{ing?.name ?? "Bahan"}</strong>{" "}
                  <span className={Number(m.change) > 0 ? "text-emerald-600" : "text-destructive"}>
                    {Number(m.change) > 0 ? "+" : ""}
                    {Number(m.change)}
                  </span>{" "}
                  <span className="text-muted-foreground">· {m.reason}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {tanggal(m.created_at)} {waktu(m.created_at)} · {m.actor_email ?? "sistem"}
                </span>
              </li>
            );
          })}
          {!movements.length && <li className="py-4 text-center text-muted-foreground">Belum ada pergerakan stok.</li>}
        </ul>
      </section>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit Bahan" : "Bahan Baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Nama</Label>
              <Input value={draft?.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Satuan</Label>
                <Input value={draft?.unit ?? ""} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Stok awal</Label>
                <Input type="number" value={String(draft?.stock ?? "")} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Stok minimum</Label>
                <Input
                  type="number"
                  value={String(draft?.min_stock ?? "")}
                  onChange={(e) => setDraft({ ...draft, min_stock: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Harga per unit</Label>
                <Input
                  type="number"
                  value={String(draft?.cost_per_unit ?? "")}
                  onChange={(e) => setDraft({ ...draft, cost_per_unit: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Supplier</Label>
              <Input value={draft?.supplier ?? ""} onChange={(e) => setDraft({ ...draft, supplier: e.target.value })} />
            </div>
            <Button onClick={save}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!restock} onOpenChange={(o) => !o && setRestock(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Restock {restock?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Label>Jumlah (minus untuk pengurangan)</Label>
            <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
            <Button onClick={doRestock}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

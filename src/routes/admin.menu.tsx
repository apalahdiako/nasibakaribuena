import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { menuQuery, type MenuItem } from "@/lib/queries";
import { useRealtime } from "@/hooks/useRealtime";
import { logActivity } from "@/lib/activity";
import { rupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/menu")({ component: MenuAdmin });

type Draft = Partial<MenuItem>;

const EMPTY: Draft = {
  name: "",
  slug: "",
  description: "",
  category: "Nasi Bakar",
  price: 12000,
  image_url: "",
  badge: "",
  has_spicy_option: true,
  status: "aktif",
  sort_order: 0,
};

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function MenuAdmin() {
  const qc = useQueryClient();
  const { data: menu = [] } = useQuery(menuQuery);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  useRealtime({ channelName: "menu-admin", tables: { menu_items: ["menu_items"] } });

  async function save() {
    if (!draft?.name) return toast.error("Nama menu wajib diisi");
    setBusy(true);
    const payload = {
      name: draft.name,
      slug: draft.slug || slugify(draft.name),
      description: draft.description ?? "",
      category: draft.category ?? "Nasi Bakar",
      price: Number(draft.price ?? 0),
      image_url: draft.image_url || null,
      badge: draft.badge || null,
      has_spicy_option: draft.has_spicy_option ?? true,
      status: draft.status ?? "aktif",
      sort_order: Number(draft.sort_order ?? 0),
    };
    const res = draft.id
      ? await supabase.from("menu_items").update(payload).eq("id", draft.id)
      : await supabase.from("menu_items").insert(payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    void logActivity(draft.id ? "ubah menu" : "tambah menu", "menu_items", payload.name);
    toast.success("Menu tersimpan");
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["menu_items"] });
  }

  async function toggleStock(item: MenuItem) {
    const status = item.status === "aktif" ? "habis" : "aktif";
    qc.setQueryData<MenuItem[]>(["menu_items"], (prev) => (prev ?? []).map((m) => (m.id === item.id ? { ...m, status } : m)));
    const { error } = await supabase.from("menu_items").update({ status }).eq("id", item.id);
    if (error) toast.error(error.message);
    else void logActivity("ubah ketersediaan", "menu_items", `${item.name} → ${status}`);
  }

  async function remove(item: MenuItem) {
    if (!confirm(`Hapus ${item.name}?`)) return;
    const { error } = await supabase.from("menu_items").update({ is_deleted: true }).eq("id", item.id);
    if (error) return toast.error(error.message);
    void logActivity("hapus menu", "menu_items", item.name);
    qc.invalidateQueries({ queryKey: ["menu_items"] });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Menu Management</h1>
          <p className="text-sm text-muted-foreground">Perubahan langsung tampil di website tanpa refresh.</p>
        </div>
        <Button className="gap-2" onClick={() => setDraft({ ...EMPTY })}>
          <Plus className="h-4 w-4" /> Tambah menu
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {menu.map((m) => (
          <article key={m.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            {m.image_url && <img src={m.image_url} alt={m.name} className="h-36 w-full object-cover" loading="lazy" />}
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.category}</p>
                </div>
                <span className="font-bold">{rupiah(m.price)}</span>
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{m.description}</p>
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={m.status === "aktif"} onCheckedChange={() => toggleStock(m)} />
                  {m.status === "aktif" ? "Tersedia" : "Habis"}
                </label>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setDraft(m)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(m)} aria-label="Hapus">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center" onClick={() => setDraft(null)}>
          <div
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-card p-6 sm:max-w-lg sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{draft.id ? "Edit menu" : "Menu baru"}</h2>
              <button onClick={() => setDraft(null)} aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Nama</Label>
                <Input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Kategori</Label>
                  <Input value={draft.category ?? ""} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Harga (Rp)</Label>
                  <Input
                    type="number"
                    value={draft.price ?? 0}
                    onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Deskripsi</Label>
                <Textarea rows={3} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>URL gambar</Label>
                <Input value={draft.image_url ?? ""} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Badge (opsional)</Label>
                  <Input value={draft.badge ?? ""} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Urutan</Label>
                  <Input
                    type="number"
                    value={draft.sort_order ?? 0}
                    onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={draft.has_spicy_option ?? true}
                  onCheckedChange={(v) => setDraft({ ...draft, has_spicy_option: v })}
                />
                Punya pilihan level pedas
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={(draft.status ?? "aktif") === "aktif"}
                  onCheckedChange={(v) => setDraft({ ...draft, status: v ? "aktif" : "habis" })}
                />
                Tersedia di website
              </label>
              <Button onClick={save} disabled={busy} className="mt-2">
                {busy ? "Menyimpan…" : "Simpan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

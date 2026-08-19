import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Eye, MousePointerClick } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { promosQuery, menuQuery, type Promo } from "@/lib/queries";
import { useRealtime } from "@/hooks/useRealtime";
import { logActivity } from "@/lib/activity";
import { rupiah, tanggal } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/promo")({ component: PromoAdmin });

type Draft = Partial<Promo>;

const PLACEMENTS = [
  { value: "hero", label: "Banner hero homepage" },
  { value: "carousel", label: "Carousel promo" },
  { value: "badge", label: "Badge di kartu menu" },
  { value: "promo_page", label: "Halaman promo saja" },
];

const EMPTY: Draft = {
  title: "",
  description: "",
  image_url: "",
  placement: "promo_page",
  is_active: true,
};

function PromoAdmin() {
  const qc = useQueryClient();
  const { data: promos = [] } = useQuery(promosQuery);
  const { data: menu = [] } = useQuery(menuQuery);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  useRealtime({ channelName: "promo-admin", tables: { promos: ["promos"] } });

  async function save() {
    if (!draft?.title) {
      toast.error("Judul promo wajib diisi");
      return;
    }
    setBusy(true);
    const payload = {
      title: draft.title,
      description: draft.description ?? "",
      image_url: draft.image_url || null,
      menu_item_id: draft.menu_item_id || null,
      original_price: draft.original_price ? Number(draft.original_price) : null,
      promo_price: draft.promo_price ? Number(draft.promo_price) : null,
      placement: draft.placement ?? "promo_page",
      start_date: draft.start_date || null,
      end_date: draft.end_date || null,
      is_active: draft.is_active ?? true,
    };
    const res = draft.id
      ? await supabase.from("promos").update(payload).eq("id", draft.id)
      : await supabase.from("promos").insert(payload);
    setBusy(false);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    void logActivity(draft.id ? "ubah promo" : "tambah promo", "promos", payload.title);
    toast.success("Promo tersimpan");
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["promos"] });
  }

  async function toggle(p: Promo) {
    qc.setQueryData<Promo[]>(["promos"], (prev) => (prev ?? []).map((x) => (x.id === p.id ? { ...x, is_active: !p.is_active } : x)));
    const { error } = await supabase.from("promos").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) toast.error(error.message);
    else void logActivity("ubah status promo", "promos", `${p.title} → ${!p.is_active ? "aktif" : "nonaktif"}`);
  }

  async function remove(p: Promo) {
    if (!confirm(`Hapus promo ${p.title}?`)) return;
    const { error } = await supabase.from("promos").delete().eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void logActivity("hapus promo", "promos", p.title);
    qc.invalidateQueries({ queryKey: ["promos"] });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Promo & Iklan Menu</h1>
          <p className="text-sm text-muted-foreground">Aktif/nonaktif langsung ter-push ke pengunjung website.</p>
        </div>
        <Button className="gap-2" onClick={() => setDraft({ ...EMPTY })}>
          <Plus className="h-4 w-4" /> Promo baru
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {promos.length === 0 && <p className="text-sm text-muted-foreground">Belum ada promo.</p>}
        {promos.map((p) => {
          const expired = !!p.end_date && p.end_date < today;
          return (
            <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              {p.image_url && (
                <div className="aspect-[3/4] w-full bg-muted">
                  <img src={p.image_url} alt={p.title} className="h-full w-full object-contain" loading="lazy" />
                </div>
              )}
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold">{p.title}</p>
                  {expired && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[0.65rem] text-destructive">Kedaluwarsa</span>}
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>

                {p.promo_price ? (
                  <p className="text-sm">
                    <span className="mr-2 text-muted-foreground line-through">{p.original_price ? rupiah(p.original_price) : ""}</span>
                    <span className="font-bold">{rupiah(p.promo_price)}</span>
                  </p>
                ) : null}
                <p className="text-[0.7rem] text-muted-foreground">
                  {PLACEMENTS.find((x) => x.value === p.placement)?.label ?? p.placement} ·{" "}
                  {p.start_date ? tanggal(p.start_date) : "—"} s/d {p.end_date ? tanggal(p.end_date) : "—"}
                </p>
                <p className="flex gap-3 text-[0.7rem] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {p.impressions ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="h-3 w-3" /> {p.clicks ?? 0}
                  </span>
                </p>
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={p.is_active && !expired} onCheckedChange={() => toggle(p)} />
                    {p.is_active && !expired ? "Tayang" : "Nonaktif"}
                  </label>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setDraft(p)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p)} aria-label="Hapus">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center" onClick={() => setDraft(null)}>
          <div
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-card p-6 sm:max-w-lg sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{draft.id ? "Edit promo" : "Promo baru"}</h2>
              <button onClick={() => setDraft(null)} aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Judul</Label>
                <Input value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Deskripsi</Label>
                <Textarea rows={3} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Flyer / banner promo</Label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    setUploading(true);
                    try {
                      const url = await uploadPromoImage(file);
                      setDraft((d) => ({ ...(d ?? {}), image_url: url }));
                      toast.success("Flyer terunggah");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Gagal upload flyer");
                    }
                    setUploading(false);
                  }}
                  className="block w-full cursor-pointer rounded-md border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
                />
                <p className="text-[0.7rem] text-muted-foreground">
                  {uploading ? "Mengunggah…" : `Rekomendasi flyer portrait 1080×1350 px (4:5) atau 1080×1440 px (3:4), maks ${MAX_FLYER_MB}MB.`}
                </p>
                <Input
                  placeholder="atau tempel URL gambar"
                  value={draft.image_url ?? ""}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Menu terkait</Label>
                  <select
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    value={draft.menu_item_id ?? ""}
                    onChange={(e) => setDraft({ ...draft, menu_item_id: e.target.value || null })}
                  >
                    <option value="">— tidak ada —</option>
                    {menu.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Penempatan</Label>
                  <select
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    value={draft.placement ?? "promo_page"}
                    onChange={(e) => setDraft({ ...draft, placement: e.target.value })}
                  >
                    {PLACEMENTS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Harga normal</Label>
                  <Input
                    type="number"
                    value={draft.original_price ?? ""}
                    onChange={(e) => setDraft({ ...draft, original_price: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Harga promo</Label>
                  <Input
                    type="number"
                    value={draft.promo_price ?? ""}
                    onChange={(e) => setDraft({ ...draft, promo_price: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Mulai</Label>
                  <Input type="date" value={draft.start_date ?? ""} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Berakhir</Label>
                  <Input type="date" value={draft.end_date ?? ""} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={draft.is_active ?? true} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
                Aktifkan promo
              </label>

              <div className="rounded-2xl border border-dashed border-border p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
                <div className="overflow-hidden rounded-xl bg-muted">
                  {draft.image_url && <img src={draft.image_url} alt="" className="h-28 w-full object-cover" />}
                  <div className="p-3">
                    <p className="font-bold">{draft.title || "Judul promo"}</p>
                    <p className="text-xs text-muted-foreground">{draft.description || "Deskripsi singkat promo"}</p>
                  </div>
                </div>
              </div>

              <Button onClick={save} disabled={busy}>
                {busy ? "Menyimpan…" : "Simpan promo"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

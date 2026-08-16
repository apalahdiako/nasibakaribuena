import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, outletsQuery, type SiteSettings, type Outlet } from "@/lib/queries";
import { logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/pengaturan")({ component: Settings });

const FIELDS: { key: keyof SiteSettings; label: string; area?: boolean }[] = [
  { key: "hero_title", label: "Judul hero" },
  { key: "hero_subtitle", label: "Subjudul hero" },
  { key: "hero_image_url", label: "URL gambar hero" },
  { key: "wa_number", label: "Nomor WhatsApp order" },
  { key: "open_hours", label: "Jam operasional" },
  { key: "delivery_area", label: "Area pengantaran" },
  { key: "email", label: "Email" },
  { key: "instagram_url", label: "Instagram" },
  { key: "tiktok_url", label: "TikTok" },
  { key: "grabfood_url", label: "GrabFood" },
  { key: "gofood_url", label: "GoFood" },
  { key: "shopeefood_url", label: "ShopeeFood" },
  { key: "about_text", label: "Tentang kami", area: true },
  { key: "ai_knowledge", label: "Knowledge base AI (Mbak Ena)", area: true },
];

function Settings() {
  const qc = useQueryClient();
  const { data: settings } = useQuery(settingsQuery);
  const { data: outlets = [] } = useQuery(outletsQuery);
  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  async function save() {
    setBusy(true);
    const { id: _id, updated_at: _u, ...rest } = form as SiteSettings;
    const { error } = await supabase.from("site_settings").update(rest).eq("id", 1);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    void logActivity("ubah pengaturan situs", "site_settings", "profil bisnis");
    toast.success("Pengaturan tersimpan");
    qc.invalidateQueries({ queryKey: ["site_settings"] });
  }

  async function saveOutlet(o: Outlet) {
    const { id, created_at: _c, updated_at: _u, ...rest } = o;
    const { error } = await supabase.from("outlets").update(rest).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Outlet tersimpan");
      qc.invalidateQueries({ queryKey: ["outlets"] });
    }
  }

  async function addOutlet() {
    const { error } = await supabase.from("outlets").insert({ name: "Outlet baru", address: "-" });
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["outlets"] });
  }

  async function removeOutlet(o: Outlet) {
    if (!confirm(`Hapus outlet ${o.name}?`)) return;
    const { error } = await supabase.from("outlets").delete().eq("id", o.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["outlets"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Perubahan langsung tampil di website publik.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="mb-4 font-bold">Profil bisnis & konten</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={String(f.key)} className={"grid gap-1.5 " + (f.area ? "md:col-span-2" : "")}>
              <Label>{f.label}</Label>
              {f.area ? (
                <Textarea
                  rows={4}
                  value={(form[f.key] as string) ?? ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              ) : (
                <Input
                  value={(form[f.key] as string) ?? ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
        <Button className="mt-5" onClick={save} disabled={busy}>
          {busy ? "Menyimpan…" : "Simpan pengaturan"}
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">Outlet</h2>
          <Button size="sm" variant="outline" className="gap-2" onClick={addOutlet}>
            <Plus className="h-4 w-4" /> Tambah outlet
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {outlets.map((o) => (
            <OutletCard key={o.id} outlet={o} onSave={saveOutlet} onRemove={removeOutlet} />
          ))}
        </div>
      </section>
    </div>
  );
}

function OutletCard({
  outlet,
  onSave,
  onRemove,
}: {
  outlet: Outlet;
  onSave: (o: Outlet) => void;
  onRemove: (o: Outlet) => void;
}) {
  const [local, setLocal] = useState(outlet);
  useEffect(() => setLocal(outlet), [outlet]);

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div className="grid gap-1.5">
        <Label>Nama</Label>
        <Input value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })} />
      </div>
      <div className="grid gap-1.5">
        <Label>Alamat</Label>
        <Textarea rows={2} value={local.address} onChange={(e) => setLocal({ ...local, address: e.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Jam buka</Label>
          <Input value={local.open_hours} onChange={(e) => setLocal({ ...local, open_hours: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>WhatsApp</Label>
          <Input value={local.whatsapp ?? ""} onChange={(e) => setLocal({ ...local, whatsapp: e.target.value })} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label>Link Google Maps</Label>
        <Input value={local.maps_url ?? ""} onChange={(e) => setLocal({ ...local, maps_url: e.target.value })} />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={local.is_open} onCheckedChange={(v) => setLocal({ ...local, is_open: v })} />
          {local.is_open ? "Buka" : "Tutup"}
        </label>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onSave(local)}>
            Simpan
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onRemove(outlet)} aria-label="Hapus outlet">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

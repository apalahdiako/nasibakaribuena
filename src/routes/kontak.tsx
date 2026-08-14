import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { settingsQuery } from "@/lib/queries";
import { waLink } from "@/lib/format";

export const Route = createFileRoute("/kontak")({
  head: () => ({
    meta: [
      { title: "Kontak & Customer Service — Nasi Bakar Ibu Ena" },
      {
        name: "description",
        content: "Hubungi Nasi Bakar Ibu Ena lewat WhatsApp, email, atau live chat untuk pesanan dan pertanyaan.",
      },
      { property: "og:title", content: "Kontak & Customer Service — Nasi Bakar Ibu Ena" },
      { property: "og:description", content: "WhatsApp CS, email, dan live chat Nasi Bakar Ibu Ena." },
    ],
  }),
  component: KontakPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  phone: z.string().trim().min(8, "Nomor HP tidak valid").max(20),
  message: z.string().trim().min(5, "Pesan terlalu pendek").max(1000),
});

function KontakPage() {
  const { data: settings } = useQuery(settingsQuery);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Periksa kembali isian kamu");
      return;
    }
    const text = `Halo Admin Nasi Bakar Ibu Ena,\n\nNama: ${parsed.data.name}\nNo. HP: ${parsed.data.phone}\n\n${parsed.data.message}`;
    window.open(waLink(settings?.wa_number ?? "6283160599421", text), "_blank", "noopener");
    toast.success("Pesan diteruskan ke WhatsApp admin.");
  }

  return (
    <SiteLayout>
      <section className="bg-primary py-12 text-primary-foreground md:py-16">
        <div className="container-page">
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">Kontak & CS</h1>
          <p className="mt-3 max-w-xl text-primary-foreground/80">
            Ada pertanyaan, pesanan dalam jumlah besar, atau masukan? Kami siap bantu.
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page grid gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h2 className="font-display text-lg font-bold">Hubungi kami</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <a
                    className="hover:text-primary"
                    href={waLink(settings?.wa_number ?? "6283160599421", "Halo Admin Nasi Bakar Ibu Ena")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp {settings?.wa_number ?? "6283160599421"}
                  </a>
                </li>
                {settings?.email ? (
                  <li className="flex gap-2">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <a className="hover:text-primary" href={`mailto:${settings.email}`}>
                      {settings.email}
                    </a>
                  </li>
                ) : null}
                <li className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Jalan Pangeran Kejaksan, Gg. Pandu Blok Karang Asem, Babakan, Kec. Sumber, Kab. Cirebon
                </li>
                <li className="flex gap-2">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Live chat tersedia di pojok kanan bawah halaman ini.
                </li>
              </ul>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-bold">Kirim pesan</h2>
            <div className="grid gap-1.5">
              <Label htmlFor="k-name">Nama</Label>
              <Input id="k-name" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="k-phone">No. HP</Label>
              <Input id="k-phone" maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="k-msg">Pesan</Label>
              <Textarea
                id="k-msg"
                rows={5}
                maxLength={1000}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <Button type="submit" variant="gold" className="w-full">
              Kirim via WhatsApp
            </Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}

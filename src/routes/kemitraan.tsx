import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Handshake, PackageCheck, Users } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { settingsQuery } from "@/lib/queries";
import { waLink } from "@/lib/format";

export const Route = createFileRoute("/kemitraan")({
  head: () => ({
    meta: [
      { title: "Kemitraan & Reseller — Nasi Bakar Ibu Ena" },
      {
        name: "description",
        content:
          "Peluang kemitraan dan reseller Nasi Bakar Ibu Ena di area Cirebon: modal ringan, resep dan pendampingan dari pusat.",
      },
      { property: "og:title", content: "Kemitraan & Reseller — Nasi Bakar Ibu Ena" },
      { property: "og:description", content: "Jadi mitra Nasi Bakar Ibu Ena di area Cirebon." },
    ],
  }),
  component: KemitraanPage,
});

const PAKET = [
  { icon: PackageCheck, title: "Reseller Harian", desc: "Ambil stok harian dengan harga khusus, jual kembali di area kamu." },
  { icon: Users, title: "Mitra Gerobak", desc: "Gerobak, perlengkapan bakar, dan pelatihan bumbu langsung dari Ibu Ena." },
  { icon: Handshake, title: "Katering & Event", desc: "Paket nasi bakar untuk arisan, pengajian, rapat, dan acara kantor." },
];

function KemitraanPage() {
  const { data: settings } = useQuery(settingsQuery);

  return (
    <SiteLayout>
      <section className="bg-primary py-12 text-primary-foreground md:py-16">
        <div className="container-page">
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">Kemitraan</h1>
          <p className="mt-3 max-w-xl text-primary-foreground/80">
            Ingin ikut menjual nasi bakar Ibu Ena? Kami terbuka untuk reseller dan mitra di area Cirebon.
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page grid gap-6 md:grid-cols-3">
          {PAKET.map((p) => (
            <div key={p.title} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <p.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-lg font-bold">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-pad bg-sage/35">
        <div className="container-page rounded-[2rem] bg-primary px-6 py-12 text-center text-primary-foreground md:px-16">
          <h2 className="font-display text-3xl font-extrabold">Diskusi kemitraan langsung dengan pemilik</h2>
          <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
            Ceritakan rencana kamu, kami bantu hitung modal, kebutuhan alat, dan skema bagi hasilnya.
          </p>
          <Button asChild variant="gold" size="lg" className="mt-7">
            <a
              href={waLink(
                settings?.wa_number ?? "6283160599421",
                "Halo Admin Nasi Bakar Ibu Ena, saya tertarik dengan program kemitraan.",
              )}
              target="_blank"
              rel="noreferrer"
            >
              Ajukan Kemitraan
            </a>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}

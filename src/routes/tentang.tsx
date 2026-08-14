import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { settingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/tentang")({
  head: () => ({
    meta: [
      { title: "Tentang Kami — Nasi Bakar Ibu Ena" },
      {
        name: "description",
        content:
          "Cerita Nasi Bakar Ibu Ena: dapur rumahan di Sumber, Cirebon, dengan bumbu ulek segar dan pembakaran arang tradisional.",
      },
      { property: "og:title", content: "Tentang Kami — Nasi Bakar Ibu Ena" },
      { property: "og:description", content: "Cerita, dapur, dan komitmen kualitas Nasi Bakar Ibu Ena." },
    ],
  }),
  component: TentangPage,
});

const KOMITMEN = [
  { title: "Bahan harian", desc: "Ayam, tongkol, dan cumi dibeli tiap pagi dari pasar Sumber." },
  { title: "Tanpa pengawet", desc: "Bumbu diulek segar, tidak memakai pengawet maupun pewarna." },
  { title: "Dibakar saat dipesan", desc: "Nasi dibakar di atas arang saat ada pesanan, bukan dipanaskan ulang." },
];

function TentangPage() {
  const { data: settings } = useQuery(settingsQuery);

  return (
    <SiteLayout>
      <section className="bg-primary py-12 text-primary-foreground md:py-16">
        <div className="container-page">
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">Tentang Ibu Ena</h1>
          <p className="mt-3 max-w-xl text-primary-foreground/80">
            Resep rumahan yang tumbuh dari dapur keluarga di Kabupaten Cirebon.
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page grid items-start gap-10 md:grid-cols-2">
          <img
            src="/images/about-dapur.jpg"
            alt="Ibu Ena membungkus nasi bakar dengan daun pisang"
            loading="lazy"
            width={1200}
            height={800}
            className="w-full rounded-[2rem] object-cover shadow-soft"
          />
          <div className="space-y-4 text-sm leading-relaxed whitespace-pre-line text-muted-foreground md:text-base">
            {settings?.about_text}
          </div>
        </div>
      </section>

      <section className="section-pad bg-sage/35">
        <div className="container-page">
          <h2 className="font-display text-3xl font-extrabold">Komitmen kualitas</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {KOMITMEN.map((k) => (
              <div key={k.title} className="rounded-3xl bg-card p-6 shadow-soft">
                <h3 className="font-display text-lg font-bold">{k.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{k.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page">
          <h2 className="font-display text-3xl font-extrabold">Galeri</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              "/images/hero.jpg",
              "/images/menu-ayam-suir.jpg",
              "/images/menu-cumi.jpg",
              "/images/menu-mix-ayam-cumi.jpg",
            ].map((src) => (
              <img
                key={src}
                src={src}
                alt="Dokumentasi Nasi Bakar Ibu Ena"
                loading="lazy"
                className="aspect-square w-full rounded-2xl object-cover shadow-soft"
              />
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

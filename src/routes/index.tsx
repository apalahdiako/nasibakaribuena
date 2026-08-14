import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Leaf, ShieldCheck, Truck, MapPin, Clock, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { MenuCard } from "@/components/site/MenuCard";
import { Button } from "@/components/ui/button";
import { menuQuery, outletsQuery, promosQuery, settingsQuery, activePromos } from "@/lib/queries";
import { rupiah, tanggal, waLink } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nasi Bakar Ibu Ena — Nasi Bakar Arang Asli Khas Cirebon" },
      {
        name: "description",
        content:
          "Nasi bakar daun pisang isi ayam suir, tongkol, dan cumi. Dibakar arang asli, mulai Rp12.000. Pesan via WhatsApp, delivery area Cirebon.",
      },
      { property: "og:title", content: "Nasi Bakar Ibu Ena — Nasi Bakar Arang Asli Khas Cirebon" },
      {
        property: "og:description",
        content: "Nasi bakar rumahan Cirebon mulai Rp12.000. Pesan online, diantar ke area Cirebon.",
      },
    ],
  }),
  component: Home,
});

const VALUES = [
  { icon: Flame, title: "Dibakar Arang Asli", desc: "Bukan teflon. Aroma asap dari bara arang bikin nasi lebih wangi." },
  { icon: Leaf, title: "Bumbu Ulek Segar", desc: "Bumbu diulek setiap pagi, tanpa penyedap berlebihan." },
  { icon: ShieldCheck, title: "Higienis & Fresh", desc: "Ayam, tongkol, dan cumi dipilih harian, dibakar saat dipesan." },
  { icon: Truck, title: "Delivery Cirebon", desc: "Antar ke area Cirebon, atau ambil langsung di outlet Sumber." },
];

function Home() {
  const { data: menu = [] } = useQuery(menuQuery);
  const { data: promos = [] } = useQuery(promosQuery);
  const { data: outlets = [] } = useQuery(outletsQuery);
  const { data: settings } = useQuery(settingsQuery);

  const unggulan = menu.filter((m) => m.status === "aktif").slice(0, 3);
  const promoAktif = activePromos(promos);
  const termurah = menu.length ? Math.min(...menu.map((m) => m.price)) : 12000;

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="container-page grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
              <Flame className="h-3.5 w-3.5 text-gold" /> Dibakar arang asli
            </span>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] font-extrabold sm:text-5xl md:text-6xl">
              {settings?.hero_title ?? "Nasi Bakar Ibu Ena"}
            </h1>
            <p className="mt-4 max-w-md text-base text-primary-foreground/80 md:text-lg">
              {settings?.hero_subtitle ?? "Dibakar arang asli, resep rumahan Cirebon turun-temurun."}
            </p>
            <p className="mt-6 text-sm text-primary-foreground/70">
              Mulai dari <span className="font-display text-2xl font-extrabold text-gold">{rupiah(termurah)}</span> per bungkus
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <a
                  href={waLink(settings?.wa_number ?? "6283160599421", "Halo Admin Nasi Bakar Ibu Ena, saya mau pesan.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  Pesan Sekarang
                </a>
              </Button>
              <Button asChild variant="outlineLight" size="lg">
                <Link to="/menu">Lihat Menu</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src={settings?.hero_image_url ?? "/images/hero.jpg"}
              alt="Nasi bakar daun pisang dibakar di atas arang"
              width={1600}
              height={1104}
              className="w-full rounded-[2rem] object-cover shadow-lift"
            />
          </div>
        </div>
      </section>

      {/* MENU ANDALAN */}
      <section className="section-pad">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-gold uppercase">Menu Andalan</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Paling sering dipesan</h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/menu">
                Semua menu <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {unggulan.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* VALUE */}
      <section className="section-pad bg-sage/35">
        <div className="container-page">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">Kenapa Pilih Ibu Ena</p>
          <h2 className="mt-2 max-w-xl font-display text-3xl font-extrabold md:text-4xl">
            Rasa rumahan yang dijaga sejak dapur pertama
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-3xl bg-card p-6 shadow-soft">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMO */}
      {promoAktif.length > 0 && (
        <section className="section-pad">
          <div className="container-page">
            <p className="text-xs font-bold tracking-widest text-gold uppercase">Promo Berjalan</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Hemat hari ini</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {promoAktif.slice(0, 4).map((p) => (
                <article key={p.id} className="lift overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} loading="lazy" className="h-44 w-full object-cover" />
                  ) : null}
                  <div className="p-6">
                    <h3 className="font-display text-lg font-bold">{p.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                    {p.end_date ? (
                      <p className="mt-3 text-xs font-semibold text-primary">Berlaku sampai {tanggal(p.end_date)}</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TENTANG */}
      <section className="section-pad bg-cream">
        <div className="container-page grid items-center gap-10 md:grid-cols-2">
          <img
            src="/images/about-dapur.jpg"
            alt="Proses membungkus nasi bakar dengan daun pisang"
            loading="lazy"
            width={1200}
            height={800}
            className="w-full rounded-[2rem] object-cover shadow-soft"
          />
          <div>
            <p className="text-xs font-bold tracking-widest text-gold uppercase">Tentang Ibu Ena</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Dari dapur rumah di Sumber, Cirebon</h2>
            <p className="mt-4 line-clamp-6 text-sm leading-relaxed text-muted-foreground md:text-base">
              {settings?.about_text}
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/tentang">
                Baca cerita lengkap <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* LOKASI */}
      <section className="section-pad">
        <div className="container-page">
          <p className="text-xs font-bold tracking-widest text-gold uppercase">Outlet & Delivery</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Kami ada di dekat kamu</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {outlets.map((o) => (
              <div key={o.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">{o.name}</h3>
                  <span
                    className={
                      "rounded-full px-3 py-1 text-xs font-bold " +
                      (o.is_open ? "bg-sage text-sage-foreground" : "bg-muted text-muted-foreground")
                    }
                  >
                    {o.is_open ? "Buka" : "Tutup"}
                  </span>
                </div>
                <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {o.address}
                </p>
                <p className="mt-2 flex gap-2 text-sm text-muted-foreground">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {o.open_hours}
                </p>
              </div>
            ))}
            <div className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-soft">
              <h3 className="font-display text-lg font-bold">Area Delivery</h3>
              <p className="mt-3 text-sm text-primary-foreground/80">
                {settings?.delivery_area ?? "Area Cirebon"}. Pesan lewat WhatsApp untuk cek ongkir dan estimasi pengantaran.
              </p>
              <Button asChild variant="gold" className="mt-5">
                <Link to="/lokasi">Detail lokasi</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

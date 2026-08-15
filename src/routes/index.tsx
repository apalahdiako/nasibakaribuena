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
      {/* HERO — full bleed seperti Kopi Kenangan */}
      <section className="relative">
        <img
          src={settings?.hero_image_url ?? "/images/hero.jpg"}
          alt="Nasi bakar daun pisang dibakar di atas arang"
          width={1600}
          height={1104}
          className="h-[58vh] w-full object-cover md:h-[72vh]"
        />
        <div className="absolute inset-0 flex items-end justify-center bg-foreground/25 pb-10 md:pb-16">
          <div className="px-5 text-center text-background">
            <h1 className="font-display text-3xl leading-tight font-semibold md:text-5xl">
              {settings?.hero_title ?? "Nasi Bakar Ibu Ena"}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-background/90 md:text-base">
              {settings?.hero_subtitle ?? "Dibakar arang asli, resep rumahan Cirebon turun-temurun."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="rounded-full bg-background px-7 text-foreground hover:bg-background/90">
                <a
                  href={waLink(settings?.wa_number ?? "6283160599421", "Halo Admin Nasi Bakar Ibu Ena, saya mau pesan.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  Order Sekarang
                </a>
              </Button>
              <Button asChild size="lg" variant="outlineLight" className="rounded-full px-7">
                <Link to="/menu">Lihat Menu</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* STATEMENT */}
      <section className="section-pad">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-2xl leading-snug font-semibold md:text-4xl">
            <span className="font-script mr-2 text-4xl md:text-6xl">Ibu Ena</span>berarti nasi bakar rumahan Cirebon.
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground md:text-base">
            Dibakar dengan arang asli, dibungkus daun pisang, dan diulek segar setiap pagi. Mulai{" "}
            <span className="font-semibold text-foreground">{rupiah(termurah)}</span> per bungkus.
          </p>
        </div>
      </section>

      {/* MENU ANDALAN */}
      <section className="pb-14 md:pb-24">
        <div className="mx-auto w-full max-w-[92rem] px-5 md:px-10">
          <div className="text-center">
            <h2 className="font-display text-xl font-semibold tracking-[0.18em] uppercase md:text-2xl">Menu Andalan</h2>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {unggulan.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="outline" className="rounded-full px-7">
              <Link to="/menu">
                Lihat semua menu <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* VALUE — 3-4 kolom bersih */}
      <section className="section-pad border-y border-border bg-secondary/60">
        <div className="mx-auto w-full max-w-[92rem] px-5 md:px-10">
          <h2 className="text-center font-display text-xl font-semibold tracking-[0.18em] uppercase md:text-2xl">
            Kenapa Ibu Ena
          </h2>
          <div className="mt-10 grid gap-10 text-center sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title}>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-foreground/15">
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold">{v.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMO */}
      {promoAktif.length > 0 && (
        <section className="section-pad">
          <div className="mx-auto w-full max-w-[92rem] px-5 md:px-10">
            <h2 className="text-center font-display text-xl font-semibold tracking-[0.18em] uppercase md:text-2xl">
              Promo of the Month
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {promoAktif.slice(0, 3).map((p) => (
                <article key={p.id} className="text-center">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} loading="lazy" className="aspect-square w-full object-cover" />
                  ) : null}
                  <h3 className="mt-4 font-display text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                  {p.end_date ? (
                    <p className="mt-2 text-xs font-medium text-muted-foreground">Berlaku sampai {tanggal(p.end_date)}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TENTANG */}
      <section className="border-t border-border">
        <div className="grid md:grid-cols-2">
          <img
            src="/images/about-dapur.jpg"
            alt="Proses membungkus nasi bakar dengan daun pisang"
            loading="lazy"
            width={1200}
            height={800}
            className="h-72 w-full object-cover md:h-full"
          />
          <div className="flex items-center px-5 py-14 md:px-14">
            <div>
              <h2 className="font-display text-2xl font-semibold md:text-3xl">Dari dapur rumah di Sumber, Cirebon</h2>
              <p className="mt-4 line-clamp-6 text-sm leading-relaxed text-muted-foreground md:text-base">
                {settings?.about_text}
              </p>
              <Button asChild variant="outline" className="mt-6 rounded-full px-7">
                <Link to="/tentang">
                  Baca cerita lengkap <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* LOKASI */}
      <section className="section-pad border-t border-border">
        <div className="mx-auto w-full max-w-[92rem] px-5 md:px-10">
          <h2 className="text-center font-display text-xl font-semibold tracking-[0.18em] uppercase md:text-2xl">
            Outlet & Delivery
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {outlets.map((o) => (
              <div key={o.id} className="border border-border p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">{o.name}</h3>
                  <span
                    className={
                      "rounded-full px-3 py-1 text-xs font-semibold " +
                      (o.is_open ? "bg-foreground text-background" : "bg-muted text-muted-foreground")
                    }
                  >
                    {o.is_open ? "Buka" : "Tutup"}
                  </span>
                </div>
                <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {o.address}
                </p>
                <p className="mt-2 flex gap-2 text-sm text-muted-foreground">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0" /> {o.open_hours}
                </p>
              </div>
            ))}
            <div className="bg-foreground p-6 text-background">
              <h3 className="font-display text-lg font-semibold">Area Delivery</h3>
              <p className="mt-3 text-sm text-background/80">
                {settings?.delivery_area ?? "Area Cirebon"}. Pesan lewat WhatsApp untuk cek ongkir dan estimasi pengantaran.
              </p>
              <Button asChild variant="outlineLight" className="mt-5 rounded-full px-7">
                <Link to="/lokasi">Detail lokasi</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}


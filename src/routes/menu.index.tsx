import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { MenuCard } from "@/components/site/MenuCard";
import { Input } from "@/components/ui/input";
import { menuQuery } from "@/lib/queries";

export const Route = createFileRoute("/menu/")({
  head: () => ({
    meta: [
      { title: "Menu & Harga — Nasi Bakar Ibu Ena" },
      {
        name: "description",
        content:
          "Daftar lengkap menu Nasi Bakar Ibu Ena: paket small Rp12.000 dan paket large mix Rp15.000. Pilih level pedas dan pesan langsung.",
      },
      { property: "og:title", content: "Menu & Harga — Nasi Bakar Ibu Ena" },
      { property: "og:description", content: "Nasi bakar ayam suir, tongkol, cumi, dan paket mix. Mulai Rp12.000." },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { data: menu = [], isLoading } = useQuery(menuQuery);
  const [cat, setCat] = useState("Semua");
  const [q, setQ] = useState("");

  const categories = useMemo(() => ["Semua", ...Array.from(new Set(menu.map((m) => m.category)))], [menu]);
  const filtered = menu.filter(
    (m) =>
      (cat === "Semua" || m.category === cat) &&
      (q.trim() === "" || m.name.toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <SiteLayout>
      <section className="bg-primary py-12 text-primary-foreground md:py-16">
        <div className="container-page">
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">Menu Kami</h1>
          <p className="mt-3 max-w-xl text-primary-foreground/80">
            Semua nasi bakar dibungkus daun pisang dan dibakar di atas arang saat dipesan. Pilih jumlah, level pedas, lalu
            masukkan ke keranjang.
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors " +
                    (cat === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-accent")
                  }
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari menu…"
                className="h-11 rounded-full pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="py-16 text-center text-muted-foreground">Memuat menu…</p>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">Menu tidak ditemukan.</p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { promosQuery, activePromos } from "@/lib/queries";
import { tanggal } from "@/lib/format";

export const Route = createFileRoute("/promo")({
  head: () => ({
    meta: [
      { title: "Promo & Kabar Terbaru — Nasi Bakar Ibu Ena" },
      {
        name: "description",
        content: "Promo bundling, potongan harga, dan kabar terbaru dari Nasi Bakar Ibu Ena Cirebon.",
      },
      { property: "og:title", content: "Promo & Kabar Terbaru — Nasi Bakar Ibu Ena" },
      { property: "og:description", content: "Cek promo yang sedang berjalan di Nasi Bakar Ibu Ena." },
    ],
  }),
  component: PromoPage,
});

function PromoPage() {
  const { data: promos = [], isLoading } = useQuery(promosQuery);
  const aktif = activePromos(promos);
  const lampau = promos.filter((p) => !aktif.includes(p));

  return (
    <SiteLayout>
      <section className="bg-primary py-12 text-primary-foreground md:py-16">
        <div className="container-page">
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">Promo & Kabar</h1>
          <p className="mt-3 max-w-xl text-primary-foreground/80">
            Promo diperbarui langsung oleh admin, jadi yang tampil di sini selalu yang sedang berlaku.
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page">
          {isLoading ? (
            <p className="py-10 text-center text-muted-foreground">Memuat promo…</p>
          ) : aktif.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center">
              <p className="font-display text-lg font-bold">Belum ada promo aktif</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Pantau halaman ini, promo baru akan tampil otomatis begitu diaktifkan admin.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {aktif.map((p) => (
                <article key={p.id} className="lift overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
                  {p.image_url ? (
                    <div className="aspect-[4/5] w-full bg-muted">
                      <img src={p.image_url} alt={p.title} loading="lazy" className="h-full w-full object-contain" />
                    </div>
                  ) : null}
                  <div className="p-6">
                    <h2 className="font-display text-xl font-bold">{p.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                    <p className="mt-4 text-xs font-semibold text-primary">
                      {p.start_date ? `Mulai ${tanggal(p.start_date)}` : "Berlaku sekarang"}
                      {p.end_date ? ` — sampai ${tanggal(p.end_date)}` : ""}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}

          {lampau.length > 0 && (
            <div className="mt-14">
              <h2 className="font-display text-2xl font-extrabold">Promo lampau</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {lampau.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-border p-5 opacity-70">
                    <p className="font-semibold">{p.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

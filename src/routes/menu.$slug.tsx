import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { MenuCard } from "@/components/site/MenuCard";
import { menuQuery } from "@/lib/queries";

export const Route = createFileRoute("/menu/$slug")({
  head: () => ({
    meta: [
      { title: "Detail Menu — Nasi Bakar Ibu Ena" },
      { name: "description", content: "Detail menu nasi bakar: foto, deskripsi, harga, dan pilihan level pedas." },
      { property: "og:title", content: "Detail Menu — Nasi Bakar Ibu Ena" },
      { property: "og:description", content: "Detail menu nasi bakar Ibu Ena beserta harga dan level pedas." },
    ],
  }),
  component: MenuDetail,
});

function MenuDetail() {
  const { slug } = Route.useParams();
  const { data: menu = [], isLoading } = useQuery(menuQuery);
  const item = menu.find((m) => m.slug === slug);
  const lainnya = menu.filter((m) => m.slug !== slug && m.status === "aktif").slice(0, 3);

  return (
    <SiteLayout>
      <section className="section-pad">
        <div className="container-page">
          <Link to="/menu" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Kembali ke menu
          </Link>

          {isLoading ? (
            <p className="py-16 text-center text-muted-foreground">Memuat…</p>
          ) : !item ? (
            <p className="py-16 text-center text-muted-foreground">Menu tidak ditemukan.</p>
          ) : (
            <div className="mt-8 grid gap-10 md:grid-cols-2">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  width={900}
                  height={900}
                  className="w-full rounded-[2rem] object-cover shadow-soft"
                />
              ) : null}
              <div>
                <h1 className="font-display text-3xl font-extrabold md:text-4xl">{item.name}</h1>
                <p className="mt-3 text-muted-foreground">{item.description}</p>
                <div className="mt-8 max-w-md">
                  <MenuCard item={item} />
                </div>
              </div>
            </div>
          )}

          {lainnya.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display text-2xl font-extrabold">Menu lainnya</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {lainnya.map((m) => (
                  <MenuCard key={m.id} item={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

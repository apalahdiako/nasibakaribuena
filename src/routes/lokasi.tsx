import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock, Phone } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { outletsQuery, settingsQuery } from "@/lib/queries";
import { waLink } from "@/lib/format";

export const Route = createFileRoute("/lokasi")({
  head: () => ({
    meta: [
      { title: "Lokasi Outlet & Area Delivery — Nasi Bakar Ibu Ena" },
      {
        name: "description",
        content:
          "Alamat outlet Nasi Bakar Ibu Ena di Sumber, Kabupaten Cirebon, jam operasional 09.00-20.00, dan area pengantaran Cirebon.",
      },
      { property: "og:title", content: "Lokasi Outlet & Area Delivery — Nasi Bakar Ibu Ena" },
      { property: "og:description", content: "Outlet Sumber Cirebon, buka 09.00-20.00 WIB. Delivery area Cirebon." },
    ],
  }),
  component: LokasiPage,
});

function LokasiPage() {
  const { data: outlets = [] } = useQuery(outletsQuery);
  const { data: settings } = useQuery(settingsQuery);

  return (
    <SiteLayout>
      <section className="bg-primary py-12 text-primary-foreground md:py-16">
        <div className="container-page">
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">Outlet & Area Delivery</h1>
          <p className="mt-3 max-w-xl text-primary-foreground/80">
            Ambil langsung di outlet atau minta diantar ke {settings?.delivery_area ?? "area Cirebon"}.
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page grid gap-6 md:grid-cols-2">
          {outlets.map((o) => {
            const maps = o.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`;
            return (
              <div key={o.id} className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
                <iframe
                  title={`Peta ${o.name}`}
                  className="h-56 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(o.address)}&output=embed`}
                />
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-lg font-bold">{o.name}</h2>
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
                  {o.whatsapp ? (
                    <p className="mt-2 flex gap-2 text-sm text-muted-foreground">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {o.whatsapp}
                    </p>
                  ) : null}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild variant="gold">
                      <a
                        href={waLink(o.whatsapp || settings?.wa_number || "6283160599421", "Halo Admin Nasi Bakar Ibu Ena, saya mau pesan.")}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Pesan ke outlet ini
                      </a>
                    </Button>
                    <Button asChild variant="outline">
                      <a href={maps} target="_blank" rel="noreferrer">
                        Buka di Maps
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </SiteLayout>
  );
}

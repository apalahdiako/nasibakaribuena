import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, ShoppingBag, X, Phone, MapPin, Clock, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { settingsQuery } from "@/lib/queries";
import { waLink } from "@/lib/format";
import { CartSheet } from "./CartSheet";
import { ChatWidget } from "./ChatWidget";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/menu", label: "Menu" },
  { to: "/promo", label: "Promo" },
  { to: "/tentang", label: "Tentang" },
  { to: "/lokasi", label: "Lokasi" },
  { to: "/kemitraan", label: "Kemitraan" },
  { to: "/kontak", label: "Kontak" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [openNav, setOpenNav] = useState(false);
  const { count, setOpen } = useCart();
  const { data: settings } = useQuery(settingsQuery);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-display text-base font-bold text-primary-foreground">
              NB
            </span>
            <span className="font-display text-base leading-tight font-extrabold text-primary">
              Nasi Bakar
              <span className="block text-[0.7rem] font-semibold tracking-widest text-muted-foreground uppercase">
                Ibu Ena
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-full px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
                activeProps={{ className: "bg-accent text-accent-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="relative rounded-full" onClick={() => setOpen(true)} aria-label="Buka keranjang">
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[0.65rem] font-bold text-gold-foreground">
                  {count}
                </span>
              )}
            </Button>
            <Button asChild variant="gold" className="hidden sm:inline-flex">
              <a
                href={waLink(settings?.wa_number ?? "6283160599421", "Halo Admin Nasi Bakar Ibu Ena, saya mau pesan.")}
                target="_blank"
                rel="noreferrer"
              >
                Pesan Sekarang
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpenNav((v) => !v)}
              aria-label="Menu navigasi"
            >
              {openNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {openNav && (
          <nav className="border-t border-border bg-background lg:hidden">
            <div className="container-page grid gap-1 py-3">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpenNav(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/85 hover:bg-accent"
                  activeProps={{ className: "bg-accent text-accent-foreground" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-auto bg-primary text-primary-foreground">
        <div className="container-page grid gap-10 py-14 md:grid-cols-4">
          <div className="md:col-span-1">
            <p className="font-display text-xl font-extrabold">Nasi Bakar Ibu Ena</p>
            <p className="mt-3 text-sm text-primary-foreground/75">
              Nasi bakar daun pisang, dibakar arang asli dengan resep rumahan Cirebon.
            </p>
          </div>
          <div>
            <p className="font-display text-sm font-bold tracking-wider uppercase">Jelajahi</p>
            <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-gold">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-display text-sm font-bold tracking-wider uppercase">Kontak</p>
            <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
              <li className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <a href={waLink(settings?.wa_number ?? "6283160599421", "Halo Admin Nasi Bakar Ibu Ena")}>
                  {settings?.wa_number ?? "6283160599421"}
                </a>
              </li>
              <li className="flex gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>{settings?.open_hours ?? "09.00 - 20.00 WIB"}</span>
              </li>
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>Sumber, Kabupaten Cirebon</span>
              </li>
              {settings?.instagram_url ? (
                <li className="flex gap-2">
                  <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <a href={settings.instagram_url} target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
          <div>
            <p className="font-display text-sm font-bold tracking-wider uppercase">Pesan Online</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button asChild variant="gold" size="sm">
                <a
                  href={waLink(settings?.wa_number ?? "6283160599421", "Halo Admin Nasi Bakar Ibu Ena, saya mau pesan.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </Button>
              {settings?.gofood_url ? (
                <Button asChild variant="outlineLight" size="sm">
                  <a href={settings.gofood_url} target="_blank" rel="noreferrer">
                    GoFood
                  </a>
                </Button>
              ) : null}
              {settings?.grabfood_url ? (
                <Button asChild variant="outlineLight" size="sm">
                  <a href={settings.grabfood_url} target="_blank" rel="noreferrer">
                    GrabFood
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/15">
          <div className="container-page flex flex-col gap-2 py-5 text-xs text-primary-foreground/65 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Nasi Bakar Ibu Ena. Semua hak cipta dilindungi.</span>
            <Link to="/admin" className="hover:text-gold">
              Login Admin
            </Link>
          </div>
        </div>
      </footer>

      <CartSheet />
      <ChatWidget />
    </div>
  );
}

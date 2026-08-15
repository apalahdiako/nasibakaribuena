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
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-[92rem] items-center justify-between gap-4 px-5 md:px-10">
          <Link to="/" className="leading-[0.85]">
            <span className="block font-script text-2xl font-bold text-foreground md:text-3xl">nasi bakar</span>
            <span className="block font-script text-2xl font-bold text-foreground md:text-3xl">ibu ena</span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-[0.95rem] font-normal text-foreground/85 transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground underline underline-offset-8 decoration-[1.5px]" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Buka keranjang"
              className="relative grid h-10 w-10 place-items-center text-foreground transition-opacity hover:opacity-70"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[0.6rem] font-bold text-background">
                  {count}
                </span>
              )}
            </button>
            <Button asChild size="sm" className="hidden rounded-full px-5 sm:inline-flex">
              <a
                href={waLink(settings?.wa_number ?? "6283160599421", "Halo Admin Nasi Bakar Ibu Ena, saya mau pesan.")}
                target="_blank"
                rel="noreferrer"
              >
                Order
              </a>
            </Button>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center lg:hidden"
              onClick={() => setOpenNav((v) => !v)}
              aria-label="Menu navigasi"
            >
              {openNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {openNav && (
          <nav className="border-t border-border bg-background lg:hidden">
            <div className="grid gap-1 px-5 py-3">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpenNav(false)}
                  className="py-2.5 text-[0.95rem] text-foreground/85"
                  activeProps={{ className: "font-semibold text-foreground" }}
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

      <footer className="mt-auto border-t border-border bg-background">
        <div className="mx-auto w-full max-w-[92rem] px-5 py-14 md:px-10">
          <div className="flex flex-col items-center gap-6 text-center">
            <p className="font-script text-4xl leading-[0.85] font-bold">
              nasi bakar
              <span className="block">ibu ena</span>
            </p>
            <nav className="flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm text-foreground/75">
              {NAV.map((item) => (
                <Link key={item.to} to={item.to} className="hover:text-foreground">
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="sm" className="rounded-full px-6">
                <a
                  href={waLink(settings?.wa_number ?? "6283160599421", "Halo Admin Nasi Bakar Ibu Ena, saya mau pesan.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </Button>
              {settings?.gofood_url ? (
                <Button asChild size="sm" variant="outline" className="rounded-full px-6">
                  <a href={settings.gofood_url} target="_blank" rel="noreferrer">
                    GoFood
                  </a>
                </Button>
              ) : null}
              {settings?.grabfood_url ? (
                <Button asChild size="sm" variant="outline" className="rounded-full px-6">
                  <a href={settings.grabfood_url} target="_blank" rel="noreferrer">
                    GrabFood
                  </a>
                </Button>
              ) : null}
            </div>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href={waLink(settings?.wa_number ?? "6283160599421", "Halo Admin Nasi Bakar Ibu Ena")}>
                  {settings?.wa_number ?? "6283160599421"}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{settings?.open_hours ?? "09.00 - 20.00 WIB"}</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Sumber, Kabupaten Cirebon</span>
              </li>
              {settings?.instagram_url ? (
                <li className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  <a href={settings.instagram_url} target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-2 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-10">
            <span>© {new Date().getFullYear()} Nasi Bakar Ibu Ena. Semua hak cipta dilindungi.</span>
            <Link to="/admin" className="hover:text-foreground">
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

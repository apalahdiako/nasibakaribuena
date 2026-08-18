import { useState } from "react";
import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  UtensilsCrossed,
  Megaphone,
  MessagesSquare,
  Users,
  Settings,
  Menu as MenuIcon,
  X,
  LogOut,
  Radio,
  Star,
  Ticket,
  Wallet,
  Bell,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin — Nasi Bakar Ibu Ena" },
      { name: "description", content: "Area staf Nasi Bakar Ibu Ena untuk mengelola pesanan, menu, promo, dan live chat." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Dashboard Admin — Nasi Bakar Ibu Ena" },
      { property: "og:description", content: "Area staf internal Nasi Bakar Ibu Ena." },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/pesanan", label: "Pesanan", icon: ClipboardList },
  { to: "/admin/inbox", label: "Inbox Chat", icon: MessagesSquare },
  { to: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/admin/promo", label: "Promo", icon: Megaphone },
  { to: "/admin/kasir", label: "Kasir / POS", icon: ClipboardList },
  { to: "/admin/inventori", label: "Inventori", icon: UtensilsCrossed },
  { to: "/admin/invoice", label: "Invoice B2B", icon: ClipboardList },
  { to: "/admin/keuangan", label: "Keuangan", icon: BarChart3 },
  { to: "/admin/analitik", label: "Analitik", icon: BarChart3 },
  { to: "/admin/pelanggan", label: "Pelanggan", icon: Users },
  { to: "/admin/voucher", label: "Voucher", icon: Ticket },
  { to: "/admin/kasbon", label: "Kasbon", icon: Wallet },
  { to: "/admin/review", label: "Review", icon: Star },
  { to: "/admin/notifikasi", label: "Notifikasi", icon: Bell },
  { to: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
] as const;

function LiveBadge() {
  const { live } = useRealtime({
    channelName: "admin-status",
    tables: { orders_log: ["orders_log"], chat_sessions: ["chat_sessions"] },
  });
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold " +
        (live ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground")
      }
    >
      <Radio className={"h-3 w-3 " + (live ? "animate-pulse" : "")} />
      {live ? "Live" : "Menghubungkan…"}
    </span>
  );
}

function AdminLayout() {
  const { user, role, isStaff, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setBusy(false);
      if (error) toast.error(error.message);
      else toast.success("Akun dibuat. Silakan masuk.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Memuat…</div>;
  }

  if (!user || !isStaff) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/40 px-4">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl border border-border bg-card p-7 shadow-soft">
          <h1 className="font-display text-2xl font-extrabold">{mode === "signin" ? "Login Staf" : "Buat Akun Staf"}</h1>
          {user && !isStaff ? <p className="text-sm text-destructive">Akun ini belum memiliki akses staf.</p> : null}
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Memproses…" : mode === "signin" ? "Masuk" : "Daftar"}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
          </Button>
          {user ? (
            <Button type="button" variant="outline" className="w-full" onClick={() => supabase.auth.signOut()}>
              Keluar
            </Button>
          ) : null}
        </form>
      </div>
    );
  }

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <Link to="/admin" className="mb-4 block px-2 leading-tight" onClick={() => setNavOpen(false)}>
        <span className="block font-script text-2xl font-bold">ibu ena</span>
        <span className="text-[0.7rem] uppercase tracking-widest text-muted-foreground">Admin Panel</span>
      </Link>
      {NAV.map(({ to, label, icon: Icon, ...rest }) => {
        const active = "exact" in rest && rest.exact ? pathname === to : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={() => setNavOpen(false)}
            className={
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors " +
              (active ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-accent hover:text-foreground")
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
      <div className="mt-auto space-y-2 pt-4">
        <Link to="/" className="block rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-accent">
          Lihat situs
        </Link>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => supabase.auth.signOut()}>
          <LogOut className="h-4 w-4" /> Keluar
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-card lg:block">{sidebar}</aside>

      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-card shadow-lift">
            <button className="absolute right-3 top-4" onClick={() => setNavOpen(false)} aria-label="Tutup menu">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-7">
            <div className="flex items-center gap-3">
              <button className="lg:hidden" onClick={() => setNavOpen(true)} aria-label="Buka menu">
                <MenuIcon className="h-5 w-5" />
              </button>
              <LiveBadge />
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">{user.email}</p>
              <p className="capitalize">{role}</p>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-7 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

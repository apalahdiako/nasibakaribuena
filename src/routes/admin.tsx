import { useState } from "react";
import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin — Nasi Bakar Ibu Ena" },
      { name: "description", content: "Area staf Nasi Bakar Ibu Ena untuk mengelola menu, promo, chat, dan pesanan." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Dashboard Admin — Nasi Bakar Ibu Ena" },
      { property: "og:description", content: "Area staf internal Nasi Bakar Ibu Ena." },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, role, isStaff, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Memuat…</div>;
  }

  if (!user || !isStaff) {
    return (
      <div className="grid min-h-screen place-items-center bg-sage/30 px-4">
        <form onSubmit={signIn} className="w-full max-w-sm space-y-4 rounded-3xl bg-card p-7 shadow-soft">
          <h1 className="font-display text-2xl font-extrabold">Login Staf</h1>
          {user && !isStaff ? (
            <p className="text-sm text-destructive">Akun ini belum memiliki akses staf.</p>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" variant="gold" className="w-full" disabled={busy}>
            {busy ? "Memproses…" : "Masuk"}
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

  return (
    <div className="min-h-screen bg-sage/20">
      <header className="border-b border-border bg-card">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="font-display text-lg font-extrabold">Dashboard Ibu Ena</p>
            <p className="text-xs text-muted-foreground">
              {user.email} · {role}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">Lihat situs</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
              Keluar
            </Button>
          </div>
        </div>
      </header>
      <main className="container-page py-8">
        <Outlet />
      </main>
    </div>
  );
}

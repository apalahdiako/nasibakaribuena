import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { menuQuery, promosQuery, outletsQuery } from "@/lib/queries";
import { rupiah } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { data: menu = [] } = useQuery(menuQuery);
  const { data: promos = [] } = useQuery(promosQuery);
  const { data: outlets = [] } = useQuery(outletsQuery);
  const { data: orders = [] } = useQuery({
    queryKey: ["orders_log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const stats = [
    { label: "Menu aktif", value: menu.filter((m) => m.status === "aktif").length },
    { label: "Promo", value: promos.length },
    { label: "Outlet", value: outlets.length },
    { label: "Pesanan tercatat", value: orders.length },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl bg-card p-6 shadow-soft">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-3xl font-extrabold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl bg-card shadow-soft">
        <h2 className="border-b border-border p-5 font-display text-lg font-bold">Pesanan terbaru</h2>
        {orders.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Belum ada pesanan tercatat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Nama</th>
                  <th className="p-3">Kanal</th>
                  <th className="p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="p-3">{new Date(o.created_at).toLocaleString("id-ID")}</td>
                    <td className="p-3">{o.customer_name}</td>
                    <td className="p-3 capitalize">{o.channel}</td>
                    <td className="p-3 font-semibold">{rupiah(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type MenuItem = Tables<"menu_items">;
export type Promo = Tables<"promos">;
export type Outlet = Tables<"outlets">;
export type SiteSettings = Tables<"site_settings">;
export type OrderLog = Tables<"orders_log">;
export type ChatSession = Tables<"chat_sessions">;
export type ChatMessage = Tables<"chat_messages">;

export const menuQuery = queryOptions({
  queryKey: ["menu_items"],
  queryFn: async (): Promise<MenuItem[]> => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_deleted", false)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const promosQuery = queryOptions({
  queryKey: ["promos"],
  queryFn: async (): Promise<Promo[]> => {
    const { data, error } = await supabase
      .from("promos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const outletsQuery = queryOptions({
  queryKey: ["outlets"],
  queryFn: async (): Promise<Outlet[]> => {
    const { data, error } = await supabase.from("outlets").select("*").order("created_at");
    if (error) throw error;
    return data ?? [];
  },
});

export const settingsQuery = queryOptions({
  queryKey: ["site_settings"],
  queryFn: async (): Promise<SiteSettings | null> => {
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const ordersQuery = queryOptions({
  queryKey: ["orders_log"],
  queryFn: async (): Promise<OrderLog[]> => {
    const { data, error } = await supabase
      .from("orders_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  },
});

export const chatSessionsQuery = queryOptions({
  queryKey: ["chat_sessions"],
  queryFn: async (): Promise<ChatSession[]> => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

export function activePromos(promos: Promo[]): Promo[] {
  const today = new Date().toISOString().slice(0, 10);
  return promos.filter(
    (p) => p.is_active && (!p.start_date || p.start_date <= today) && (!p.end_date || p.end_date >= today),
  );
}

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

/* ============ MODUL OPERASIONAL LANJUTAN ============ */
export type Ingredient = Tables<"ingredients">;
export type Recipe = Tables<"recipes">;
export type StockMovement = Tables<"stock_movements">;
export type Customer = Tables<"customers">;
export type Voucher = Tables<"vouchers">;
export type Transaction = Tables<"transactions">;
export type TransactionItem = Tables<"transaction_items">;
export type Invoice = Tables<"invoices">;
export type InvoiceItem = Tables<"invoice_items">;
export type Account = Tables<"chart_of_accounts">;
export type JournalEntry = Tables<"journal_entries">;
export type Kasbon = Tables<"kasbon">;
export type Review = Tables<"reviews">;
export type Notification = Tables<"notifications">;

function list<T>(key: string, table: string, order: string, asc = false) {
  return queryOptions({
    queryKey: [key],
    queryFn: async (): Promise<T[]> => {
      const { data, error } = await supabase.from(table as never).select("*").order(order, { ascending: asc });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export const ingredientsQuery = list<Ingredient>("ingredients", "ingredients", "name", true);
export const recipesQuery = list<Recipe>("recipes", "recipes", "created_at");
export const movementsQuery = list<StockMovement>("stock_movements", "stock_movements", "created_at");
export const customersQuery = list<Customer>("customers", "customers", "total_spent");
export const vouchersQuery = list<Voucher>("vouchers", "vouchers", "created_at");
export const transactionsQuery = list<Transaction>("transactions", "transactions", "created_at");
export const transactionItemsQuery = list<TransactionItem>("transaction_items", "transaction_items", "created_at");
export const invoicesQuery = list<Invoice>("invoices", "invoices", "created_at");
export const invoiceItemsQuery = list<InvoiceItem>("invoice_items", "invoice_items", "created_at");
export const accountsQuery = list<Account>("chart_of_accounts", "chart_of_accounts", "code", true);
export const journalQuery = list<JournalEntry>("journal_entries", "journal_entries", "entry_date");
export const kasbonQuery = list<Kasbon>("kasbon", "kasbon", "created_at");
export const reviewsQuery = list<Review>("reviews", "reviews", "created_at");
export const notificationsQuery = list<Notification>("notifications", "notifications", "created_at");

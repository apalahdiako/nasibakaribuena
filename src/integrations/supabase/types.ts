export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_email: string
          created_at: string
          detail: string
          entity: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string
          created_at?: string
          detail?: string
          entity?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string
          created_at?: string
          detail?: string
          entity?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          type?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          admin_typing: boolean
          assigned_to: string | null
          created_at: string
          id: string
          last_message_at: string
          status: string
          visitor_name: string | null
        }
        Insert: {
          admin_typing?: boolean
          assigned_to?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          visitor_name?: string | null
        }
        Update: {
          admin_typing?: boolean
          assigned_to?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          visitor_name?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          order_count: number
          phone: string | null
          points: number
          tier: string
          total_spent: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          order_count?: number
          phone?: string | null
          points?: number
          tier?: string
          total_spent?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          order_count?: number
          phone?: string | null
          points?: number
          tier?: string
          total_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          cost_per_unit: number
          created_at: string
          id: string
          min_stock: number
          name: string
          stock: number
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          min_stock?: number
          name: string
          stock?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          min_stock?: number
          name?: string
          stock?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          cost: number
          created_at: string
          id: string
          invoice_id: string
          menu_item_id: string | null
          name: string
          price: number
          qty: number
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          invoice_id: string
          menu_item_id?: string | null
          name: string
          price?: number
          qty?: number
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          invoice_id?: string
          menu_item_id?: string | null
          name?: string
          price?: number
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_name: string
          customer_phone: string | null
          discount: number
          due_date: string | null
          id: string
          invoice_no: string
          issue_date: string
          note: string | null
          status: string
          subtotal: number
          tax_percent: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_name: string
          customer_phone?: string | null
          discount?: number
          due_date?: string | null
          id?: string
          invoice_no?: string
          issue_date?: string
          note?: string | null
          status?: string
          subtotal?: number
          tax_percent?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount?: number
          due_date?: string | null
          id?: string
          invoice_no?: string
          issue_date?: string
          note?: string | null
          status?: string
          subtotal?: number
          tax_percent?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          account_code: string
          actor_email: string | null
          created_at: string
          credit: number
          debit: number
          description: string
          entry_date: string
          id: string
          ref_id: string | null
          ref_type: string | null
        }
        Insert: {
          account_code: string
          actor_email?: string | null
          created_at?: string
          credit?: number
          debit?: number
          description: string
          entry_date?: string
          id?: string
          ref_id?: string | null
          ref_type?: string | null
        }
        Update: {
          account_code?: string
          actor_email?: string | null
          created_at?: string
          credit?: number
          debit?: number
          description?: string
          entry_date?: string
          id?: string
          ref_id?: string | null
          ref_type?: string | null
        }
        Relationships: []
      }
      kasbon: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          customer_id: string | null
          due_date: string | null
          id: string
          name: string
          note: string | null
          paid_amount: number
          phone: string | null
          reject_reason: string | null
          requested_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          name: string
          note?: string | null
          paid_amount?: number
          phone?: string | null
          reject_reason?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          name?: string
          note?: string | null
          paid_amount?: number
          phone?: string | null
          reject_reason?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kasbon_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      kasbon_payments: {
        Row: {
          actor_email: string | null
          amount: number
          id: string
          kasbon_id: string
          paid_at: string
        }
        Insert: {
          actor_email?: string | null
          amount?: number
          id?: string
          kasbon_id: string
          paid_at?: string
        }
        Update: {
          actor_email?: string | null
          amount?: number
          id?: string
          kasbon_id?: string
          paid_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kasbon_payments_kasbon_id_fkey"
            columns: ["kasbon_id"]
            isOneToOne: false
            referencedRelation: "kasbon"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          badge: string | null
          category: string
          created_at: string
          description: string
          has_spicy_option: boolean
          id: string
          image_url: string | null
          is_deleted: boolean
          name: string
          price: number
          slug: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          category?: string
          created_at?: string
          description?: string
          has_spicy_option?: boolean
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          name: string
          price?: number
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          category?: string
          created_at?: string
          description?: string
          has_spicy_option?: boolean
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          name?: string
          price?: number
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          ref_id: string | null
          ref_type: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          ref_id?: string | null
          ref_type?: string | null
          title: string
          type?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          ref_id?: string | null
          ref_type?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      orders_log: {
        Row: {
          address: string
          channel: string
          created_at: string
          customer_name: string
          id: string
          items: Json
          note: string | null
          order_no: number
          payment_method: string
          phone: string
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          address?: string
          channel?: string
          created_at?: string
          customer_name?: string
          id?: string
          items?: Json
          note?: string | null
          order_no?: number
          payment_method?: string
          phone?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          address?: string
          channel?: string
          created_at?: string
          customer_name?: string
          id?: string
          items?: Json
          note?: string | null
          order_no?: number
          payment_method?: string
          phone?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      outlets: {
        Row: {
          address: string
          created_at: string
          id: string
          is_open: boolean
          lat: number | null
          lng: number | null
          maps_url: string | null
          name: string
          open_hours: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_open?: boolean
          lat?: number | null
          lng?: number | null
          maps_url?: string | null
          name: string
          open_hours?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_open?: boolean
          lat?: number | null
          lng?: number | null
          maps_url?: string | null
          name?: string
          open_hours?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      promos: {
        Row: {
          clicks: number
          created_at: string
          description: string
          end_date: string | null
          id: string
          image_url: string | null
          impressions: number
          is_active: boolean
          menu_item_id: string | null
          original_price: number | null
          placement: string
          promo_price: number | null
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          is_active?: boolean
          menu_item_id?: string | null
          original_price?: number | null
          placement?: string
          promo_price?: number | null
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          clicks?: number
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          is_active?: boolean
          menu_item_id?: string | null
          original_price?: number | null
          placement?: string
          promo_price?: number | null
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promos_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          menu_item_id: string
          qty: number
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          menu_item_id: string
          qty?: number
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          menu_item_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipes_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          admin_reply: string | null
          comment: string | null
          created_at: string
          customer_name: string
          id: string
          is_complaint: boolean
          is_published: boolean
          menu_item_id: string | null
          phone: string | null
          rating: number
          status: string
        }
        Insert: {
          admin_reply?: string | null
          comment?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          is_complaint?: boolean
          is_published?: boolean
          menu_item_id?: string | null
          phone?: string | null
          rating?: number
          status?: string
        }
        Update: {
          admin_reply?: string | null
          comment?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          is_complaint?: boolean
          is_published?: boolean
          menu_item_id?: string | null
          phone?: string | null
          rating?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          about_text: string
          ai_knowledge: string
          delivery_area: string
          email: string | null
          gofood_url: string | null
          grabfood_url: string | null
          hero_image_url: string | null
          hero_subtitle: string
          hero_title: string
          id: number
          instagram_url: string | null
          open_hours: string
          shopeefood_url: string | null
          tiktok_url: string | null
          updated_at: string
          wa_number: string
        }
        Insert: {
          about_text?: string
          ai_knowledge?: string
          delivery_area?: string
          email?: string | null
          gofood_url?: string | null
          grabfood_url?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string
          hero_title?: string
          id?: number
          instagram_url?: string | null
          open_hours?: string
          shopeefood_url?: string | null
          tiktok_url?: string | null
          updated_at?: string
          wa_number?: string
        }
        Update: {
          about_text?: string
          ai_knowledge?: string
          delivery_area?: string
          email?: string | null
          gofood_url?: string | null
          grabfood_url?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string
          hero_title?: string
          id?: number
          instagram_url?: string | null
          open_hours?: string
          shopeefood_url?: string | null
          tiktok_url?: string | null
          updated_at?: string
          wa_number?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          actor_email: string | null
          change: number
          created_at: string
          id: string
          ingredient_id: string
          note: string | null
          reason: string
        }
        Insert: {
          actor_email?: string | null
          change: number
          created_at?: string
          id?: string
          ingredient_id: string
          note?: string | null
          reason?: string
        }
        Update: {
          actor_email?: string | null
          change?: number
          created_at?: string
          id?: string
          ingredient_id?: string
          note?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string | null
          name: string
          price: number
          qty: number
          transaction_id: string
          variant: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name: string
          price?: number
          qty?: number
          transaction_id: string
          variant?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name?: string
          price?: number
          qty?: number
          transaction_id?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          cashier_email: string | null
          change_due: number
          channel: string
          created_at: string
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          discount: number
          id: string
          note: string | null
          paid: number
          payment_method: string
          subtotal: number
          total: number
          trx_no: string
        }
        Insert: {
          cashier_email?: string | null
          change_due?: number
          channel?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          id?: string
          note?: string | null
          paid?: number
          payment_method?: string
          subtotal?: number
          total?: number
          trx_no?: string
        }
        Update: {
          cashier_email?: string | null
          change_due?: number
          channel?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          id?: string
          note?: string | null
          paid?: number
          payment_method?: string
          subtotal?: number
          total?: number
          trx_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voucher_redemptions: {
        Row: {
          actor_email: string | null
          code: string
          created_at: string
          customer_name: string | null
          discount_amount: number
          id: string
          ref_id: string | null
          ref_type: string
          voucher_id: string
        }
        Insert: {
          actor_email?: string | null
          code: string
          created_at?: string
          customer_name?: string | null
          discount_amount?: number
          id?: string
          ref_id?: string | null
          ref_type?: string
          voucher_id: string
        }
        Update: {
          actor_email?: string | null
          code?: string
          created_at?: string
          customer_name?: string | null
          discount_amount?: number
          id?: string
          ref_id?: string | null
          ref_type?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_redemptions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean
          min_spend: number
          quota: number
          starts_at: string | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_spend?: number
          quota?: number
          starts_at?: string | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_spend?: number
          quota?: number
          starts_at?: string | null
          used_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "superadmin" | "admin" | "kasir" | "dapur" | "akuntan"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["superadmin", "admin", "kasir", "dapur", "akuntan"],
    },
  },
} as const

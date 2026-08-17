
-- ============ INVENTORY ============
CREATE TABLE public.ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'gram',
  stock numeric NOT NULL DEFAULT 0,
  min_stock numeric NOT NULL DEFAULT 0,
  cost_per_unit numeric NOT NULL DEFAULT 0,
  supplier text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredients TO authenticated;
GRANT ALL ON public.ingredients TO service_role;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage ingredients" ON public.ingredients FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  qty numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (menu_item_id, ingredient_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage recipes" ON public.recipes FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  change numeric NOT NULL,
  reason text NOT NULL DEFAULT 'manual',
  note text,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read movements" ON public.stock_movements FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- ============ CUSTOMERS / LOYALTY ============
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text UNIQUE,
  email text,
  tier text NOT NULL DEFAULT 'Reguler',
  points integer NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  order_count integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage customers" ON public.customers FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'nominal',
  discount_value numeric NOT NULL DEFAULT 0,
  min_spend numeric NOT NULL DEFAULT 0,
  quota integer NOT NULL DEFAULT 100,
  used_count integer NOT NULL DEFAULT 0,
  starts_at date,
  ends_at date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vouchers TO authenticated;
GRANT SELECT ON public.vouchers TO anon;
GRANT ALL ON public.vouchers TO service_role;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active vouchers" ON public.vouchers FOR SELECT USING (is_active = true);
CREATE POLICY "staff manage vouchers" ON public.vouchers FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ POS TRANSACTIONS ============
CREATE SEQUENCE IF NOT EXISTS public.trx_seq;
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trx_no text NOT NULL DEFAULT ('TRX-' || to_char(now(),'YYMMDD') || '-' || lpad(nextval('public.trx_seq')::text, 4, '0')),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  channel text NOT NULL DEFAULT 'kasir',
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  paid numeric NOT NULL DEFAULT 0,
  change_due numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'tunai',
  cashier_email text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage transactions" ON public.transactions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  variant text,
  qty integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaction_items TO authenticated;
GRANT ALL ON public.transaction_items TO service_role;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage transaction items" ON public.transaction_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ INVOICE B2B ============
CREATE SEQUENCE IF NOT EXISTS public.inv_seq;
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no text NOT NULL DEFAULT ('INV-' || to_char(now(),'YYMM') || '-' || lpad(nextval('public.inv_seq')::text, 4, '0')),
  customer_name text NOT NULL,
  customer_phone text,
  customer_address text,
  issue_date date NOT NULL DEFAULT current_date,
  due_date date,
  tax_percent numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage invoices" ON public.invoices FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage invoice items" ON public.invoice_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ ACCOUNTING ============
CREATE TABLE public.chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'beban',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chart_of_accounts TO authenticated;
GRANT ALL ON public.chart_of_accounts TO service_role;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage coa" ON public.chart_of_accounts FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT current_date,
  description text NOT NULL,
  account_code text NOT NULL,
  debit numeric NOT NULL DEFAULT 0,
  credit numeric NOT NULL DEFAULT 0,
  ref_type text,
  ref_id uuid,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage journal" ON public.journal_entries FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

INSERT INTO public.chart_of_accounts (code, name, type) VALUES
  ('1-100','Kas','aset'),
  ('1-110','Bank / Transfer','aset'),
  ('1-120','Piutang Usaha','aset'),
  ('1-130','Persediaan Bahan Baku','aset'),
  ('2-100','Hutang Usaha','kewajiban'),
  ('3-100','Modal Pemilik','modal'),
  ('4-100','Pendapatan Penjualan','pendapatan'),
  ('5-100','Harga Pokok Penjualan','beban'),
  ('6-100','Beban Operasional','beban');

-- ============ KASBON ============
CREATE TABLE public.kasbon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  due_date date,
  status text NOT NULL DEFAULT 'belum_lunas',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kasbon TO authenticated;
GRANT ALL ON public.kasbon TO service_role;
ALTER TABLE public.kasbon ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage kasbon" ON public.kasbon FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.kasbon_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kasbon_id uuid NOT NULL REFERENCES public.kasbon(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  paid_at timestamptz NOT NULL DEFAULT now(),
  actor_email text
);
GRANT SELECT, INSERT, DELETE ON public.kasbon_payments TO authenticated;
GRANT ALL ON public.kasbon_payments TO service_role;
ALTER TABLE public.kasbon_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage kasbon payments" ON public.kasbon_payments FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ REVIEWS ============
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  customer_name text NOT NULL DEFAULT 'Pelanggan',
  phone text,
  rating integer NOT NULL DEFAULT 5,
  comment text,
  is_complaint boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open',
  admin_reply text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published reviews" ON public.reviews FOR SELECT USING (is_published = true);
CREATE POLICY "anyone can submit review" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "staff manage reviews" ON public.reviews FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  is_read boolean NOT NULL DEFAULT false,
  ref_type text,
  ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage notifications" ON public.notifications FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER t_ingredients_updated BEFORE UPDATE ON public.ingredients FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_kasbon_updated BEFORE UPDATE ON public.kasbon FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- stok bahan berubah -> catat pergerakan otomatis? (dilakukan di app), tapi update stok saat movement:
CREATE OR REPLACE FUNCTION public.apply_stock_movement() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.ingredients SET stock = stock + NEW.change WHERE id = NEW.ingredient_id;
  INSERT INTO public.notifications (type, title, body, ref_type, ref_id)
  SELECT 'stok', 'Stok menipis: ' || i.name, 'Sisa ' || i.stock || ' ' || i.unit, 'ingredient', i.id
  FROM public.ingredients i WHERE i.id = NEW.ingredient_id AND i.stock <= i.min_stock;
  RETURN NEW;
END; $$;
CREATE TRIGGER t_stock_movement AFTER INSERT ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

-- loyalty: tiap transaksi selesai tambah poin & tier
CREATE OR REPLACE FUNCTION public.apply_loyalty() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid; spent numeric;
BEGIN
  IF NEW.customer_phone IS NULL OR NEW.customer_phone = '' THEN RETURN NEW; END IF;
  INSERT INTO public.customers (name, phone) VALUES (COALESCE(NULLIF(NEW.customer_name,''),'Pelanggan'), NEW.customer_phone)
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO cid;
  UPDATE public.customers
    SET points = points + floor(NEW.total / 1000)::int,
        total_spent = total_spent + NEW.total,
        order_count = order_count + 1
    WHERE id = cid
    RETURNING total_spent INTO spent;
  UPDATE public.customers SET tier = CASE
      WHEN spent >= 5000000 THEN 'Platinum'
      WHEN spent >= 2000000 THEN 'Gold'
      WHEN spent >= 500000 THEN 'Silver'
      ELSE 'Reguler' END
    WHERE id = cid;
  UPDATE public.transactions SET customer_id = cid WHERE id = NEW.id AND customer_id IS NULL;
  RETURN NEW;
END; $$;
CREATE TRIGGER t_transaction_loyalty AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.apply_loyalty();

-- jurnal otomatis dari transaksi kasir
CREATE OR REPLACE FUNCTION public.journal_from_transaction() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE acc text;
BEGIN
  acc := CASE WHEN NEW.payment_method = 'tunai' THEN '1-100' ELSE '1-110' END;
  INSERT INTO public.journal_entries (description, account_code, debit, credit, ref_type, ref_id, actor_email)
  VALUES ('Penjualan kasir ' || NEW.trx_no, acc, NEW.total, 0, 'transaction', NEW.id, NEW.cashier_email),
         ('Penjualan kasir ' || NEW.trx_no, '4-100', 0, NEW.total, 'transaction', NEW.id, NEW.cashier_email);
  INSERT INTO public.notifications (type, title, body, ref_type, ref_id)
  VALUES ('transaksi', 'Transaksi baru ' || NEW.trx_no, 'Total Rp ' || NEW.total, 'transaction', NEW.id);
  RETURN NEW;
END; $$;
CREATE TRIGGER t_transaction_journal AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.journal_from_transaction();

-- realtime
ALTER TABLE public.ingredients REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.invoices REPLICA IDENTITY FULL;
ALTER TABLE public.kasbon REPLICA IDENTITY FULL;
ALTER TABLE public.reviews REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.customers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ingredients, public.transactions, public.invoices, public.kasbon, public.reviews, public.notifications, public.customers;

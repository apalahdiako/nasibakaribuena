-- roles
CREATE TYPE public.app_role AS ENUM ('superadmin','admin');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "roles_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''))
  ON CONFLICT (id) DO NOTHING;
  IF lower(NEW.email) = 'bayurajasyah@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'superadmin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- menu
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Nasi Bakar',
  price INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  badge TEXT,
  has_spicy_option BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'aktif',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu_public_read" ON public.menu_items FOR SELECT TO anon, authenticated USING (is_deleted = false);
CREATE POLICY "menu_admin_write" ON public.menu_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER menu_touch BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- promos
CREATE TABLE public.promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promos TO authenticated;
GRANT ALL ON public.promos TO service_role;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promos_public_read" ON public.promos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "promos_admin_write" ON public.promos FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER promos_touch BEFORE UPDATE ON public.promos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- outlets
CREATE TABLE public.outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  open_hours TEXT NOT NULL DEFAULT '09.00 - 20.00',
  whatsapp TEXT,
  maps_url TEXT,
  is_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.outlets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outlets TO authenticated;
GRANT ALL ON public.outlets TO service_role;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outlets_public_read" ON public.outlets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "outlets_admin_write" ON public.outlets FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER outlets_touch BEFORE UPDATE ON public.outlets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- settings (singleton row)
CREATE TABLE public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  wa_number TEXT NOT NULL DEFAULT '6283160599421',
  grabfood_url TEXT DEFAULT '',
  gofood_url TEXT DEFAULT '',
  shopeefood_url TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  tiktok_url TEXT DEFAULT '',
  email TEXT DEFAULT '',
  open_hours TEXT NOT NULL DEFAULT '09.00 - 20.00 WIB',
  hero_title TEXT NOT NULL DEFAULT 'Nasi Bakar Ibu Ena',
  hero_subtitle TEXT NOT NULL DEFAULT 'Dibakar arang asli, resep rumahan turun-temurun.',
  hero_image_url TEXT,
  about_text TEXT NOT NULL DEFAULT '',
  delivery_area TEXT NOT NULL DEFAULT 'Area Cirebon',
  ai_knowledge TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings_admin_write" ON public.site_settings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER settings_touch BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- chat
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT,
  status TEXT NOT NULL DEFAULT 'ai',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.chat_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_sessions TO authenticated;
GRANT ALL ON public.chat_sessions TO service_role;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_sessions_insert_any" ON public.chat_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "chat_sessions_select" ON public.chat_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "chat_sessions_update" ON public.chat_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_session_idx ON public.chat_messages(session_id, created_at);
GRANT SELECT, INSERT ON public.chat_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "chat_messages_admin_delete" ON public.chat_messages FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- orders
CREATE TABLE public.orders_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total INTEGER NOT NULL DEFAULT 0,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  note TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'baru',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders_log TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders_log TO authenticated;
GRANT ALL ON public.orders_log TO service_role;
ALTER TABLE public.orders_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_insert_any" ON public.orders_log FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "orders_admin_read" ON public.orders_log FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "orders_admin_write" ON public.orders_log FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "orders_admin_delete" ON public.orders_log FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- realtime
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.orders_log REPLICA IDENTITY FULL;
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;

-- seed
INSERT INTO public.site_settings (id, about_text, ai_knowledge, hero_subtitle, delivery_area, open_hours) VALUES (1,
'Nasi Bakar Ibu Ena berawal dari dapur rumahan di Sumber, Kabupaten Cirebon. Berbekal resep bumbu warisan keluarga, Ibu Ena membungkus nasi berbumbu dengan daun pisang lalu membakarnya di atas arang sampai wangi asapnya meresap. Kini setiap porsi masih dibuat dengan cara yang sama: bumbu diulek segar tiap pagi, ikan dan ayam dipilih harian, dan dibakar satu per satu saat dipesan.',
'Nasi Bakar Ibu Ena. Alamat: Jalan Pangeran Kejaksan, Gg. Pandu Blok Karang Asem, RT.02/RW.01, Babakan, Kec. Sumber, Kabupaten Cirebon, Jawa Barat 45612. Jam buka 09.00-20.00 WIB setiap hari. Delivery area Cirebon. Menu: Paket Small (Rp12.000): Nasi Bakar Ayam Suir, Nasi Bakar Tongkol, Nasi Bakar Cumi. Paket Large (Rp15.000): Nasi Bakar Mix Ayam Suir x Cumi, Nasi Bakar Mix Tongkol x Ayam Suir, Nasi Bakar Mix Cumi x Tongkol. Level pedas tersedia: Tidak Pedas, Pedas Sedang, Pedas. Pemesanan via WhatsApp 083160599421 atau lewat keranjang di website.',
'Dibakar arang asli, resep rumahan Cirebon turun-temurun.', 'Area Cirebon', '09.00 - 20.00 WIB');

INSERT INTO public.outlets (name, address, open_hours, whatsapp, is_open, lat, lng) VALUES
('Outlet Sumber (Pusat)', 'Jalan Pangeran Kejaksan, Gg. Pandu Blok Karang Asem, RT.02/RW.01, Babakan, Kec. Sumber, Kabupaten Cirebon, Jawa Barat 45612', '09.00 - 20.00 WIB', '6283160599421', true, -6.7320, 108.4780);

INSERT INTO public.menu_items (name, slug, description, category, price, badge, has_spicy_option, sort_order) VALUES
('Nasi Bakar Ayam Suir', 'nasi-bakar-ayam-suir', 'Paket Small. Nasi berbumbu dengan ayam suir kemangi, dibungkus daun pisang lalu dibakar arang.', 'Paket Small', 12000, 'Best Seller', true, 1),
('Nasi Bakar Tongkol', 'nasi-bakar-tongkol', 'Paket Small. Tongkol suwir bumbu rumahan, gurih dan wangi daun pisang bakar.', 'Paket Small', 12000, NULL, true, 2),
('Nasi Bakar Cumi', 'nasi-bakar-cumi', 'Paket Small. Cumi potong dengan bumbu hitam pedas manis khas Ibu Ena.', 'Paket Small', 12000, 'Favorit', true, 3),
('Nasi Bakar Mix Ayam Suir x Cumi', 'nasi-bakar-mix-ayam-cumi', 'Paket Large. Porsi lebih besar dengan dua isian sekaligus: ayam suir dan cumi.', 'Paket Large', 15000, 'Best Seller', true, 4),
('Nasi Bakar Mix Tongkol x Ayam Suir', 'nasi-bakar-mix-tongkol-ayam', 'Paket Large. Kombinasi tongkol suwir dan ayam suir kemangi dalam satu bungkus.', 'Paket Large', 15000, NULL, true, 5),
('Nasi Bakar Mix Cumi x Tongkol', 'nasi-bakar-mix-cumi-tongkol', 'Paket Large. Duet seafood: cumi bumbu hitam dan tongkol suwir pedas.', 'Paket Large', 15000, 'Baru', true, 6);
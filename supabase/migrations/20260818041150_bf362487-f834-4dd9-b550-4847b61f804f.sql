-- Kasbon: alur pengajuan & persetujuan
ALTER TABLE public.kasbon
  ADD COLUMN IF NOT EXISTS requested_by text,
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS reject_reason text,
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

-- Voucher redemptions
CREATE TABLE IF NOT EXISTS public.voucher_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id uuid NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  code text NOT NULL,
  ref_type text NOT NULL DEFAULT 'pos',
  ref_id uuid,
  customer_name text,
  discount_amount numeric NOT NULL DEFAULT 0,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voucher_redemptions TO authenticated;
GRANT ALL ON public.voucher_redemptions TO service_role;
ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff manage redemptions" ON public.voucher_redemptions;
CREATE POLICY "staff manage redemptions" ON public.voucher_redemptions FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Notifikasi: voucher dipakai
CREATE OR REPLACE FUNCTION public.notify_voucher_redeemed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.vouchers SET used_count = used_count + 1 WHERE id = NEW.voucher_id;
  INSERT INTO public.notifications (type, title, body, ref_type, ref_id)
  VALUES ('voucher', 'Voucher dipakai: ' || NEW.code,
          COALESCE(NEW.customer_name,'Pelanggan') || ' • diskon Rp ' || round(NEW.discount_amount),
          'voucher', NEW.voucher_id);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS t_voucher_redeemed ON public.voucher_redemptions;
CREATE TRIGGER t_voucher_redeemed AFTER INSERT ON public.voucher_redemptions
FOR EACH ROW EXECUTE FUNCTION public.notify_voucher_redeemed();

-- Notifikasi: kasbon berubah status
CREATE OR REPLACE FUNCTION public.notify_kasbon_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (type, title, body, ref_type, ref_id)
    VALUES ('kasbon', 'Pengajuan kasbon: ' || NEW.name, 'Rp ' || round(NEW.amount) || ' • status ' || NEW.status, 'kasbon', NEW.id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (type, title, body, ref_type, ref_id)
    VALUES ('kasbon', 'Kasbon ' || NEW.name || ' → ' || NEW.status,
            'Sisa Rp ' || round(GREATEST(NEW.amount - NEW.paid_amount, 0)), 'kasbon', NEW.id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS t_kasbon_notify ON public.kasbon;
CREATE TRIGGER t_kasbon_notify AFTER INSERT OR UPDATE ON public.kasbon
FOR EACH ROW EXECUTE FUNCTION public.notify_kasbon_status();

-- Pembayaran kasbon: update paid_amount & status otomatis
CREATE OR REPLACE FUNCTION public.apply_kasbon_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE total numeric; amt numeric;
BEGIN
  SELECT amount INTO amt FROM public.kasbon WHERE id = NEW.kasbon_id;
  SELECT COALESCE(sum(amount),0) INTO total FROM public.kasbon_payments WHERE kasbon_id = NEW.kasbon_id;
  UPDATE public.kasbon
     SET paid_amount = total,
         status = CASE WHEN total >= amt THEN 'lunas' WHEN total > 0 THEN 'sebagian' ELSE status END
   WHERE id = NEW.kasbon_id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS t_kasbon_payment ON public.kasbon_payments;
CREATE TRIGGER t_kasbon_payment AFTER INSERT ON public.kasbon_payments
FOR EACH ROW EXECUTE FUNCTION public.apply_kasbon_payment();

-- Notifikasi: invoice terkirim / lunas
CREATE OR REPLACE FUNCTION public.notify_invoice_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('terkirim','lunas') THEN
    INSERT INTO public.notifications (type, title, body, ref_type, ref_id)
    VALUES ('invoice', 'Invoice ' || NEW.invoice_no || ' ' || NEW.status,
            NEW.customer_name || ' • Rp ' || round(NEW.total), 'invoice', NEW.id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS t_invoice_notify ON public.invoices;
CREATE TRIGGER t_invoice_notify AFTER UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.notify_invoice_status();

-- Notifikasi: review baru
CREATE OR REPLACE FUNCTION public.notify_new_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (type, title, body, ref_type, ref_id)
  VALUES (CASE WHEN NEW.is_complaint THEN 'komplain' ELSE 'review' END,
          CASE WHEN NEW.is_complaint THEN 'Komplain baru dari ' ELSE 'Review baru dari ' END || NEW.customer_name,
          '★' || NEW.rating || ' • ' || COALESCE(left(NEW.comment, 90), ''), 'review', NEW.id);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS t_review_notify ON public.reviews;
CREATE TRIGGER t_review_notify AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.notify_new_review();

REVOKE EXECUTE ON FUNCTION public.notify_voucher_redeemed(), public.notify_kasbon_status(),
  public.apply_kasbon_payment(), public.notify_invoice_status(), public.notify_new_review()
  FROM anon, authenticated;

-- Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.reviews REPLICA IDENTITY FULL;
ALTER TABLE public.vouchers REPLICA IDENTITY FULL;
ALTER TABLE public.kasbon REPLICA IDENTITY FULL;
ALTER TABLE public.invoices REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.vouchers; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.kasbon; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
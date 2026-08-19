CREATE POLICY "public web voucher redemption" ON public.voucher_redemptions FOR INSERT TO anon, authenticated WITH CHECK (ref_type = 'web' AND actor_email IS NULL AND discount_amount >= 0);
GRANT INSERT ON public.voucher_redemptions TO anon;
GRANT SELECT ON public.vouchers TO anon;
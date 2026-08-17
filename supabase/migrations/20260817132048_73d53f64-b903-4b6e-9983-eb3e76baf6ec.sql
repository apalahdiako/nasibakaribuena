
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_stock_movement() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_loyalty() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.journal_from_transaction() FROM anon, authenticated;

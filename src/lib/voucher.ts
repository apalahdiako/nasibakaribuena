import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Voucher = Tables<"vouchers">;

export type VoucherCheck = { ok: true; voucher: Voucher; discount: number } | { ok: false; reason: string };

/** Hitung nilai diskon voucher terhadap subtotal. */
export function voucherDiscount(v: Voucher, subtotal: number): number {
  const raw = v.discount_type === "persen" ? (subtotal * Number(v.discount_value)) / 100 : Number(v.discount_value);
  return Math.max(0, Math.min(subtotal, Math.round(raw)));
}

/** Validasi syarat pakai voucher: aktif, periode, kuota, minimum belanja. */
export function checkVoucher(v: Voucher | null | undefined, subtotal: number): VoucherCheck {
  if (!v) return { ok: false, reason: "Kode voucher tidak ditemukan." };
  const today = new Date().toISOString().slice(0, 10);
  if (!v.is_active) return { ok: false, reason: "Voucher sedang nonaktif." };
  if (v.starts_at && v.starts_at > today) return { ok: false, reason: `Voucher berlaku mulai ${v.starts_at}.` };
  if (v.ends_at && v.ends_at < today) return { ok: false, reason: "Voucher sudah kedaluwarsa." };
  if (v.quota > 0 && v.used_count >= v.quota) return { ok: false, reason: "Kuota voucher sudah habis." };
  if (subtotal < Number(v.min_spend)) return { ok: false, reason: `Minimum belanja Rp ${Number(v.min_spend).toLocaleString("id-ID")}.` };
  return { ok: true, voucher: v, discount: voucherDiscount(v, subtotal) };
}

/** Ambil voucher berdasarkan kode lalu validasi. */
export async function validateVoucherCode(code: string, subtotal: number): Promise<VoucherCheck> {
  const clean = code.trim().toUpperCase();
  if (!clean) return { ok: false, reason: "Masukkan kode voucher." };
  const { data, error } = await supabase.from("vouchers").select("*").ilike("code", clean).maybeSingle();
  if (error) return { ok: false, reason: error.message };
  return checkVoucher(data, subtotal);
}

/** Catat pemakaian voucher (kuota & notifikasi diproses otomatis di backend). */
export async function redeemVoucher(params: {
  voucher: Voucher;
  discount: number;
  refType: "pos" | "invoice";
  refId?: string | null;
  customerName?: string | null;
  actorEmail?: string | null;
}) {
  const { error } = await supabase.from("voucher_redemptions").insert({
    voucher_id: params.voucher.id,
    code: params.voucher.code,
    ref_type: params.refType,
    ref_id: params.refId ?? null,
    customer_name: params.customerName || null,
    discount_amount: params.discount,
    actor_email: params.actorEmail ?? null,
  });
  if (error) throw new Error(error.message);
}

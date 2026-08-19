import { supabase } from "@/integrations/supabase/client";

const BUCKET = "menu-images";
/** ~10 tahun, cukup untuk dipakai sebagai URL gambar publik di website. */
const SIGNED_TTL = 60 * 60 * 24 * 365 * 10;

export const MAX_IMAGE_MB = 5;

async function uploadImage(file: File, folder: string, maxMb: number): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");
  if (file.size > maxMb * 1024 * 1024) throw new Error(`Ukuran gambar maksimal ${maxMb}MB.`);

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const { data, error: signErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
  if (signErr || !data?.signedUrl) throw new Error(signErr?.message ?? "Gagal membuat URL gambar.");
  return data.signedUrl;
}

/** Upload gambar menu ke storage dan kembalikan URL siap pakai. */
export function uploadMenuImage(file: File): Promise<string> {
  return uploadImage(file, "menu", MAX_IMAGE_MB);
}

export const MAX_FLYER_MB = 8;

/** Upload flyer/banner promo (mendukung flyer portrait resolusi tinggi). */
export function uploadPromoImage(file: File): Promise<string> {
  return uploadImage(file, "promo", MAX_FLYER_MB);
}


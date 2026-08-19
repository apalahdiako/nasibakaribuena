import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const schema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().trim().min(1).max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(20)
    .default([]),
});

const FALLBACK =
  'Maaf, asisten sedang tidak bisa menjawab. Silakan tekan tombol "Bicara dengan Admin" untuk dibantu langsung lewat WhatsApp.';

function publicClient() {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    const db = publicClient();

    let system = 'Kamu adalah "Mbak Ena", asisten customer service Nasi Bakar Ibu Ena. Jawab ramah dalam Bahasa Indonesia, singkat (maks 4 kalimat).';

    if (db) {
      try {
        const [{ data: settings }, { data: menu }, { data: outlets }] = await Promise.all([
          db.from("site_settings").select("*").eq("id", 1).maybeSingle(),
          db.from("menu_items").select("name, price, category, description, status").eq("is_deleted", false),
          db.from("outlets").select("name, address, open_hours, is_open"),
        ]);

        const menuText = (menu ?? [])
          .map((m) => `- ${m.name} (${m.category}) Rp${m.price} — ${m.description} [${m.status}]`)
          .join("\n");
        const outletText = (outlets ?? [])
          .map((o) => `- ${o.name}: ${o.address}. Jam: ${o.open_hours}. ${o.is_open ? "Buka" : "Tutup"}`)
          .join("\n");

        system = `Kamu adalah "Mbak Ena", asisten customer service Nasi Bakar Ibu Ena.
Jawab SELALU dalam Bahasa Indonesia yang ramah, singkat (maks 4 kalimat), dan membantu.
Gunakan HANYA informasi di bawah. Jika tidak tahu atau pertanyaannya kompleks/komplain/pesanan khusus,
minta maaf singkat lalu sarankan menekan tombol "Bicara dengan Admin".

INFORMASI TOKO:
${settings?.ai_knowledge ?? ""}
Jam operasional: ${settings?.open_hours ?? "-"}
Area delivery: ${settings?.delivery_area ?? "-"}
WhatsApp CS: ${settings?.wa_number ?? "-"}

DAFTAR MENU TERKINI:
${menuText}

OUTLET:
${outletText}`;
      } catch (err) {
        console.error("chat context load failed", err);
      }
    }

    let reply = FALLBACK;

    if (!apiKey) {
      console.error("LOVABLE_API_KEY tidak tersedia di environment server");
    } else {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: system },
              ...data.history,
              { role: "user", content: data.message },
            ],
          }),
        });
        if (res.ok) {
          const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
          reply = json.choices?.[0]?.message?.content?.trim() || FALLBACK;
        } else if (res.status === 429) {
          reply = 'Maaf, chat sedang ramai sekali. Coba lagi sebentar lagi ya, atau tekan "Bicara dengan Admin".';
        } else {
          console.error("AI gateway error", res.status, await res.text());
        }
      } catch (err) {
        console.error("AI gateway request failed", err);
      }
    }

    if (db) {
      try {
        await db.from("chat_messages").insert({ session_id: data.sessionId, role: "assistant", content: reply });
        await db.from("chat_sessions").update({ last_message_at: new Date().toISOString() }).eq("id", data.sessionId);
      } catch (err) {
        console.error("chat persist failed", err);
      }
    }

    return { reply };
  });

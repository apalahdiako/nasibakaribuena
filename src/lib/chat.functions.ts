import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().trim().min(1).max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(20)
    .default([]),
});

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: settings }, { data: menu }, { data: outlets }] = await Promise.all([
      supabaseAdmin.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      supabaseAdmin.from("menu_items").select("name, price, category, description, status").eq("is_deleted", false),
      supabaseAdmin.from("outlets").select("name, address, open_hours, is_open"),
    ]);

    const menuText = (menu ?? [])
      .map((m) => `- ${m.name} (${m.category}) Rp${m.price} — ${m.description} [${m.status}]`)
      .join("\n");
    const outletText = (outlets ?? [])
      .map((o) => `- ${o.name}: ${o.address}. Jam: ${o.open_hours}. ${o.is_open ? "Buka" : "Tutup"}`)
      .join("\n");

    const system = `Kamu adalah "Mbak Ena", asisten customer service Nasi Bakar Ibu Ena.
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

    let reply =
      "Maaf, asisten sedang sibuk. Silakan tekan tombol \"Bicara dengan Admin\" untuk dibantu langsung lewat WhatsApp.";

    if (apiKey) {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.5-flash",
            messages: [
              { role: "system", content: system },
              ...data.history,
              { role: "user", content: data.message },
            ],
          }),
        });
        if (res.ok) {
          const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
          reply = json.choices?.[0]?.message?.content?.trim() || reply;
        } else if (res.status === 429) {
          reply = "Maaf, chat sedang ramai sekali. Coba lagi sebentar lagi ya, atau tekan \"Bicara dengan Admin\".";
        } else {
          console.error("AI gateway error", res.status, await res.text());
        }
      } catch (err) {
        console.error("AI gateway request failed", err);
      }
    }

    await supabaseAdmin.from("chat_messages").insert({
      session_id: data.sessionId,
      role: "assistant",
      content: reply,
    });
    await supabaseAdmin
      .from("chat_sessions")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", data.sessionId);

    return { reply };
  });

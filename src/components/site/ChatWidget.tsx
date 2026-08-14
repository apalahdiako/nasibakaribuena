import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, X, Send, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { askAssistant } from "@/lib/chat.functions";
import { settingsQuery } from "@/lib/queries";
import { waLink } from "@/lib/format";

type Msg = { id: string; role: string; content: string };

const QUICK = ["Lihat menu & harga", "Jam buka & lokasi", "Cara pesan & ongkir"];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    { id: "welcome", role: "assistant", content: "Halo! Saya Mbak Ena 👋 Ada yang bisa dibantu soal menu, harga, atau pengantaran?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: settings } = useQuery(settingsQuery);
  const ask = useServerFn(askAssistant);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Terima balasan admin secara realtime
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as { id: string; role: string; content: string };
          if (row.role !== "admin") return;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  async function ensureSession(): Promise<string | null> {
    if (sessionId) return sessionId;
    const { data, error } = await supabase.from("chat_sessions").insert({ status: "ai" }).select("id").single();
    if (error || !data) {
      console.error(error);
      return null;
    }
    setSessionId(data.id);
    return data.id;
  }

  async function send(text: string) {
    const clean = text.trim().slice(0, 1000);
    if (!clean || busy) return;
    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: "user", content: clean }]);
    const sid = await ensureSession();
    if (!sid) {
      setBusy(false);
      return;
    }
    await supabase.from("chat_messages").insert({ session_id: sid, role: "user", content: clean });
    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-8)
      .map((m) => ({ role: m.role === "user" ? ("user" as const) : ("assistant" as const), content: m.content }));
    try {
      const res = await ask({ data: { sessionId: sid, message: clean, history } });
      setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: "assistant", content: res.reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", content: "Maaf, ada gangguan. Silakan tekan \"Bicara dengan Admin\"." },
      ]);
    }
    setBusy(false);
  }

  async function escalate() {
    const sid = await ensureSession();
    if (sid) {
      await supabase.from("chat_sessions").update({ status: "perlu_admin" }).eq("id", sid);
      await supabase
        .from("chat_messages")
        .insert({ session_id: sid, role: "system", content: "Pelanggan meminta bicara dengan admin." });
    }
    const url = waLink(
      settings?.wa_number ?? "6283160599421",
      "Halo Admin Nasi Bakar Ibu Ena, saya ingin bertanya langsung dengan admin.",
    );
    window.open(url, "_blank", "noopener");
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Buka live chat"
          className="fixed right-4 bottom-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed inset-x-3 bottom-3 z-50 flex max-h-[78vh] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lift sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <p className="font-display text-sm font-bold">Live Chat Ibu Ena</p>
              <p className="text-xs text-primary-foreground/70">Dibalas otomatis oleh asisten AI</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Tutup chat">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-muted/40 px-4 py-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed " +
                  (m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : m.role === "admin"
                      ? "bg-gold/25 text-foreground"
                      : m.role === "system"
                        ? "mx-auto bg-transparent text-center text-xs text-muted-foreground"
                        : "bg-card text-foreground shadow-soft")
              }
              >
                {m.role === "admin" && <span className="mb-0.5 block text-[0.65rem] font-bold text-primary">Admin CS</span>}
                {m.content}
              </div>
            ))}
            {busy && <p className="text-xs text-muted-foreground">Mbak Ena sedang mengetik…</p>}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border bg-background px-3 py-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
                >
                  {q}
                </button>
              ))}
              <button
                onClick={escalate}
                className="flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-gold-foreground"
              >
                <Headset className="h-3 w-3" /> Bicara dengan Admin
              </button>
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <Input
                value={input}
                maxLength={1000}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tulis pesan…"
                className="h-10 rounded-full"
              />
              <Button type="submit" size="icon" disabled={busy} aria-label="Kirim">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

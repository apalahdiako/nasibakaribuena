import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, Bot, User, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { chatSessionsQuery, type ChatMessage, type ChatSession } from "@/lib/queries";
import { useRealtime, useNotificationSound } from "@/hooks/useRealtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { waktu, tanggal } from "@/lib/format";

export const Route = createFileRoute("/admin/inbox")({ component: Inbox });

const STATUS: Record<string, { label: string; cls: string }> = {
  ai: { label: "Ditangani AI", cls: "bg-sky-500/15 text-sky-600" },
  perlu_admin: { label: "Menunggu Admin", cls: "bg-amber-500/20 text-amber-700" },
  admin: { label: "Ditangani Admin", cls: "bg-violet-500/15 text-violet-600" },
  selesai: { label: "Selesai", cls: "bg-emerald-500/15 text-emerald-600" },
};

const QUICK = [
  "Halo, dengan admin Nasi Bakar Ibu Ena. Ada yang bisa kami bantu?",
  "Pesanan bisa langsung lewat WhatsApp 0831-6059-9421 ya kak 🙏",
  "Kami buka setiap hari pukul 09.00 - 20.00 WIB.",
  "Terima kasih sudah menghubungi kami, selamat menikmati!",
];

function Inbox() {
  const qc = useQueryClient();
  const ping = useNotificationSound();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<"semua" | "perlu_admin">("semua");
  const bottom = useRef<HTMLDivElement>(null);

  const { data: sessions = [] } = useQuery(chatSessionsQuery);
  const { data: messages = [] } = useQuery({
    queryKey: ["chat_messages", activeId],
    enabled: !!activeId,
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", activeId!)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  useRealtime({
    channelName: "inbox",
    tables: { chat_sessions: ["chat_sessions"], chat_messages: ["chat_messages"] },
    onEvent: (table, payload) => {
      if (table === "chat_messages" && payload.eventType === "INSERT") {
        const row = payload.new as ChatMessage;
        qc.invalidateQueries({ queryKey: ["chat_messages", row.session_id] });
        if (row.role === "user" && row.session_id !== activeId) {
          ping();
          toast.info("Pesan baru dari pengunjung", { description: row.content.slice(0, 60) });
        }
      }
      if (table === "chat_sessions" && payload.eventType === "UPDATE") {
        const row = payload.new as ChatSession;
        if (row.status === "perlu_admin") {
          ping();
          toast.warning("Ada pengunjung minta bicara dengan admin");
        }
      }
    },
  });

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const list = filter === "semua" ? sessions : sessions.filter((s) => s.status === "perlu_admin");
  const active = sessions.find((s) => s.id === activeId) ?? null;
  const waiting = sessions.filter((s) => s.status === "perlu_admin").length;

  async function send(content: string) {
    const clean = content.trim();
    if (!clean || !activeId) return;
    setText("");
    const { error } = await supabase.from("chat_messages").insert({ session_id: activeId, role: "admin", content: clean });
    if (error) {
      toast.error("Gagal mengirim");
      return;
    }
    await supabase
      .from("chat_sessions")
      .update({ status: "admin", admin_typing: false, last_message_at: new Date().toISOString() })
      .eq("id", activeId);
    qc.invalidateQueries({ queryKey: ["chat_messages", activeId] });
  }

  async function setStatus(status: string) {
    if (!activeId) return;
    await supabase.from("chat_sessions").update({ status }).eq("id", activeId);
    qc.invalidateQueries({ queryKey: ["chat_sessions"] });
  }

  async function setTyping(on: boolean) {
    if (!activeId) return;
    await supabase.from("chat_sessions").update({ admin_typing: on }).eq("id", activeId);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Inbox Live Chat</h1>
          <p className="text-sm text-muted-foreground">Percakapan dari widget website, termasuk yang sudah dijawab AI.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "semua" ? "default" : "outline"} size="sm" onClick={() => setFilter("semua")}>
            Semua ({sessions.length})
          </Button>
          <Button variant={filter === "perlu_admin" ? "default" : "outline"} size="sm" onClick={() => setFilter("perlu_admin")}>
            Menunggu admin ({waiting})
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <aside className="max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card">
          {list.length === 0 && <p className="p-5 text-sm text-muted-foreground">Belum ada percakapan.</p>}
          {list.map((s) => {
            const st = STATUS[s.status] ?? STATUS["ai"]!;
            return (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={
                  "flex w-full flex-col items-start gap-1 border-b border-border p-4 text-left transition-colors " +
                  (s.id === activeId ? "bg-accent" : "hover:bg-accent/60")
                }
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{s.visitor_name || `Pengunjung ${s.id.slice(0, 6)}`}</span>
                  <span className="text-[0.65rem] text-muted-foreground">{waktu(s.last_message_at)}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${st.cls}`}>{st.label}</span>
              </button>
            );
          })}
        </aside>

        <section className="flex max-h-[70vh] min-h-[24rem] flex-col overflow-hidden rounded-2xl border border-border bg-card">
          {!active ? (
            <div className="grid flex-1 place-items-center p-8 text-sm text-muted-foreground">Pilih percakapan di kiri.</div>
          ) : (
            <>
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div>
                  <p className="text-sm font-bold">{active.visitor_name || `Pengunjung ${active.id.slice(0, 6)}`}</p>
                  <p className="text-xs text-muted-foreground">Dibuat {tanggal(active.created_at)}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setStatus("admin")}>
                    Ambil alih
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setStatus("selesai")}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                  </Button>
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm " +
                      (m.role === "user"
                        ? "bg-card shadow-soft"
                        : m.role === "admin"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : m.role === "system"
                            ? "mx-auto bg-transparent text-center text-xs text-muted-foreground"
                            : "ml-auto bg-accent")
                    }
                  >
                    {m.role !== "system" && (
                      <span className="mb-0.5 flex items-center gap-1 text-[0.65rem] opacity-70">
                        {m.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                        {m.role === "user" ? "Pengunjung" : m.role === "admin" ? "Admin" : "Mbak Ena (AI)"} · {waktu(m.created_at)}
                      </span>
                    )}
                    {m.content}
                  </div>
                ))}
                <div ref={bottom} />
              </div>

              <div className="border-t border-border p-3">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="rounded-full border border-border px-2.5 py-1 text-[0.7rem] text-muted-foreground hover:bg-accent"
                    >
                      {q.slice(0, 32)}…
                    </button>
                  ))}
                </div>
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(text);
                  }}
                >
                  <Input
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      void setTyping(e.target.value.length > 0);
                    }}
                    onBlur={() => void setTyping(false)}
                    placeholder="Balas sebagai admin…"
                    className="h-10 rounded-full"
                  />
                  <Button type="submit" size="icon" aria-label="Kirim">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

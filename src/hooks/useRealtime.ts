import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TableName = "orders_log" | "chat_messages" | "chat_sessions" | "menu_items" | "promos" | "outlets" | "site_settings";

type Options = {
  /** Tabel yang di-subscribe -> queryKey yang di-invalidate */
  tables: Partial<Record<TableName, string[]>>;
  /** Dipanggil untuk tiap event realtime */
  onEvent?: (table: TableName, payload: { eventType: string; new: unknown; old: unknown }) => void;
  channelName?: string;
};

/** Subscribe realtime Supabase + auto-invalidate cache React Query. */
export function useRealtime({ tables, onEvent, channelName = "admin" }: Options) {
  const qc = useQueryClient();
  const [live, setLive] = useState(false);
  const cb = useRef(onEvent);
  cb.current = onEvent;
  const sig = Object.keys(tables).sort().join(",");

  useEffect(() => {
    const entries = Object.entries(tables) as [TableName, string[]][];
    const channel = supabase.channel(`${channelName}-${sig}`);
    for (const [table, key] of entries) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
        qc.invalidateQueries({ queryKey: key });
        cb.current?.(table, payload as never);
      });
    }
    channel.subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(channel);
      setLive(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, channelName, qc]);

  return { live };
}

/** Bunyi notifikasi sederhana tanpa file audio (WebAudio). */
export function useNotificationSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  return () => {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = (ctxRef.current ??= new Ctx());
      if (ctx.state === "suspended") void ctx.resume();
      const play = (freq: number, at: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + at);
        osc.stop(ctx.currentTime + at + 0.32);
      };
      play(880, 0);
      play(1320, 0.16);
    } catch {
      /* abaikan */
    }
  };
}

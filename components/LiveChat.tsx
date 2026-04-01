"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient, User } from "@supabase/supabase-js";

type LiveChatProps = {
  matchId: string;
};

type ChatRow = {
  id: string;
  match_id: string;
  user_id: string | null;
  username: string | null;
  avatar_url: string | null;
  content: string | null;
  created_at: string;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LiveChat({ matchId }: LiveChatProps) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) {
      throw new Error("Missing Supabase public environment variables");
    }

    return createClient(url, anon);
  }, []);

  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!active) return;
      if (error) {
        console.error("Auth getUser error:", error);
        return;
      }

      setUser(user ?? null);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const { data, error } = await supabase
          .from("match_comments")
          .select("id, match_id, user_id, username, avatar_url, content, created_at")
          .eq("match_id", matchId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        if (!active) return;

        setMessages((data as ChatRow[]) ?? []);
      } catch (error) {
        console.error("Load chat messages error:", error);
        if (active) {
          setErrorMsg("تعذر تحميل المحادثة المباشرة.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    const channel = supabase
      .channel(`live-chat-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "match_comments",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatRow;

          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [matchId, supabase]);

  async function handleSend() {
    const trimmed = input.trim();

    if (!trimmed) return;

    if (!user) {
      setErrorMsg("يجب تسجيل الدخول للمشاركة في المحادثة.");
      return;
    }

    try {
      setSending(true);
      setErrorMsg(null);

      const displayName =
        user.user_metadata?.username ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "مستخدم";

      const avatarUrl =
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        null;

      const { error } = await supabase.from("match_comments").insert([
        {
          match_id: matchId,
          user_id: user.id,
          username: displayName,
          avatar_url: avatarUrl,
          content: trimmed,
        },
      ]);

      if (error) throw error;

      setInput("");
    } catch (error) {
      console.error("Send chat message error:", error);
      setErrorMsg("تعذر إرسال الرسالة.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#0b0f2a] text-white">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-extrabold">الدردشة المباشرة</h2>
        <p className="mt-1 text-sm text-white/60">
          {user
            ? `مرحبًا ${user.user_metadata?.username || user.email || "بك"}`
            : "سجّل الدخول للمشاركة في المحادثة"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="text-center text-sm text-white/60">
            جاري تحميل الرسائل...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-white/50">
            لا توجد رسائل بعد. ابدأ أول رسالة 🔥
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {message.avatar_url ? (
                      <img
                        src={message.avatar_url}
                        alt={message.username || "user"}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                        {(message.username || "؟").slice(0, 1)}
                      </div>
                    )}

                    <span className="text-sm font-bold text-[#29FF64]">
                      {message.username || "مستخدم"}
                    </span>
                  </div>

                  <span className="text-xs text-white/45">
                    {formatTime(message.created_at)}
                  </span>
                </div>

                <p className="text-sm leading-6 text-white/90">
                  {message.content || ""}
                </p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-4">
        {errorMsg && (
          <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSend}
            disabled={!user || sending}
            className="rounded-xl bg-[#29FF64] px-4 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "جارٍ الإرسال..." : "إرسال"}
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            disabled={!user || sending}
            placeholder={
              user ? "اكتب رسالتك..." : "سجّل الدخول أولًا للمشاركة..."
            }
            className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-right text-sm text-white outline-none placeholder:text-white/40 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}

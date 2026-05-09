"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
function playSound(src: string, volume = 0.35) {

  if (typeof window === "undefined") return;

  const audio = new Audio(src);

  audio.volume = volume;

  audio.currentTime = 0;

  audio.play().catch(() => {});

}
type ChatUser = {
  id: string;
  username: string;
  avatar_url?: string | null;
};

type ChatMessage = {
  id: string;
  match_id: string;
  user_id: string;
  username: string;
  avatar_url?: string | null;
  content: string;
  created_at: string;
};

type LiveChatProps = {
  matchId: string;
  isLive: boolean;
};

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Riyadh",
  });
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function sanitizeDisplayName(value?: string | null) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "مستخدم";
  return trimmed;
}

function getInitial(name?: string | null) {
  const safe = sanitizeDisplayName(name);
  return safe.slice(0, 1).toUpperCase() || "U";
}

function buildAvatarUrl(_name?: string | null, avatarUrl?: string | null) {
  if (avatarUrl && avatarUrl.trim() !== "") {
    return avatarUrl;
  }

  return "/images/avatars/avatar1.png";
}

export default function LiveChat({ matchId, isLive }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const lastSendRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          setCurrentUser(null);
          setAuthLoading(false);
          return;
        }

        let platformUsername = "";
        let avatar_url: string | null = null;

        const { data: memberData } = await supabase
          .from("Member")
          .select("userName")
          .eq("email", user.email)
          .maybeSingle();

        platformUsername =
          memberData?.userName ||
          (user.user_metadata?.username as string) ||
          "مستخدم";

        const { data: profileData } = await supabase
          .from("Profile")
          .select("profilePic")
          .eq("pruserName", platformUsername)
          .maybeSingle();

        if (profileData?.profilePic) {
          avatar_url = profileData.profilePic;
        }

        setCurrentUser({
          id: user.id,
          username: platformUsername,
          avatar_url,
        });
      } catch (error) {
        console.error("auth chat error:", error);
        setCurrentUser(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadMessages() {
      try {
        setLoading(true);
        setErrorMsg("");

        const { data, error } = await supabase
          .from("match_comments")
          .select("id, match_id, user_id, username, avatar_url, content, created_at")
          .eq("match_id", matchId)
          .order("created_at", { ascending: true });

        if (!mounted) return;

        if (error) {
          console.error("load chat error:", error);
          setErrorMsg("تعذر تحميل المحادثة");
          return;
        }

        const cleaned = ((data || []) as ChatMessage[]).map((msg) => ({
          ...msg,
          username: sanitizeDisplayName(msg.username),
        }));

        const usernames = [
          ...new Set(cleaned.map((m) => m.username).filter(Boolean)),
        ];

        let profileMap = new Map<string, string>();

        if (usernames.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("Profile")
            .select("pruserName, profilePic")
            .in("pruserName", usernames);

          if (profilesError) {
            console.error("profiles fetch error:", profilesError);
          }

          profileMap = new Map(
            (profilesData || []).map((p) => [
              p.pruserName,
              p.profilePic,
            ])
          );
        }

        const enriched = cleaned.map((msg) => ({
          ...msg,
          avatar_url:
            profileMap.get(msg.username) || msg.avatar_url || null,
        }));

        setMessages(enriched);
      } catch (error) {
        console.error("chat unexpected error:", error);
        if (mounted) setErrorMsg("حدث خطأ أثناء تحميل المحادثة");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMessages();

    const channel = supabase
      .channel(`match-comments-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "match_comments",
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          const normalizedMessage: ChatMessage = {
            ...newMessage,
            username: sanitizeDisplayName(newMessage.username),
          };

          let profileAvatar: string | null = null;

          try {
            const { data: profileData } = await supabase
              .from("Profile")
              .select("profilePic")
              .eq("pruserName", normalizedMessage.username)
              .maybeSingle();

            if (profileData?.profilePic) {
              profileAvatar = profileData.profilePic;
            }
          } catch (error) {
            console.error("realtime profile avatar error:", error);
          }

          const messageWithAvatar: ChatMessage = {
            ...normalizedMessage,
            avatar_url:
              profileAvatar || normalizedMessage.avatar_url || null,
          };

          setMessages((prev) => {
            const withoutTemp = prev.filter(
              (m) =>
                !(
                  m.id.startsWith("temp-") &&
                  m.user_id === messageWithAvatar.user_id &&
                  m.content === messageWithAvatar.content
                )
            );

            if (withoutTemp.some((m) => m.id === messageWithAvatar.id)) {
              return withoutTemp;
            }

            return [...withoutTemp, messageWithAvatar];
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSend() {
    const value = input.trim();

    if (!value || !currentUser || !isLive || sending) return;

    const now = Date.now();
    if (now - lastSendRef.current < 2000) {
      setErrorMsg("انتظر قليلاً قبل إرسال رسالة أخرى");
      return;
    }

    if (value.length > 300) {
      setErrorMsg("الرسالة طويلة جدًا");
      return;
    }

    if (!currentUser.username || currentUser.username === "مستخدم") {
      setErrorMsg("اسم المستخدم غير متوفر، أكمل بيانات الحساب أولاً");
      return;
    }

    lastSendRef.current = now;
    setSending(true);
    setErrorMsg("");

    const tempMessage: ChatMessage = {
      id: `temp-${now}`,
      match_id: matchId,
      user_id: currentUser.id,
      username: currentUser.username,
      avatar_url: currentUser.avatar_url || null,
      content: value,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);

playSound("/sounds/send.mp3", 0.35);

setInput("");
    const { error } = await supabase.from("match_comments").insert({
      match_id: matchId,
      user_id: currentUser.id,
      username: currentUser.username,
      avatar_url: currentUser.avatar_url || null,
      content: value,
    });

    if (error) {
      console.error("send chat error:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setErrorMsg("تعذر إرسال الرسالة");
    }

    setSending(false);
  }

  const emptyText = useMemo(() => {
    if (loading) return "جاري تحميل المحادثة...";
    if (!messages.length) return "لا توجد تعليقات بعد. كن أول من يتفاعل.";
    return "";
  }, [loading, messages.length]);

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          {messages.length} تعليق
        </h2>

        {!isLive && (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/60">
            المحادثة متوقفة لانتهاء البث
          </span>
        )}
      </div>

      <div
        ref={listRef}
        className="max-h-[520px] space-y-4 overflow-y-auto pr-1"
      >
        {emptyText ? (
          <div className="rounded-[28px] border border-[#B37FEB]/35 bg-[rgba(5,11,28,0.38)] px-6 py-8 text-center text-white/55">
            {emptyText}
          </div>
        ) : (
          messages.map((msg) => {
            const mine = currentUser?.id === msg.user_id;

            const displayName = mine
              ? currentUser?.username || sanitizeDisplayName(msg.username)
              : sanitizeDisplayName(msg.username);

            const avatar = buildAvatarUrl(
              displayName,
              mine ? currentUser?.avatar_url || msg.avatar_url : msg.avatar_url
            );

            return (
              <div
                key={msg.id}
                className={cn(
                  "rounded-[26px] border border-[#B37FEB]/35 bg-[rgba(5,11,28,0.38)] px-5 py-4",
                  mine && "border-[#29FF64]/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                    <Image
                      src={avatar}
                      alt={displayName}
                      width={44}
                      height={44}
                      className="h-11 w-11 object-cover"
                      unoptimized
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = "/images/avatars/avatar1.png";
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {displayName}
                      </span>
                      <span className="text-xs text-white/40">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap break-words text-sm leading-7 text-white/85">
                      {msg.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-5 rounded-[28px] border border-[#B37FEB]/45 bg-[rgba(18,8,42,0.82)] p-3">
        {authLoading ? (
          <div className="px-4 py-4 text-center text-sm text-white/65">
            جاري التحقق من تسجيل الدخول...
          </div>
        ) : !currentUser ? (
          <div className="px-4 py-4 text-center text-sm text-white/65">
            سجّل دخولك للمشاركة في المحادثة المباشرة
          </div>
        ) : !isLive ? (
          <div className="px-4 py-4 text-center text-sm text-white/65">
            انتهى البث، تم إيقاف استقبال الرسائل
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="rounded-full border border-[#cb90ff]/60 bg-[linear-gradient(180deg,rgba(117,45,210,0.45),rgba(51,17,103,0.92))] px-6 py-3 font-semibold text-white transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "جارٍ الإرسال..." : "إرسال"}
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              maxLength={300}
              placeholder="شاركنا تعليقك......"
              className="h-14 flex-1 rounded-full border border-white/10 bg-white/5 px-5 text-right text-white outline-none placeholder:text-white/35"
            />
          </div>
        )}

        {!!errorMsg && (
          <p className="mt-3 text-center text-sm text-red-300">{errorMsg}</p>
        )}
      </div>
    </section>
  );
}
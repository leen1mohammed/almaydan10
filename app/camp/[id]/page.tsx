"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

const db: any = supabase;

type CampRow = {
  id: number;
  name: string;
  description: string;
  pic?: string | null;
  creatorUser: string;
};

type CampParticipantRow = {
  campId: number;
  pUserName: string;
  profilePic?: string | null;
};

type MessageRow = {
  id: number;
  campId: number;
  senderUser: string;
  body: string;
  createdAt: string;
  replyToMessageId?: number | null;
  senderProfilePic?: string | null;
};

type DialogVariant = "info" | "success" | "error" | "confirm";

type SystemDialogState = {
  isOpen: boolean;
  title: string;
  message: string;
  variant: DialogVariant;
  confirmText?: string;
  cancelText?: string;
};

const MAX_MESSAGES = 100;

const DialogStyles = {
  success: {
    badge: "bg-green-500/15 text-green-200 border-green-400/30",
    button: "bg-green-600 hover:bg-green-500",
  },
  error: {
    badge: "bg-red-500/15 text-red-200 border-red-400/30",
    button: "bg-red-600 hover:bg-red-500",
  },
  confirm: {
    badge: "bg-amber-500/15 text-amber-200 border-amber-400/30",
    button: "bg-purple-600 hover:bg-purple-500",
  },
  info: {
    badge: "bg-purple-500/15 text-purple-200 border-purple-400/30",
    button: "bg-purple-600 hover:bg-purple-500",
  },
};

const MessageBubble = memo(function MessageBubble({
  msg,
  replied,
  isMine,
  isSameSenderAsPrev,
  isSameSenderAsNext,
  onReply,
}: {
  msg: MessageRow;
  replied?: MessageRow | null;
  isMine: boolean;
  isSameSenderAsPrev: boolean;
  isSameSenderAsNext: boolean;
  onReply: (msg: MessageRow) => void;
}) {
  const showAvatar = !isSameSenderAsNext;

  return (
    <div
      className={`flex w-full ${isMine ? "justify-start" : "justify-end"} ${
        isSameSenderAsPrev ? "mt-1" : "mt-3"
      }`}
    >
      <div
        className={`flex max-w-[94%] items-end gap-2 sm:max-w-[80%] lg:max-w-[66%] ${
          isMine ? "flex-row" : "flex-row-reverse"
        }`}
      >
        <div className="w-9 shrink-0 sm:w-10">
          {showAvatar &&
            (msg.senderProfilePic ? (
              <img
                loading="lazy"
                decoding="async"
                src={msg.senderProfilePic}
                alt={msg.senderUser}
                className="h-9 w-9 rounded-full border border-purple-400/40 object-cover sm:h-10 sm:w-10"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-purple-400/40 bg-[#1a1230] text-xs font-bold text-purple-200 sm:h-10 sm:w-10">
                {msg.senderUser?.charAt(0)?.toUpperCase() || "م"}
              </div>
            ))}
        </div>

        <div
          className={`w-fit min-w-[110px] rounded-2xl px-3 py-3 shadow-[0_8px_25px_rgba(0,0,0,0.22)] sm:min-w-[120px] sm:px-4 ${
            isMine
              ? "rounded-bl-md bg-[#B794F6] text-white"
              : "rounded-br-md border border-white/10 bg-[#1b1330]/95 text-white"
          }`}
        >
          {!isSameSenderAsPrev && (
            <div
              className={`mb-2 text-[10px] sm:text-[11px] ${
                isMine ? "text-white/85" : "text-gray-300"
              }`}
            >
              {new Date(msg.createdAt).toLocaleString("ar-SA")} •{" "}
              {msg.senderUser}
            </div>
          )}

          {replied && (
            <div
              className={`mb-2 rounded-xl border px-3 py-2 text-right text-[11px] sm:text-xs ${
                isMine
                  ? "border-white/20 bg-white/10 text-white/90"
                  : "border-white/10 bg-black/20 text-gray-200"
              }`}
            >
              <div className="mb-1 opacity-80">
                ردًا على: {replied.senderUser}
              </div>

              <div className="line-clamp-3 whitespace-pre-wrap break-words">
                {replied.body}
              </div>
            </div>
          )}

          <div className="whitespace-pre-wrap break-words text-right text-sm leading-7">
            {msg.body}
          </div>

          <div className="mt-3 flex justify-start">
            <button
              type="button"
              onClick={() => onReply(msg)}
              className={`text-[11px] transition ${
                isMine
                  ? "text-white/90 hover:text-white"
                  : "text-purple-200 hover:text-purple-100"
              }`}
            >
              رد (اقتباس)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function CampPage() {
  const params = useParams();
  const router = useRouter();

  const campId = Number((params as any)?.id);

  const [camp, setCamp] = useState<CampRow | null>(null);
  const [members, setMembers] = useState<CampParticipantRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  const [systemDialog, setSystemDialog] = useState<SystemDialogState>({
    isOpen: false,
    title: "",
    message: "",
    variant: "info",
  });

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  const messagesById = useMemo(() => {
    const map = new Map<number, MessageRow>();

    for (const msg of messages) {
      map.set(msg.id, msg);
    }

    return map;
  }, [messages]);

  const isOwner =
    camp?.creatorUser &&
    currentUserName &&
    camp.creatorUser === currentUserName;

  const openDialog = useCallback(
    (
      title: string,
      message: string,
      variant: DialogVariant = "info"
    ) => {
      setSystemDialog({
        isOpen: true,
        title,
        message,
        variant,
      });
    },
    []
  );

  const closeDialog = useCallback(() => {
    setSystemDialog((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const getUserNameOrRedirect = useCallback(async () => {
    const currentUser = await authService.getCurrentUser();

    if (!currentUser?.email) {
      router.push("/login");
      return null;
    }

    let userName = (currentUser as any)?.userName;

    if (!userName) {
      const { data } = await db
        .from("Member")
        .select("userName")
        .eq("email", currentUser.email)
        .single();

      userName = data?.userName;
    }

    if (!userName) {
      router.push("/login");
      return null;
    }

    return userName;
  }, [router]);

  useEffect(() => {
    if (!campId) return;

    let mounted = true;

    const fetchData = async () => {
      const userName = await getUserNameOrRedirect();

      if (!userName || !mounted) return;

      setCurrentUserName(userName);

      const { data: membership } = await db
        .from("CampParticipants")
        .select("campId")
        .eq("campId", campId)
        .eq("pUserName", userName)
        .maybeSingle();

      if (!membership) {
        router.push("/camp");
        return;
      }

      const [{ data: campData }, { data: membersData }, { data: messagesData }] =
        await Promise.all([
          db
            .from("Camp")
            .select("id,name,description,pic,creatorUser")
            .eq("id", campId)
            .single(),

          db
            .from("CampParticipants")
            .select("campId,pUserName,Profile(profilePic)")
            .eq("campId", campId),

          db
            .from("Messages")
            .select("*")
            .eq("campId", campId)
            .order("createdAt", { ascending: true }),
        ]);

      if (!mounted) return;

      setCamp(campData);

      setMembers(
        (membersData || []).map((m: any) => ({
          campId: m.campId,
          pUserName: m.pUserName,
          profilePic: m.Profile?.profilePic || null,
        }))
      );

      setMessages((messagesData || []).slice(-MAX_MESSAGES));
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [campId, getUserNameOrRedirect, router]);

  useEffect(() => {
    if (!campId) return;

    let mounted = true;

    const channel = supabase
      .channel(`camp-${campId}-messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Messages",
          filter: `campId=eq.${campId}`,
        },
        async (payload) => {
          if (!mounted) return;

          const row = payload.new as MessageRow;

          const { data } = await db
            .from("Profile")
            .select("profilePic")
            .eq("pruserName", row.senderUser)
            .maybeSingle();

          if (!mounted) return;

          const enriched: MessageRow = {
            ...row,
            senderProfilePic: data?.profilePic || null,
          };

          setMessages((prev) => {
            if (prev.some((x) => x.id === enriched.id)) {
              return prev;
            }

            return [...prev, enriched].slice(-MAX_MESSAGES);
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [campId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView();
  }, [messages.length]);

  useEffect(() => {
    const el = messageInputRef.current;

    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [newMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!campId) return;

    const body = newMessage.trim();

    if (!body) return;

    const senderUser = await getUserNameOrRedirect();

    if (!senderUser) return;

    const payload = {
      body,
      senderUser,
      campId,
      createdAt: new Date().toISOString(),
      replyToMessageId: replyTo?.id ?? null,
    };

    const { error } = await db.from("Messages").insert([payload]);

    if (error) {
      openDialog("خطأ", "تعذر إرسال الرسالة.", "error");
      return;
    }

    setNewMessage("");
    setReplyTo(null);

    if (messageInputRef.current) {
      messageInputRef.current.style.height = "auto";
    }
  }, [
    campId,
    newMessage,
    replyTo,
    getUserNameOrRedirect,
    openDialog,
  ]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#101726] text-white">
      <div className="px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 sm:gap-5">
          {/* Header */}
          <div className="overflow-hidden rounded-[24px] border border-purple-500/30 bg-[#081126] px-4 py-5">
            <div className="relative z-10 flex flex-col items-center text-center">
              {camp?.pic ? (
                <img
                  loading="lazy"
                  decoding="async"
                  src={camp.pic}
                  alt={camp.name}
                  className="h-24 w-24 rounded-full border border-purple-400/50 object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-purple-400/40 bg-[#140d25] text-2xl font-bold text-purple-200">
                  {camp?.name?.charAt(0) || "م"}
                </div>
              )}

              <h1 className="mt-4 text-2xl font-bold">
                {camp?.name}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-300">
                {camp?.description || "لا يوجد وصف"}
              </p>
            </div>
          </div>

          {/* Members */}
          <div className="overflow-hidden rounded-[22px] border border-purple-500/40 bg-white/5">
            <button
              type="button"
              onClick={() => setIsMembersOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-4 py-4"
            >
              <div className="text-right">
                <div className="font-semibold">أعضاء المعسكر</div>
                <div className="text-sm text-gray-400">
                  {members.length} عضو
                </div>
              </div>

              <span className="text-sm text-purple-200">
                {isMembersOpen ? "إخفاء" : "إظهار"}
              </span>
            </button>

            {isMembersOpen && (
              <div className="border-t border-white/10 px-4 py-3">
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {members.map((m) => (
                    <li
                      key={m.pUserName}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3"
                    >
                      {m.profilePic ? (
                        <img
                          loading="lazy"
                          decoding="async"
                          src={m.profilePic}
                          alt={m.pUserName}
                          className="h-11 w-11 rounded-full border border-purple-400/40 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-purple-400/40 bg-[#1a1230] text-sm font-bold text-purple-200">
                          {m.pUserName?.charAt(0)?.toUpperCase()}
                        </div>
                      )}

                      <div className="text-right">
                        <div className="text-sm text-purple-100">
                          {m.pUserName}
                        </div>

                        {camp?.creatorUser === m.pUserName && (
                          <div className="text-xs text-pink-200">
                            قائد المعسكر
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="relative pb-[180px]">
            {messages.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center text-sm text-gray-400">
                لا توجد رسائل بعد.
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg, index) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    replied={
                      msg.replyToMessageId
                        ? messagesById.get(msg.replyToMessageId)
                        : null
                    }
                    isMine={currentUserName === msg.senderUser}
                    isSameSenderAsPrev={
                      messages[index - 1]?.senderUser === msg.senderUser
                    }
                    isSameSenderAsNext={
                      messages[index + 1]?.senderUser === msg.senderUser
                    }
                    onReply={setReplyTo}
                  />
                ))}

                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3">
        <div className="mx-auto w-full max-w-[980px]">
          {replyTo && (
            <div className="mb-3 rounded-2xl border border-purple-500/40 bg-purple-950/70 px-4 py-3">
              <div className="text-xs text-gray-200">
                أنت ترد على: {replyTo.senderUser}
              </div>

              <div className="line-clamp-2 text-sm text-gray-100">
                {replyTo.body}
              </div>

              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="mt-2 text-xs text-red-200"
              >
                إلغاء الرد
              </button>
            </div>
          )}

          <div className="rounded-[24px] border border-purple-500/40 bg-[#110a20]/88 p-3 backdrop-blur-xl">
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleSendMessage}
                className="h-[50px] rounded-2xl bg-purple-600 px-5 text-sm"
              >
                إرسال
              </button>

              <textarea
                ref={messageInputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={1}
                placeholder="اكتب رسالتك..."
                className="max-h-40 min-h-[50px] flex-1 resize-none overflow-y-auto rounded-2xl border border-purple-500/50 bg-[#120b22] px-4 py-3 text-right text-sm text-white outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dialog */}
      {systemDialog.isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#0f0a1d] p-5">
            <div className="mb-3 flex items-center justify-between">
              <span
                className={`rounded-full border px-3 py-1 text-xs ${
                  DialogStyles[systemDialog.variant].badge
                }`}
              >
                {systemDialog.variant}
              </span>

              <button
                type="button"
                onClick={closeDialog}
                className="text-sm text-gray-400"
              >
                إغلاق
              </button>
            </div>

            <h3 className="mb-2 text-right text-lg font-semibold text-white">
              {systemDialog.title}
            </h3>

            <p className="text-right text-sm leading-7 text-gray-300">
              {systemDialog.message}
            </p>

            <div className="mt-5">
              <button
                type="button"
                onClick={closeDialog}
                className={`rounded-2xl px-4 py-2 text-sm text-white ${
                  DialogStyles[systemDialog.variant].button
                }`}
              >
                حسنًا
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
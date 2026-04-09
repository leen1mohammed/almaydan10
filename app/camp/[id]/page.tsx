"use client";

/**
 * الملف: app/camp/[id]/page.tsx
 * الدور: عرض المعسكر + الأعضاء + شات المعسكر (Realtime) + Reply (اقتباس)
 * مضاف:
 * - تحسين واجهة الرسائل
 * - قائمة أعضاء قابلة للفتح/الإغلاق
 * - المالك يقدر يضيف مشاركين بعد إنشاء المعسكر
 * - المشاركون (غير المالك) يقدرون يغادرون المعسكر
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

const db: any = supabase;

type CampRow = { id: number; name: string; description: string; pic?: string; creatorUser: string };
type CampParticipantRow = { campId: number; pUserName: string };
type MessageRow = {
  id: number;
  campId: number;
  senderUser: string;
  body: string;
  createdAt: string;
  replyToMessageId?: number | null;
};

/* ===============================
   Debug helpers (simple)
================================ */
function dbg(label: string, payload?: any) {
  console.groupCollapsed(`🧩 [CAMP] ${label}`);
  if (payload !== undefined) console.log("payload:", payload);
  console.groupEnd();
}

function dbgError(label: string, error: any, payload?: any) {
  console.groupCollapsed(`🔴 [CAMP ERROR] ${label}`);
  console.error("error:", {
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    status: error?.status,
  });
  if (payload !== undefined) console.error("payload:", payload);
  console.groupEnd();
}

async function sb<T>(label: string, query: Promise<{ data: T; error: any }>): Promise<{ data: T; error: any }> {
  dbg(`${label} (start)`);
  const res = await query;
  if (res.error) dbgError(label, res.error);
  else dbg(`${label} (ok)`, res.data);
  return res;
}

export default function CampPage() {
  const params = useParams();
  const router = useRouter();

  const campId = useMemo(() => {
    const raw = (params as any)?.id;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }, [params]);

  const [camp, setCamp] = useState<CampRow | null>(null);
  const [members, setMembers] = useState<CampParticipantRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  // إضافة مشاركين
  const [newParticipantUserName, setNewParticipantUserName] = useState("");
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);

  // مغادرة المعسكر
  const [isLeavingCamp, setIsLeavingCamp] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  const messagesById = useMemo(() => {
    const m = new Map<number, MessageRow>();
    for (const msg of messages) m.set(msg.id, msg);
    return m;
  }, [messages]);

  const isOwner = useMemo(() => {
    return Boolean(camp?.creatorUser && currentUserName && camp.creatorUser === currentUserName);
  }, [camp, currentUserName]);

  async function getUserNameOrRedirect() {
    dbg("getUserNameOrRedirect()");

    const currentUser = await authService.getCurrentUser();
    dbg("authService.getCurrentUser()", currentUser);

    if (!currentUser?.email) {
      dbg("No email -> redirect /login");
      router.push("/login");
      return null;
    }

    let userName = (currentUser as any)?.userName as string | undefined;
    dbg("Try userName from currentUser", { userName });

    if (!userName) {
      const { data: memberData, error: memberErr } = await sb(
        "Member: select userName by email",
        db.from("Member").select("userName").eq("email", currentUser.email).single()
      );

      if (memberErr) {
        router.push("/login");
        return null;
      }

      userName = (memberData as any)?.userName;
    }

    if (!userName) {
      dbg("userName missing -> redirect /login");
      router.push("/login");
      return null;
    }

    dbg("Resolved userName", { userName });
    return userName;
  }

  async function assertMembershipOrRedirect(cId: number, userName: string) {
    const { data: membership, error: membershipError } = await sb(
      "CampParticipants: membership check",
      db.from("CampParticipants").select("campId,pUserName").eq("campId", cId).eq("pUserName", userName).maybeSingle()
    );

    if (membershipError || !membership) {
      dbg("Not member -> redirect /camp", { cId, userName });
      alert("لا تملك صلاحية الوصول إلى هذا المعسكر.");
      router.push("/camp");
      return false;
    }

    dbg("Membership OK", membership);
    return true;
  }

  async function refreshMembers(targetCampId: number) {
    const { data: membersData } = await sb(
      "CampParticipants: refresh members",
      db.from("CampParticipants").select("campId,pUserName").eq("campId", targetCampId)
    );

    setMembers(((membersData as any) || []) as CampParticipantRow[]);
  }

  useEffect(() => {
    if (!campId) return;

    let alive = true;

    const fetchData = async () => {
      dbg("CampPage fetchData() start", { campId });

      try {
        const userName = await getUserNameOrRedirect();
        if (!userName) return;

        if (!alive) return;
        setCurrentUserName(userName);

        // Gate access
        const allowed = await assertMembershipOrRedirect(campId, userName);
        if (!allowed) return;

        // Camp
        const { data: campData, error: campError } = await sb(
          "Camp: fetch camp row",
          db.from("Camp").select("id,name,description,pic,creatorUser").eq("id", campId).single()
        );

        if (campError || !campData) {
          alert("تعذر تحميل بيانات المعسكر.");
          router.push("/camp");
          return;
        }

        // Members
        const { data: membersData } = await sb(
          "CampParticipants: fetch members",
          db.from("CampParticipants").select("campId,pUserName").eq("campId", campId)
        );

        // Messages
        const { data: messagesData } = await sb(
          "Messages: fetch messages",
          db
            .from("Messages")
            .select("*")
            .eq("campId", campId)
            .order("createdAt", { ascending: true })
        );

        if (!alive) return;

        setCamp(campData as CampRow);
        setMembers(((membersData as any) || []) as CampParticipantRow[]);
        setMessages(((messagesData as any) || []) as MessageRow[]);

        dbg("CampPage state updated", {
          campLoaded: Boolean(campData),
          membersCount: (membersData as any)?.length ?? 0,
          messagesCount: (messagesData as any)?.length ?? 0,
        });
      } catch (e) {
        dbgError("CampPage fetchData() unexpected error", e);
        alert("حدثت مشكلة أثناء تحميل المعسكر.");
        router.push("/camp");
      }
    };

    fetchData();

    return () => {
      alive = false;
      dbg("CampPage unmount/cleanup");
    };
  }, [campId, router]);

  useEffect(() => {
    if (!campId) return;

    dbg("Realtime subscribe start", { campId });

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
        (payload) => {
          dbg("Realtime INSERT payload", payload?.new);
          const row = payload.new as MessageRow;

          setMessages((prev) => {
            if (prev.some((x) => x.id === row.id)) {
              dbg("Realtime duplicate ignored", { id: row.id });
              return prev;
            }
            return [...prev, row];
          });
        }
      )
      .subscribe((status) => dbg("Realtime status", status));

    return () => {
      dbg("Realtime unsubscribe", { campId });
      supabase.removeChannel(channel);
    };
  }, [campId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = messageInputRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [newMessage]);

  async function handleSendMessage() {
    if (!campId) return;

    const body = newMessage.trim();
    if (!body) return;

    dbg("handleSendMessage() start", { campId, bodyLen: body.length, replyToId: replyTo?.id ?? null });

    try {
      const senderUser = await getUserNameOrRedirect();
      if (!senderUser) return;

      // Re-check membership
      const allowed = await assertMembershipOrRedirect(campId, senderUser);
      if (!allowed) return;

      const payload = {
        body,
        senderUser,
        campId,
        createdAt: new Date().toISOString(),
        replyToMessageId: replyTo?.id ?? null,
      };

      const { error } = await sb("Messages: insert message", db.from("Messages").insert([payload]));
      if (error) {
        dbgError("Messages insert FAILED", error, payload);
        alert("تعذر إرسال الرسالة. شوفي الكونسول للتفاصيل.");
        return;
      }

      dbg("Message sent OK", payload);
      setNewMessage("");
      setReplyTo(null);

      if (messageInputRef.current) {
        messageInputRef.current.style.height = "auto";
      }
    } catch (e) {
      dbgError("handleSendMessage() unexpected error", e);
      alert("تعذر إرسال الرسالة.");
    }
  }

  async function handleAddParticipant() {
    if (!campId || !camp || !currentUserName) return;

    const targetUserName = newParticipantUserName.trim();
    if (!targetUserName) {
      alert("اكتبي اسم المستخدم أولًا.");
      return;
    }

    if (!isOwner) {
      alert("فقط مالك المعسكر يمكنه إضافة المشاركين.");
      return;
    }

    setIsAddingParticipant(true);
    dbg("handleAddParticipant() start", { campId, targetUserName, currentUserName });

    try {
      // لا يضيف نفسه
      if (targetUserName.toLowerCase() === currentUserName.toLowerCase()) {
        alert("أنتِ موجودة أصلًا داخل المعسكر.");
        return;
      }

      // لازم يكون Participant
      const { data: participantRow, error: participantError } = await sb(
        "Participant: validate target user exists",
        db.from("Participant").select("PuserName").eq("PuserName", targetUserName).maybeSingle()
      );

      if (participantError) {
        alert("تعذر التحقق من المستخدم.");
        return;
      }

      if (!participantRow) {
        alert("هذا المستخدم غير موجود ضمن حسابات المشاركين.");
        return;
      }

      // هل هو داخل هذا المعسكر أصلًا؟
      const { data: existingInThisCamp, error: existingInThisCampError } = await sb(
        "CampParticipants: check target already in this camp",
        db
          .from("CampParticipants")
          .select("campId,pUserName")
          .eq("campId", campId)
          .eq("pUserName", targetUserName)
          .maybeSingle()
      );

      if (existingInThisCampError) {
        alert("تعذر التحقق من عضوية المستخدم داخل هذا المعسكر.");
        return;
      }

      if (existingInThisCamp) {
        alert("هذا المستخدم موجود بالفعل في المعسكر.");
        return;
      }

      // هل عنده معسكر آخر؟
      const { data: existingMembershipRows, error: existingMembershipError } = await sb(
        "CampParticipants: check target user has another camp",
        db.from("CampParticipants").select("campId,pUserName").eq("pUserName", targetUserName)
      );

      if (existingMembershipError) {
        alert("تعذر التحقق من معسكرات المستخدم.");
        return;
      }

      const alreadyHasCamp = Array.isArray(existingMembershipRows) && existingMembershipRows.length > 0;
      if (alreadyHasCamp) {
        alert("هذا المستخدم لديه معسكر بالفعل ولا يمكن إضافته.");
        return;
      }

      const insertPayload = {
        campId,
        pUserName: targetUserName,
        joinedAt: new Date().toISOString(),
      };

      const { error: insertError } = await sb(
        "CampParticipants: insert added participant",
        db.from("CampParticipants").insert([insertPayload])
      );

      if (insertError) {
        alert("تعذر إضافة المشارك.");
        return;
      }

      setNewParticipantUserName("");
      await refreshMembers(campId);
      setIsMembersOpen(true);
      alert("تمت إضافة المشارك بنجاح.");
    } catch (e) {
      dbgError("handleAddParticipant() unexpected error", e);
      alert("حدثت مشكلة أثناء إضافة المشارك.");
    } finally {
      setIsAddingParticipant(false);
    }
  }

  async function handleLeaveCamp() {
    if (!campId || !currentUserName) return;

    if (isOwner) {
      alert("لا يمكن لمالك المعسكر مغادرة المعسكر حاليًا.");
      return;
    }

    const confirmed = window.confirm("هل أنت متأكد من مغادرة المعسكر؟");
    if (!confirmed) return;

    setIsLeavingCamp(true);
    dbg("handleLeaveCamp() start", { campId, currentUserName });

    try {
      const { error } = await sb(
        "CampParticipants: delete current user membership",
        db.from("CampParticipants").delete().eq("campId", campId).eq("pUserName", currentUserName)
      );

      if (error) {
        alert("تعذر مغادرة المعسكر.");
        return;
      }

      router.push("/camp");
    } catch (e) {
      dbgError("handleLeaveCamp() unexpected error", e);
      alert("حدثت مشكلة أثناء مغادرة المعسكر.");
    } finally {
      setIsLeavingCamp(false);
    }
  }

  function handleComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0614] text-white px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        {/* Header */}
        <div className="rounded-2xl border border-purple-500/40 bg-white/5 p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{camp?.name}</h1>
              <p className="mt-2 text-sm md:text-base text-gray-300">
                {camp?.description || "لا يوجد وصف لهذا المعسكر حاليًا."}
              </p>
            </div>

            {!isOwner && currentUserName && (
              <button
                type="button"
                onClick={handleLeaveCamp}
                disabled={isLeavingCamp}
                className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/20 disabled:opacity-60"
              >
                {isLeavingCamp ? "جاري المغادرة..." : "مغادرة المعسكر"}
              </button>
            )}
          </div>
        </div>

        {/* Members accordion */}
        <div className="rounded-2xl border border-purple-500/40 bg-white/5 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsMembersOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-4 text-right transition hover:bg-white/5"
          >
            <div>
              <div className="text-base md:text-lg font-semibold">أعضاء المعسكر</div>
              <div className="text-sm text-gray-400">{members.length} عضو</div>
            </div>
            <span className="text-sm text-purple-200">
              {isMembersOpen ? "إخفاء" : "إظهار"}
            </span>
          </button>

          {isMembersOpen && (
            <div className="border-t border-white/10 px-4 py-3">
              {isOwner && (
                <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="mb-3 text-sm font-medium text-purple-100">
                    إضافة مشارك جديد
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={newParticipantUserName}
                      onChange={(e) => setNewParticipantUserName(e.target.value)}
                      placeholder="اسم المستخدم للمشارك..."
                      className="flex-1 rounded-2xl border border-purple-500/40 bg-[#120b22] px-4 py-3 text-sm outline-none placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddParticipant}
                      disabled={isAddingParticipant}
                      className="rounded-2xl bg-purple-600 px-4 py-3 text-sm font-medium transition hover:bg-purple-500 disabled:opacity-60"
                    >
                      {isAddingParticipant ? "جاري الإضافة..." : "إضافة"}
                    </button>
                  </div>
                </div>
              )}

              {members.length === 0 ? (
                <p className="text-sm text-gray-400">لا يوجد أعضاء حاليًا.</p>
              ) : (
                <ul className="space-y-2">
                  {members.map((m) => {
                    const memberIsOwner = camp?.creatorUser === m.pUserName;

                    return (
                      <li
                        key={m.pUserName}
                        className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2"
                      >
                        <span className="text-purple-100">{m.pUserName}</span>
                        {memberIsOwner && (
                          <span className="rounded-full border border-pink-400/40 bg-pink-500/10 px-2 py-1 text-xs text-pink-200">
                            القائد
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="rounded-2xl border border-purple-500/40 bg-white/5 p-3 md:p-4">
          <div className="mb-4 h-[430px] overflow-y-auto rounded-2xl bg-black/15 p-3 md:p-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                لا توجد رسائل بعد. 
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const replied = msg.replyToMessageId ? messagesById.get(msg.replyToMessageId) : null;
                  const isMine = currentUserName === msg.senderUser;

                  return (
                    <div
                      key={msg.id}
                      className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] sm:max-w-[75%] md:max-w-[68%] rounded-2xl px-4 py-3 shadow-sm ${
                          isMine
                            ? "bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white rounded-br-md"
                            : "bg-[#1b1330] text-white border border-white/10 rounded-bl-md"
                        }`}
                        style={{ width: "fit-content", minWidth: "120px" }}
                      >
                        <div
                          className={`mb-2 text-[11px] ${
                            isMine ? "text-white/80" : "text-gray-300"
                          }`}
                        >
                          {msg.senderUser} • {new Date(msg.createdAt).toLocaleString()}
                        </div>

                        {replied && (
                          <div
                            className={`mb-2 rounded-xl border px-3 py-2 text-xs ${
                              isMine
                                ? "border-white/20 bg-white/10 text-white/90"
                                : "border-white/10 bg-black/20 text-gray-200"
                            }`}
                          >
                            <div className="mb-1 opacity-80">ردًا على: {replied.senderUser}</div>
                            <div className="whitespace-pre-wrap break-words line-clamp-3">
                              {replied.body}
                            </div>
                          </div>
                        )}

                        <div className="whitespace-pre-wrap break-words text-sm leading-6">
                          {msg.body}
                        </div>

                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setReplyTo(msg)}
                            className={`text-[11px] transition ${
                              isMine
                                ? "text-white/85 hover:text-white"
                                : "text-purple-200 hover:text-purple-100"
                            }`}
                          >
                            رد (اقتباس)
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {replyTo && (
            <div className="mb-3 rounded-2xl border border-purple-500/40 bg-purple-950/40 px-4 py-3">
              <div className="mb-1 text-xs text-gray-200">أنتِ تردين على: {replyTo.senderUser}</div>
              <div className="line-clamp-2 text-sm text-gray-100">{replyTo.body}</div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="mt-2 text-xs text-red-200 hover:text-red-100"
              >
                إلغاء الرد
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="اكتب رسالتك..."
              rows={1}
              className="max-h-40 min-h-[48px] flex-1 resize-none overflow-y-auto rounded-2xl border border-purple-500/50 bg-[#120b22] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              className="h-12 rounded-2xl bg-purple-600 px-5 text-sm font-medium transition hover:bg-purple-500"
            >
              إرسال
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
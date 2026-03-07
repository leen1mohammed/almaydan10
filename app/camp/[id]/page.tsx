"use client";

/**
 * الملف: app/camp/[id]/page.tsx
 * الدور: عرض المعسكر + الأعضاء + شات المعسكر (Realtime) + Reply (اقتباس)
 * مضاف: Debug logs لكل خطوة واستعلام Supabase
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

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const messagesById = useMemo(() => {
    const m = new Map<number, MessageRow>();
    for (const msg of messages) m.set(msg.id, msg);
    return m;
  }, [messages]);

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

  useEffect(() => {
    if (!campId) return;

    let alive = true;

    const fetchData = async () => {
      dbg("CampPage fetchData() start", { campId });

      try {
        const userName = await getUserNameOrRedirect();
        if (!userName) return;

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
    } catch (e) {
      dbgError("handleSendMessage() unexpected error", e);
      alert("تعذر إرسال الرسالة.");
    }
  }

  return (
    <div className="min-h-screen p-8 text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{camp?.name}</h1>
        <p className="text-gray-400">{camp?.description}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl mb-2">أعضاء المعسكر</h2>
        <ul className="space-y-1">
          {members.map((m) => (
            <li key={m.pUserName} className="text-purple-300">
              {m.pUserName}
            </li>
          ))}
        </ul>
      </div>

      <div className="border border-purple-500 rounded-xl p-4 mb-4 h-[350px] overflow-y-auto">
        {messages.map((msg) => {
          const replied = msg.replyToMessageId ? messagesById.get(msg.replyToMessageId) : null;
          return (
            <div key={msg.id} className="mb-2 bg-purple-900 p-3 rounded-lg">
              <div className="text-xs text-gray-300">
                {msg.senderUser} • {new Date(msg.createdAt).toLocaleString()}
              </div>

              {replied && (
                <div className="mt-2 mb-2 p-2 rounded-md bg-black/20 border border-white/10 text-xs text-gray-200">
                  <div className="opacity-80">ردًا على: {replied.senderUser}</div>
                  <div className="line-clamp-2">{replied.body}</div>
                </div>
              )}

              <div className="mb-2">{msg.body}</div>

              <button
                type="button"
                onClick={() => setReplyTo(msg)}
                className="text-xs text-purple-200 hover:text-purple-100"
              >
                رد (اقتباس)
              </button>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {replyTo && (
        <div className="mb-3 p-3 rounded-lg border border-purple-500 bg-purple-950/40">
          <div className="text-xs text-gray-200 mb-1">أنتِ تردين على: {replyTo.senderUser}</div>
          <div className="text-sm text-gray-100 line-clamp-2">{replyTo.body}</div>
          <button type="button" onClick={() => setReplyTo(null)} className="mt-2 text-xs text-red-200">
            إلغاء الرد
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="اكتب رسالتك..."
          className="flex-1 rounded-full px-4 py-2 bg-transparent border border-purple-500 outline-none"
        />
        <button onClick={handleSendMessage} className="bg-purple-600 px-6 py-2 rounded-full">
          إرسال
        </button>
      </div>
    </div>
  );
}
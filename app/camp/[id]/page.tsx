"use client";

/**
 * الملف: app/camp/[id]/page.tsx
 * الدور: صفحة عرض المعسكر + قائمة الأعضاء + شات المعسكر (Realtime)
 *
 * يرتبط بـ:
 * - Supabase Tables:
 *   - Member: جلب userName من email
 *   - CampParticipants: التحقق من عضوية المستخدم في campId + جلب الأعضاء
 *   - Camp: جلب بيانات المعسكر
 *   - Messages: جلب/إدخال الرسائل + Realtime
 *
 * المدخلات:
 * - campId من رابط الصفحة /camp/[id]
 *
 * المخرجات:
 * - عرض بيانات المعسكر
 * - عرض الأعضاء
 * - عرض الرسائل + إرسال رسالة + تحديث لحظي
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

type CampRow = {
  id: number;
  creatorUser: string;
  name: string;
  description: string | null;
  pic: string | null;
};

type CampParticipantRow = {
  pUserName: string;
  joinedAt: string;
  campId: number;
};

type MessageRow = {
  id: number;
  body: string;
  campId: number;
  senderUser: string;
  createdAt: string;
  replyToMessageId: number | null;
  // موجودة عندكم في الجدول (نتركها للتوافق)
  date?: string | null;
  time?: string | null;
};

export default function CampPage() {
  /**
   * الجزء: قراءة campId من الرابط
   * لماذا؟ عشان نعرف أي معسكر نجيب بياناته
   * ملاحظة: useParams قد يرجع string أو string[] لذلك نحوله
   */
  const params = useParams();
  const router = useRouter();

  const campIdStr = useMemo(() => {
    const raw = (params as any)?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  /**
   * الجزء: تحويل campId إلى رقم لأن قاعدة البيانات int8
   * الفائدة: يمنع mismatch في الاستعلامات والـ insert والـ realtime filter
   */
  const campIdNum = useMemo(() => {
    const n = Number(campIdStr);
    return Number.isFinite(n) ? n : null;
  }, [campIdStr]);

  /**
   * حالات البيانات
   */
  const [camp, setCamp] = useState<CampRow | null>(null);
  const [members, setMembers] = useState<CampParticipantRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMessage, setNewMessage] = useState("");

  /**
   * تجهيز دعم reply (اقتباس)
   * - حاليًا: نخليه جاهز بالـ state، والـ UI ممكن نضيفه بعد
   */
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null);

  /**
   * مرجع DOM للتمرير لآخر رسالة
   */
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  /**
   * فهرس سريع للرسائل حسب id عشان نعرض اقتباس (إذا replyToMessageId موجود)
   */
  const messagesById = useMemo(() => {
    const map = new Map<number, MessageRow>();
    for (const m of messages) map.set(m.id, m);
    return map;
  }, [messages]);

  /**
   * useEffect: جلب البيانات الأساسية + التحقق من صلاحية الوصول
   * الخطوات:
   * 1) التأكد أن المستخدم مسجل دخول
   * 2) جلب userName من Member
   * 3) التحقق أن المستخدم عضو في campId عبر CampParticipants
   * 4) جلب بيانات Camp
   * 5) جلب أعضاء CampParticipants
   * 6) جلب رسائل Messages مرتبة بـ createdAt
   */
  useEffect(() => {
    if (!campIdNum) return;

    const fetchData = async () => {
      try {
        // 1) التحقق من تسجيل الدخول
        const currentUser = await authService.getCurrentUser();
        if (!currentUser?.email) {
          router.push("/login");
          return;
        }

        // 2) جلب userName من Member باستخدام email
        const { data: memberData, error: memberError } = await supabase
          .from("Member")
          .select("userName")
          .eq("email", currentUser.email)
          .single();

        if (memberError || !memberData?.userName) {
          console.error("Member fetch error:", memberError);
          router.push("/login");
          return;
        }

        const userName = String(memberData.userName);

        // 3) التحقق من عضوية المستخدم في هذا المعسكر
        const { data: membership, error: membershipError } = await supabase
          .from("CampParticipants")
          .select("campId,pUserName")
          .eq("campId", campIdNum)
          .eq("pUserName", userName)
          .maybeSingle();

        if (membershipError) {
          console.error("Membership check error:", membershipError);
          alert("تعذر التحقق من صلاحية الوصول للمعسكر.");
          router.push("/camp");
          return;
        }

        if (!membership) {
          alert("لا تملك صلاحية الوصول إلى هذا المعسكر.");
          router.push("/camp");
          return;
        }

        // 4) جلب بيانات المعسكر
        const { data: campData, error: campError } = await supabase
          .from("Camp")
          .select("*")
          .eq("id", campIdNum)
          .single();

        if (campError) {
          console.error("Camp fetch error:", campError);
          alert("تعذر تحميل بيانات المعسكر.");
          router.push("/camp");
          return;
        }

        setCamp(campData as CampRow);

        // 5) جلب الأعضاء
        const { data: membersData, error: membersError } = await supabase
          .from("CampParticipants")
          .select("pUserName,joinedAt,campId")
          .eq("campId", campIdNum);

        if (membersError) console.error("Members fetch error:", membersError);
        setMembers((membersData || []) as CampParticipantRow[]);

        // 6) جلب الرسائل مرتبة حسب createdAt
        const { data: messagesData, error: messagesError } = await supabase
          .from("Messages")
          .select("*")
          .eq("campId", campIdNum)
          .order("createdAt", { ascending: true });

        if (messagesError) console.error("Messages fetch error:", messagesError);
        setMessages((messagesData || []) as MessageRow[]);
      } catch (e) {
        console.error("Camp page fetch error:", e);
        alert("حدثت مشكلة أثناء تحميل المعسكر.");
        router.push("/camp");
      }
    };

    fetchData();
  }, [campIdNum, router]);

  /**
   * useEffect: الاشتراك اللحظي (Realtime) على INSERT في Messages لهذا المعسكر
   * ملاحظة:
   * - يعتمد على Enable Realtime + RLS SELECT الصحيحة
   * - نعمل dedupe عشان ما تتكرر الرسالة لو جاءت مرتين (نادرًا)
   */
  useEffect(() => {
    if (!campIdNum) return;

    const channel = supabase
      .channel(`camp-${campIdNum}-messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Messages",
          filter: `campId=eq.${campIdNum}`,
        },
        (payload) => {
          const newRow = payload.new as MessageRow;

          setMessages((prev) => {
            // منع التكرار حسب id
            if (prev.some((m) => m.id === newRow.id)) return prev;
            return [...prev, newRow];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campIdNum]);

  /**
   * useEffect: تمرير تلقائي لآخر رسالة
   */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * الدالة: handleSendMessage
   * الدور: إرسال رسالة جديدة لجدول Messages
   * الشروط:
   * - المستخدم مسجل دخول
   * - senderUser لازم يطابق userName المرتبط بـ auth.email (عشان RLS)
   */
  const handleSendMessage = async () => {
    if (!campIdNum) return;

    const body = newMessage.trim();
    if (!body) return;

    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser?.email) {
        alert("يرجى تسجيل الدخول للمتابعة.");
        router.push("/login");
        return;
      }

      // جلب userName (لازم عشان senderUser)
      const { data: memberData, error: memberError } = await supabase
        .from("Member")
        .select("userName")
        .eq("email", currentUser.email)
        .single();

      if (memberError || !memberData?.userName) {
        console.error("Member fetch error:", memberError);
        alert("تعذر إرسال الرسالة.");
        return;
      }

      const senderUser = String(memberData.userName);

      // (اختياري) نخلي date/time موجودة للتوافق مع جدولكم
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().slice(0, 5);

      const { error: insertError } = await supabase.from("Messages").insert([
        {
          body,
          senderUser, // ✅ العمود الجديد
          campId: campIdNum, // ✅ رقم
          replyToMessageId: replyTo ? replyTo.id : null, // ✅ جاهز للـ reply
          // createdAt له default now() في DB، مو لازم نرسله
          date,
          time,
        },
      ]);

      if (insertError) {
        console.error("Message insert error:", insertError);
        alert("تعذر إرسال الرسالة.");
        return;
      }

      setNewMessage("");
      setReplyTo(null);
    } catch (e) {
      console.error("Send message error:", e);
      alert("تعذر إرسال الرسالة.");
    }
  };

  /**
   * الدالة: formatMessageMeta
   * الدور: توحيد عرض وقت الرسالة
   * - نعرض createdAt إذا موجود
   * - وإلا fallback على date/time (للتوافق)
   */
  const formatMessageMeta = (msg: MessageRow) => {
    if (msg.createdAt) {
      // عرض مختصر بدون تعقيد
      const d = new Date(msg.createdAt);
      if (!Number.isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
      }
    }

    const date = msg.date ?? "";
    const time = msg.time ?? "";
    return `${date} ${time}`.trim();
  };

  /**
   * JSX UI
   */
  return (
    <div className="min-h-screen p-8 text-white">
      {/* معلومات المعسكر */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{camp?.name}</h1>
        <p className="text-gray-400">{camp?.description}</p>
      </div>

      {/* قائمة الأعضاء */}
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

      {/* الشات */}
      <div className="border border-purple-500 rounded-xl p-4 mb-4 h-[350px] overflow-y-auto">
        {messages.map((msg) => {
          const quoted =
            msg.replyToMessageId != null ? messagesById.get(msg.replyToMessageId) : null;

          return (
            <div key={msg.id} className="mb-2 bg-purple-900 p-3 rounded-lg">
              <div className="text-xs text-gray-300">
                {msg.senderUser} • {formatMessageMeta(msg)}
              </div>

              {/* عرض اقتباس بسيط إذا الرسالة رد على رسالة */}
              {quoted && (
                <div className="mt-2 mb-2 p-2 rounded-md bg-purple-950/60 border border-purple-700">
                  <div className="text-[11px] text-gray-300">
                    رد على: {quoted.senderUser}
                  </div>
                  <div className="text-sm text-gray-200 line-clamp-2">
                    {quoted.body}
                  </div>
                </div>
              )}

              <div>{msg.body}</div>

              {/* زر Reply (اختياري) — جاهز الآن */}
              <button
                type="button"
                onClick={() => setReplyTo(msg)}
                className="mt-2 text-xs text-purple-200 hover:text-purple-100"
              >
                رد (اقتباس)
              </button>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* شريط يوضح على مين تردين */}
      {replyTo && (
        <div className="mb-3 p-3 rounded-lg border border-purple-600 bg-purple-950/40">
          <div className="text-xs text-gray-300">رد على: {replyTo.senderUser}</div>
          <div className="text-sm text-gray-100 line-clamp-2">{replyTo.body}</div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="mt-2 text-xs text-red-200 hover:text-red-100"
          >
            إلغاء الرد
          </button>
        </div>
      )}

      {/* إدخال رسالة */}
      <div className="flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="اكتب رسالتك..."
          className="flex-1 rounded-full px-4 py-2 bg-transparent border border-purple-500 outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
        />
        <button
          onClick={handleSendMessage}
          className="bg-purple-600 px-6 py-2 rounded-full"
        >
          إرسال
        </button>
      </div>
    </div>
  );
}
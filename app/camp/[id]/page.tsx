"use client";

/**
 * الملف: app/camp/[id]/page.tsx
 * الدور: صفحة عرض المعسكر + قائمة الأعضاء + شات المعسكر
 *
 * يرتبط بـ:
 * - Supabase Tables:
 *   - Member (جلب userName من email)
 *   - CampParticipants (التحقق من عضوية المستخدم في campId)
 *   - Camp (جلب بيانات المعسكر)
 *   - Messages (جلب الرسائل + إدخال رسائل جديدة + realtime)
 * - authService.getCurrentUser(): للتحقق من تسجيل الدخول
 *
 * المدخلات:
 * - campId من رابط الصفحة /camp/[id]
 *
 * المخرجات:
 * - عرض بيانات المعسكر (name/description)
 * - عرض الأعضاء
 * - عرض الرسائل + إرسال رسالة + تحديث لحظي (Realtime)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

export default function CampPage() {
  /**
   * الجزء: قراءة campId من الرابط
   * لماذا؟ عشان نعرف أي معسكر نجيب بياناته
   * ملاحظة: useParams قد يرجع string أو string[]؛ لذلك نحوله إلى string مضمون
   */
  const params = useParams();
  const router = useRouter();

  const campId = useMemo(() => {
    const raw = (params as any)?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  /**
   * الجزء: حالات البيانات الرئيسية
   * الدور: تخزين بيانات المعسكر/الأعضاء/الرسائل
   * يرتبط بـ:
   * - fetchData (جلب البيانات)
   * - realtime subscription (تحديث الرسائل)
   */
  const [camp, setCamp] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  /**
   * الجزء: مراجع DOM
   * الدور: التمرير تلقائيًا لآخر رسالة (chat auto scroll)
   */
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  /**
   * useEffect: جلب البيانات الأساسية + التحقق الأمني
   * الدور:
   * 1) التأكد أن المستخدم مسجل دخول
   * 2) جلب userName من Member
   * 3) التحقق أن المستخدم عضو في هذا المعسكر عبر CampParticipants (campId + pUserName)
   * 4) جلب بيانات Camp
   * 5) جلب أعضاء CampParticipants
   * 6) جلب رسائل Messages
   *
   * المدخلات:
   * - campId
   * المخرجات:
   * - تعبئة states: camp, members, messages
   */
  useEffect(() => {
    if (!campId) return;

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

        const userName = memberData.userName;

        // 3) التحقق من عضوية المستخدم في هذا المعسكر
        // يرتبط بتحديثك: CampParticipants.campId و CampParticipants.joinedAt
        const { data: membership, error: membershipError } = await supabase
          .from("CampParticipants")
          .select("campId,pUserName")
          .eq("campId", campId)
          .eq("pUserName", userName)
          .maybeSingle();

        if (membershipError) {
          console.error("Membership check error:", membershipError);
          alert("تعذر التحقق من صلاحية الوصول للمعسكر. يرجى المحاولة مرة أخرى.");
          router.push("/camp");
          return;
        }

        if (!membership) {
          // المستخدم غير عضو في المعسكر
          alert("لا تملك صلاحية الوصول إلى هذا المعسكر.");
          router.push("/camp");
          return;
        }

        // 4) جلب بيانات المعسكر
        const { data: campData, error: campError } = await supabase
          .from("Camp")
          .select("*")
          .eq("id", campId)
          .single();

        if (campError) {
          console.error("Camp fetch error:", campError);
          alert("تعذر تحميل بيانات المعسكر. يرجى المحاولة مرة أخرى.");
          router.push("/camp");
          return;
        }

        setCamp(campData);

        // 5) جلب الأعضاء
        const { data: membersData, error: membersError } = await supabase
          .from("CampParticipants")
          .select("pUserName")
          .eq("campId", campId);

        if (membersError) {
          console.error("Members fetch error:", membersError);
        }

        setMembers(membersData || []);

        // 6) جلب الرسائل (مرتبة)
        const { data: messagesData, error: messagesError } = await supabase
          .from("Messages")
          .select("*")
          .eq("campID", campId) // تأكد اسم العمود في جدول Messages هو campID
          .order("date", { ascending: true });

        if (messagesError) {
          console.error("Messages fetch error:", messagesError);
        }

        setMessages(messagesData || []);
      } catch (e) {
        console.error("Camp page fetch error:", e);
        alert("حدثت مشكلة أثناء تحميل المعسكر. يرجى المحاولة مرة أخرى.");
        router.push("/camp");
      }
    };

    fetchData();
  }, [campId, router]);

  /**
   * useEffect: الاشتراك اللحظي في رسائل المعسكر (Realtime)
   * الدور: عند إدخال رسالة جديدة في جدول Messages لهذا campID، نضيفها مباشرة للواجهة
   *
   * يرتبط بـ:
   * - Supabase Realtime (channel)
   * - جدول Messages
   *
   * المدخلات:
   * - campId
   * المخرجات:
   * - تحديث messages state بإضافة الرسائل الجديدة
   */
  useEffect(() => {
    if (!campId) return;

    const channel = supabase
      .channel(`camp-${campId}-messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Messages",
          filter: `campID=eq.${campId}`, // تأكد اسم العمود في Messages هو campID
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as any]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campId]);

  /**
   * useEffect: تمرير تلقائي لآخر رسالة
   * الدور: يحسن تجربة المستخدم في الشات
   * يرتبط بـ:
   * - chatEndRef
   * - messages state
   */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * الدالة: handleSendMessage
   * الدور: إرسال رسالة جديدة لجدول Messages
   *
   * يرتبط بـ:
   * - Member: لجلب userName للمرسل
   * - Messages: insert رسالة جديدة
   * - Realtime: سيضيف الرسالة تلقائيًا بعد INSERT
   *
   * المدخلات:
   * - newMessage (نص المستخدم)
   * - campId (من الرابط)
   *
   * المخرجات:
   * - insert في Messages
   * - تصفير input
   */
  const handleSendMessage = async () => {
    if (!campId) return;

    const body = newMessage.trim();
    if (!body) return;

    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser?.email) {
        alert("يرجى تسجيل الدخول للمتابعة.");
        router.push("/login");
        return;
      }

      const { data: memberData, error: memberError } = await supabase
        .from("Member")
        .select("userName")
        .eq("email", currentUser.email)
        .single();

      if (memberError || !memberData?.userName) {
        console.error("Member fetch error:", memberError);
        alert("تعذر إرسال الرسالة. يرجى المحاولة مرة أخرى.");
        return;
      }

      const senderUserName = memberData.userName;

      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().slice(0, 5);

      const { error: insertError } = await supabase.from("Messages").insert([
        {
          body,
          senderID: senderUserName,
          campID: campId, // تأكد اسم العمود في جدول Messages هو campID
          date,
          time,
        },
      ]);

      if (insertError) {
        console.error("Message insert error:", insertError);
        alert("تعذر إرسال الرسالة. يرجى المحاولة مرة أخرى.");
        return;
      }

      setNewMessage("");
    } catch (e) {
      console.error("Send message error:", e);
      alert("تعذر إرسال الرسالة. يرجى المحاولة مرة أخرى.");
    }
  };

  /**
   * JSX UI
   * الدور: عرض بيانات المعسكر والأعضاء والشات
   * يرتبط بـ:
   * - states: camp, members, messages, newMessage
   * - handlers: handleSendMessage
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
          {members.map((m, index) => (
            <li key={index} className="text-purple-300">
              {m.pUserName}
            </li>
          ))}
        </ul>
      </div>

      {/* الشات */}
      <div className="border border-purple-500 rounded-xl p-4 mb-4 h-[350px] overflow-y-auto">
        {messages.map((msg: any, index) => (
          <div key={index} className="mb-2 bg-purple-900 p-3 rounded-lg">
            <div className="text-xs text-gray-300">
              {msg.senderID} • {msg.date} {msg.time}
            </div>
            <div>{msg.body}</div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* إدخال رسالة */}
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
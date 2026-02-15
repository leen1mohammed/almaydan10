"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

export default function CampPage() {
  const { id: campId } = useParams();
  const router = useRouter();

  const [camp, setCamp] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  //  جلب البيانات الأساسية + التحقق الأمني
  useEffect(() => {
    const fetchData = async () => {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser || !currentUser.email) {
        router.push("/login");
        return;
      }

      // استخراج userName من Member
      const { data: memberData } = await supabase
        .from("Member")
        .select("userName")
        .eq("email", currentUser.email)
        .single();

      if (!memberData) {
        router.push("/login");
        return;
      }

      const userName = memberData.userName;

      //  التحقق أن المستخدم عضو في المعسكر
      const { data: membership } = await supabase
        .from("CampParticipants")
        .select("*")
        .eq("campId", campId)
        .eq("pUserName", userName)
        .maybeSingle();

      if (!membership) {
        router.push("/camp");
        return;
      }

      //  جلب بيانات المعسكر
      const { data: campData } = await supabase
        .from("Camp")
        .select("*")
        .eq("id", campId)
        .single();

      setCamp(campData);

      // 👥 جلب الأعضاء
      const { data: membersData } = await supabase
        .from("CampParticipants")
        .select("pUserName")
        .eq("campId", campId);

      setMembers(membersData || []);

      //  جلب الرسائل
      const { data: messagesData } = await supabase
        .from("Messages")
        .select("*")
        .eq("campID", campId)
        .order("date", { ascending: true });

      setMessages(messagesData || []);
    };

    fetchData();
  }, [campId, router]);

  //  Realtime Subscription للرسائل
  useEffect(() => {
    const channel = supabase
      .channel(`camp-${campId}-messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Messages",
          filter: `campID=eq.${campId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campId]);

  //  Auto Scroll لآخر رسالة
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //  إرسال رسالة جديدة
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const currentUser = await authService.getCurrentUser();
    if (!currentUser) return;

    const { data: memberData } = await supabase
      .from("Member")
      .select("userName")
      .eq("email", currentUser.email)
      .single();

    if (!memberData) return;

    const senderUserName = memberData.userName;

    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().slice(0, 5);

    await supabase.from("Messages").insert([
      {
        body: newMessage,
        senderID: senderUserName,
        campID: campId,
        date: date,
        time: time,
      },
    ]);

    setNewMessage("");
  };

  return (
    <div className="min-h-screen p-8 text-white">
      {/*  معلومات المعسكر */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{camp?.name}</h1>
        <p className="text-gray-400">{camp?.description}</p>
      </div>

      {/*  قائمة الأعضاء */}
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

      {/*  الشات */}
      <div className="border border-purple-500 rounded-xl p-4 mb-4 h-[350px] overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2 bg-purple-900 p-3 rounded-lg">
            <div className="text-xs text-gray-300">
              {msg.senderID} • {msg.date} {msg.time}
            </div>
            <div>{msg.body}</div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/*  إدخال رسالة */}
      <div className="flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="اكتب رسالتك..."
          className="flex-1 rounded-full px-4 py-2 bg-transparent border border-purple-500 outline-none"
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

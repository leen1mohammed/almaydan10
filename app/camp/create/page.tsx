"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

export default function CreateCampPage() {
  const router = useRouter();

  // حالات الفورم
  const [campName, setCampName] = useState("");
  const [description, setDescription] = useState("");
  const [pic, setPic] = useState("");
  const [friendInput, setFriendInput] = useState("");
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // إضافة صديق للقائمة
  const handleAddFriend = () => {
    if (friendInput.trim() !== "") {
      setInvitedFriends([...invitedFriends, friendInput.trim()]);
      setFriendInput("");
    }
  };

  // إنشاء المعسكر
  const handleCreateCamp = async () => {
    try {
      setLoading(true);

      // 1️⃣ جلب المستخدم الحالي
      const currentUser = await authService.getCurrentUser();
      if (!currentUser || !currentUser.email) {
        router.push("/login");
        return;
      }

      // 2️⃣ استخراج userName من Member
      const { data: memberData, error: memberError } = await supabase
        .from("Member")
        .select("userName")
        .eq("email", currentUser.email)
        .single();

        if (memberError || !memberData) {
        console.error("Failed to fetch member username");
        router.push("/login");
        return;
        }

        const creatorUserName = memberData.userName;


      // 3️⃣ إنشاء المعسكر
      const { data: campData, error: campError } = await supabase
        .from("Camp")
        .insert([
          {
            name: campName,
            description: description,
            pic: pic,
            creatorID: creatorUserName,
          },
        ])
        .select()
        .single();

      if (campError) {
        console.error("خطأ في إنشاء المعسكر:", campError.message);
        return;
      }

      const campId = campData.id;

      // 4️⃣ إضافة المنشئ كأول عضو
      await supabase.from("CampParticipants").insert([
        {
          campId: campId,
          pUserName: creatorUserName,
        },
      ]);

      // 5️⃣ إضافة الأصدقاء المدعوين
      for (const friend of invitedFriends) {
        // تحقق أن الصديق Participant
        const { data: participant } = await supabase
          .from("Participant")
          .select("PuserName")
          .eq("PuserName", friend)
          .maybeSingle();

        if (participant) {
          await supabase.from("CampParticipants").insert([
            {
              campId: campId,
              pUserName: friend,
            },
          ]);
        }
      }

      // 6️⃣ الانتقال لصفحة المعسكر
      router.push(`/camp/${campId}`);
    } catch (err) {
      console.error("Unexpected Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[420px] rounded-3xl border border-purple-500 p-6 bg-[#0b0f2a] shadow-[0_0_30px_rgba(168,85,247,0.4)]">
        
        {/* اسم المعسكر */}
        <input
          type="text"
          placeholder="اسم المعسكر..."
          value={campName}
          onChange={(e) => setCampName(e.target.value)}
          className="w-full mb-4 rounded-full bg-transparent border border-purple-500 px-4 py-2 text-white outline-none"
        />

        {/* صورة المعسكر */}
        <input
          type="text"
          placeholder="رابط صورة المعسكر"
          value={pic}
          onChange={(e) => setPic(e.target.value)}
          className="w-full mb-4 rounded-full bg-transparent border border-purple-500 px-4 py-2 text-white outline-none"
        />

        {/* إضافة صديق */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="اكتب اسم صديق..."
            value={friendInput}
            onChange={(e) => setFriendInput(e.target.value)}
            className="flex-1 rounded-full bg-transparent border border-purple-500 px-4 py-2 text-white outline-none"
          />
          <button
            onClick={handleAddFriend}
            className="bg-purple-600 px-4 rounded-full text-white"
          >
            +
          </button>
        </div>

        {/* عرض الأصدقاء المدعوين */}
        <div className="mb-6 text-sm text-purple-300">
          {invitedFriends.map((friend, index) => (
            <div key={index}>• {friend}</div>
          ))}
        </div>

        {/* الأزرار */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push("/camp")}
            className="bg-red-600 px-4 py-2 rounded-full text-white"
          >
            خروج
          </button>

          <button
            onClick={handleCreateCamp}
            disabled={loading}
            className="bg-purple-600 px-6 py-2 rounded-full text-white"
          >
            {loading ? "جارٍ الإنشاء..." : "إنشاء"}
          </button>
        </div>
      </div>
    </div>
  );
}

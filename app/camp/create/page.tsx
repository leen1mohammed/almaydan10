"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

export default function CreateCampPage() {
  const router = useRouter();

  const [campName, setCampName] = useState("");
  const [campImage, setCampImage] = useState<File | null>(null);
  const [friends, setFriends] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);

  const handleAddFriend = () => {
    setFriends([...friends, ""]);
  };

  const handleFriendChange = (index: number, value: string) => {
    const updated = [...friends];
    updated[index] = value;
    setFriends(updated);
  };

  const handleCreateCamp = async () => {
    if (!campName.trim()) return;
    setLoading(true);

    const currentUser = await authService.getCurrentUser();
    if (!currentUser) return;

    const { data: memberData, error: memberError } = await supabase
  .from("Member")
  .select("userName")
  .eq("email", currentUser.email)
  .single();

if (memberError || !memberData) {
  console.error("Error fetching memberData:", memberError);
  setLoading(false);
  return;
}

const creatorUserName = memberData.userName;


    // 🖼️ رفع صورة المعسكر إلى Storage
    let imageUrl = "";

    if (campImage) {
      const fileExt = campImage.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("camp-images")
        .upload(fileName, campImage);

      if (!uploadError) {
        const { data: publicUrl } = supabase.storage
          .from("camp-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrl.publicUrl;
      }
    }

    // 🏕 إنشاء المعسكر
    const { data: campData, error: campError } = await supabase
      .from("Camp")
      .insert([
        {
          name: campName,
          description: "",
          pic: imageUrl,
          creatorID: creatorUserName,
        },
      ])
      .select()
      .single();

    if (campError) {
      setLoading(false);
      return;
    }

    const campId = campData.id;

    // 👥 إضافة المنشئ كـ participant
    await supabase.from("CampParticipants").insert([
      {
        campId: campId,
        pUserName: creatorUserName,
        joinedAt: new Date().toISOString(),
      },
    ]);

    // 📩 إضافة الأصدقاء المدعوين
    const invitedFriends = friends.filter((f) => f.trim() !== "");

    for (const friendUserName of invitedFriends) {
      await supabase.from("CampParticipants").insert([
        {
          campId: campId,
          pUserName: friendUserName,
          joinedAt: new Date().toISOString(),
        },
      ]);
    }

    setLoading(false);
    router.push(`/camp/${campId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="w-[400px] bg-[#0B0F2A] border border-purple-600 rounded-3xl p-6 shadow-lg space-y-4">
        
        {/* اسم المعسكر */}
        <input
          type="text"
          placeholder="اسم المعسكر..."
          value={campName}
          onChange={(e) => setCampName(e.target.value)}
          className="w-full rounded-full px-4 py-3 bg-transparent border border-purple-500 outline-none"
        />

        {/* رفع صورة المعسكر */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCampImage(e.target.files?.[0] || null)}
          className="w-full rounded-full px-4 py-3 bg-transparent border border-purple-500 outline-none"
        />

        {/* Preview للصورة */}
        {campImage && (
          <img
            src={URL.createObjectURL(campImage)}
            className="w-24 h-24 object-cover rounded-full mx-auto"
          />
        )}

        {/* دعوة الأصدقاء */}
        {friends.map((friend, index) => (
          <input
            key={index}
            type="text"
            placeholder="اكتب اسم صديق..."
            value={friend}
            onChange={(e) => handleFriendChange(index, e.target.value)}
            className="w-full rounded-full px-4 py-3 bg-transparent border border-purple-500 outline-none"
          />
        ))}

        <button
          onClick={handleAddFriend}
          className="w-full py-2 bg-purple-700 rounded-full"
        >
          + إضافة صديق
        </button>

        {/* إنشاء */}
        <button
          onClick={handleCreateCamp}
          disabled={loading}
          className="w-full py-3 bg-purple-600 rounded-full"
        >
          {loading ? "جارٍ الإنشاء..." : "إنشاء"}
        </button>
      </div>
    </div>
  );
}

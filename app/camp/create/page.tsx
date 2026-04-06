"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

const db = supabase as any;

/* =============================== */
function dbg(label: string, payload?: any) {
  console.groupCollapsed(`🧩 [CAMP] ${label}`);
  if (payload !== undefined) console.log("payload:", payload);
  console.groupEnd();
}

function dbgError(label: string, error: any, payload?: any) {
  console.groupCollapsed(`🔴 [CAMP ERROR] ${label}`);
  console.error(error);
  if (payload !== undefined) console.error(payload);
  console.groupEnd();
}

function generateToken() {
  return crypto.randomUUID();
}

async function sb(label: string, queryPromise: Promise<any>) {
  dbg(`${label} (start)`);
  const res = await queryPromise;
  if (res?.error) dbgError(label, res.error);
  else dbg(`${label} (ok)`, res.data);
  return res as any;
}

/* =============================== */

export default function CreateCampPage() {
  const router = useRouter();

  const [campName, setCampName] = useState("");
  const [campDescription, setCampDescription] = useState("");
  const [campImage, setCampImage] = useState<File | null>(null);
  const [inviteLink, setInviteLink] = useState("");

  const [friendUserName, setFriendUserName] = useState("");
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => campName.trim().length > 0 && !loading,
    [campName, loading]
  );

  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!campImage) return setPreviewUrl("");
    const url = URL.createObjectURL(campImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [campImage]);

  async function uploadCampImageViaApi(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/camp/upload", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();

    if (!res.ok) throw new Error(json?.error);
    return json.publicUrl;
  }

  function handleAddFriend() {
    if (!friendUserName.trim()) return;

    if (invitedFriends.includes(friendUserName)) return;

    setInvitedFriends([...invitedFriends, friendUserName.trim()]);
    setFriendUserName("");
  }

  async function getUserNameOrRedirect() {
    const currentUser = await authService.getCurrentUser();

    if (!currentUser?.email) {
      router.push("/login");
      return null;
    }

    const { data } = await db
      .from("Member")
      .select("userName")
      .eq("email", currentUser.email)
      .single();

    return data?.userName;
  }

  async function handleCreateCamp() {
    if (!campName.trim()) return;

    setLoading(true);

    try {
      const userName = await getUserNameOrRedirect();
      if (!userName) return;

      // ✅ FIXED: check existing camp (بدون maybeSingle)
      const { data: existingRows } = await db
        .from("CampParticipants")
        .select("campId, joinedAt")
        .eq("pUserName", userName)
        .order("joinedAt", { ascending: true });

      const existingCampId = existingRows?.[0]?.campId ?? null;

      if (existingCampId) {
        router.push(`/camp/${existingCampId}`);
        return;
      }

      // upload image
      let imageUrl = "";
      if (campImage) {
        imageUrl = await uploadCampImageViaApi(campImage);
      }

      // 🔥 generate invite token
      const inviteToken = generateToken();

      // create camp
      const { data, error } = await db
        .from("Camp")
        .insert([
          {
            name: campName.trim(),
            description: campDescription.trim(),
            pic: imageUrl,
            creatorUser: userName,
            inviteToken,
          },
        ])
        .select("id")
        .single();

      if (error) throw error;

      const campId = data.id;

      // join creator
      await db.from("CampParticipants").insert([
        {
          campId,
          pUserName: userName,
          joinedAt: new Date().toISOString(),
        },
      ]);

      // invite friends
      if (invitedFriends.length > 0) {
        const rows = invitedFriends.map((u) => ({
          campId,
          pUserName: u,
          joinedAt: new Date().toISOString(),
        }));

        await db.from("CampParticipants").insert(rows);
      }

      // 🔥 generate link
      const link = `${window.location.origin}/camp/join?token=${inviteToken}`;
      setInviteLink(link);

      dbg("Invite link generated", link);

      alert("تم إنشاء المعسكر بنجاح!");

    } catch (e) {
      dbgError("Create Camp Error", e);
      alert("صار خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#061125] text-white px-4 relative">

      <div className="absolute top-20 left-10 w-40 h-40 bg-[#29FF64] blur-[120px] opacity-20"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-[#FF27F0] blur-[120px] opacity-20"></div>

      <div className="w-full max-w-md p-[2px] rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="bg-[#0b1326] rounded-3xl p-6 backdrop-blur-xl">

          <div className="flex items-center gap-3 mb-6">
            <input
              placeholder="اسم المعسكر ..."
              value={campName}
              onChange={(e) => setCampName(e.target.value)}
              className="flex-1 px-4 py-3 rounded-full bg-transparent border border-purple-500"
            />

            <div
              onClick={() => document.getElementById("fileInput")?.click()}
              className="w-14 h-14 rounded-full bg-gray-400/30 flex items-center justify-center cursor-pointer"
            >
              {previewUrl ? (
                <img src={previewUrl} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-2xl">+</span>
              )}
            </div>

            <input
              id="fileInput"
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => setCampImage(e.target.files?.[0] || null)}
            />
          </div>

          <div className="mb-5">
            <p className="text-sm mb-2 opacity-70">إضافة صديق</p>

            <div className="flex gap-2">
              <input
                value={friendUserName}
                onChange={(e) => setFriendUserName(e.target.value)}
                placeholder="اكتب اسم المستخدم هنا ..."
                className="flex-1 px-4 py-2 rounded-full bg-transparent border border-purple-500"
              />

              <button
                onClick={handleAddFriend}
                className="px-4 rounded-full bg-purple-600"
              >
                +
              </button>
            </div>

            <div className="mt-2 text-xs opacity-70">
              {invitedFriends.map((f) => (
                <div key={f}>• {f}</div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm mb-2 opacity-70">وصف المعسكر</p>

            <textarea
              value={campDescription}
              onChange={(e) => setCampDescription(e.target.value)}
              placeholder="اكتب وصف هنا ..."
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-purple-500"
            />
          </div>

          <div className="flex justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 rounded-full bg-red-600"
            >
              خروج
            </button>

            <button
              onClick={handleCreateCamp}
              disabled={!canSubmit}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500"
            >
              {loading ? "..." : "إنشاء"}
            </button>
          </div>

          {inviteLink && (
            <div className="mt-4 border border-purple-500 rounded-xl p-3 bg-white/5">
              <p className="text-sm mb-2">رابط الدعوة</p>

              <div className="flex gap-2">
                <input
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2 rounded border border-purple-500 bg-transparent text-sm"
                />

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    alert("تم النسخ");
                  }}
                  className="px-3 bg-purple-600 rounded"
                >
                  نسخ
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
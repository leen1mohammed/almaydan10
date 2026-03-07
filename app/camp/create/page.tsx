"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

const db = supabase as any;

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

/**
 * Supabase wrapper:
 * - يقبل أي Promise راجع من Supabase (select/insert/update/delete)
 * - يطبع result + أي error بتفاصيله
 * - بدون صداع Typescript في المحرر
 */
async function sb(label: string, queryPromise: Promise<any>) {
  dbg(`${label} (start)`);
  const res = await queryPromise;

  const info = {
    status: res?.status,
    count: res?.count,
    hasData: res?.data !== undefined && res?.data !== null,
  };

  if (res?.error) dbgError(label, res.error, info);
  else dbg(`${label} (ok)`, { info, data: res?.data });

  return res as any;
}

export default function CreateCampPage() {
  const router = useRouter();

  const [campName, setCampName] = useState("");
  const [campImage, setCampImage] = useState<File | null>(null);
  const [friendUserName, setFriendUserName] = useState("");
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const MAX_INVITES = 20;
  const MAX_IMAGE_MB = 5;

  const canSubmit = useMemo(() => campName.trim().length > 0 && !loading, [campName, loading]);

  const [previewUrl, setPreviewUrl] = useState("");
  useEffect(() => {
    if (!campImage) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(campImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [campImage]);

  async function uploadCampImageViaApi(file: File): Promise<string> {
    dbg("uploadCampImageViaApi()", { name: file.name, type: file.type, size: file.size });

    if (!file.type.startsWith("image/")) throw new Error("يرجى اختيار ملف صورة صالح.");
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      throw new Error(`حجم الصورة كبير. الحد الأقصى ${MAX_IMAGE_MB}MB.`);
    }

    const formData = new FormData();
    formData.append("file", file);

    dbg("POST /api/camp/upload");
    const res = await fetch("/api/camp/upload", { method: "POST", body: formData });
    const json = await res.json().catch(() => ({}));
    dbg("upload response", { ok: res.ok, status: res.status, json });

    if (!res.ok) throw new Error(json?.error || "تعذر رفع الصورة.");
    if (!json?.publicUrl) throw new Error("تعذر الحصول على رابط الصورة.");

    return String(json.publicUrl);
  }

  function normalizeUserName(u: string) {
    return u.trim();
  }

  function handleAddFriend() {
    const u = normalizeUserName(friendUserName);
    if (!u) return;

    if (invitedFriends.length >= MAX_INVITES) {
      alert(`تم الوصول للحد الأعلى من الدعوات (${MAX_INVITES}).`);
      return;
    }

    const exists = invitedFriends.some((x) => x.toLowerCase() === u.toLowerCase());
    if (exists) {
      alert("هذا المستخدم موجود بالفعل ضمن قائمة الدعوات.");
      setFriendUserName("");
      return;
    }

    setInvitedFriends((prev) => [...prev, u]);
    setFriendUserName("");
  }

  function handleRemoveFriend(u: string) {
    setInvitedFriends((prev) => prev.filter((x) => x !== u));
  }

  async function getUserNameOrRedirect(): Promise<string | null> {
    dbg("getUserNameOrRedirect()");
    const currentUser = await authService.getCurrentUser();
    dbg("authService.getCurrentUser()", currentUser);

    if (!currentUser?.email) {
      alert("يرجى تسجيل الدخول للمتابعة.");
      router.push("/login");
      return null;
    }

    let creatorUserName = (currentUser as any)?.userName as string | undefined;

    if (!creatorUserName) {
      const res = await sb(
        "Member: select userName by email",
        db.from("Member").select("userName").eq("email", currentUser.email).single()
      );

      if (res.error || !res.data?.userName) {
        alert("تعذر تحميل بيانات حسابك. يرجى المحاولة مرة أخرى.");
        return null;
      }

      creatorUserName = String(res.data.userName);
    }

    dbg("Resolved creatorUserName", { creatorUserName });
    return creatorUserName;
  }

  async function validateInvitedFriendsBeforeCreate(creatorUserName: string) {
    const uniqueInvites = invitedFriends
      .map(normalizeUserName)
      .filter(Boolean)
      .filter((u) => u.toLowerCase() !== creatorUserName.toLowerCase())
      .filter((u, idx, arr) => arr.findIndex((x) => x.toLowerCase() === u.toLowerCase()) === idx);

    dbg("validateInvitedFriendsBeforeCreate()", { uniqueInvites });

    if (uniqueInvites.length === 0) {
      return { ok: true, validInvites: [] as string[] };
    }

    // 1) التأكد أنهم Participants
    const invitesCheckRes = await sb(
      "Participant: validate invited users exist",
      db.from("Participant").select("PuserName").in("PuserName", uniqueInvites)
    );

    if (invitesCheckRes.error) {
      alert("تعذر التحقق من المدعوين. حاولي مرة أخرى.");
      return { ok: false, validInvites: [] as string[] };
    }

    const participantSet = new Set(
      (invitesCheckRes.data || []).map((x: any) => String(x.PuserName).toLowerCase())
    );

    const validParticipants = uniqueInvites.filter((u) =>
      participantSet.has(u.toLowerCase())
    );

    const invalidUsers = uniqueInvites.filter(
      (u) => !participantSet.has(u.toLowerCase())
    );

    // 2) التأكد أنهم ليسوا في أي معسكر آخر
    const existingMembershipRes = await sb(
      "CampParticipants: validate invited users are not in another camp",
      db.from("CampParticipants").select("pUserName,campId").in("pUserName", validParticipants)
    );

    if (existingMembershipRes.error) {
      alert("تعذر التحقق من عضوية بعض المدعوين. حاولي مرة أخرى.");
      return { ok: false, validInvites: [] as string[] };
    }

    const usersInOtherCampSet = new Set(
      (existingMembershipRes.data || []).map((x: any) => String(x.pUserName).toLowerCase())
    );

    const blockedUsers = validParticipants.filter((u) =>
      usersInOtherCampSet.has(u.toLowerCase())
    );

    const finalValidInvites = validParticipants.filter(
      (u) => !usersInOtherCampSet.has(u.toLowerCase())
    );

    // 3) لو فيه ناس غير صالحين أو داخلين في معسكر آخر:
    // نحذفهم من القائمة ونوقف الإنشاء مؤقتًا
    if (invalidUsers.length > 0 || blockedUsers.length > 0) {
      const toRemoveSet = new Set(
        [...invalidUsers, ...blockedUsers].map((u) => u.toLowerCase())
      );

      setInvitedFriends((prev) =>
        prev.filter((u) => !toRemoveSet.has(u.trim().toLowerCase()))
      );

      let msg = "";
      if (invalidUsers.length > 0) {
        msg += `هذه الأسماء ليست Participants: ${invalidUsers.join(", ")}.\n`;
      }
      if (blockedUsers.length > 0) {
        msg += `هؤلاء المستخدمون لديهم معسكر بالفعل ولا يمكن دعوتهم: ${blockedUsers.join(", ")}.\n`;
      }
      msg += "تم حذفهم من قائمة الدعوات. راجعي القائمة ثم أعيدي إنشاء المعسكر.";

      alert(msg);

      return { ok: false, validInvites: finalValidInvites };
    }

    return { ok: true, validInvites: finalValidInvites };
  }

  async function handleCreateCamp() {
    if (!campName.trim()) {
      alert("يرجى إدخال اسم المعسكر.");
      return;
    }

    setLoading(true);
    dbg("handleCreateCamp() start", { campName: campName.trim(), invitedFriends });

    try {
      // 1) userName
      const creatorUserName = await getUserNameOrRedirect();
      if (!creatorUserName) return;

      // 2) Participant only
      const participantRes = await sb(
        "Participant: check creator is participant",
        db.from("Participant").select("PuserName").eq("PuserName", creatorUserName).maybeSingle()
      );

      if (participantRes.error) {
        alert("تعذر التحقق من صلاحية الحساب. حاول مرة ثانية.");
        return;
      }
      if (!participantRes.data) {
        alert("إنشاء المعسكرات متاح لحسابات المشاركين فقط.");
        return;
      }

      // ✅ التحقق من الدعوات قبل إنشاء المعسكر
      const inviteValidation = await validateInvitedFriendsBeforeCreate(creatorUserName);
      if (!inviteValidation.ok) return;

      // 3) Single camp (temporary)
      const membershipRes = await sb(
        "CampParticipants: check existing membership",
        db
          .from("CampParticipants")
          .select("campId,joinedAt")
          .eq("pUserName", creatorUserName)
          .order("joinedAt", { ascending: true })
      );

      if (membershipRes.error) {
        alert("تعذر التحقق من حالة المعسكر. حاول مرة ثانية.");
        return;
      }

      const existingCampId = membershipRes.data?.[0]?.campId ?? null;
      dbg("Existing campId (if any)", { existingCampId, membershipRows: membershipRes.data });

      if (existingCampId) {
        alert("لديك معسكر مرتبط بحسابك بالفعل. سيتم نقلك إليه.");
        router.push(`/camp/${existingCampId}`);
        return;
      }

      // 4) Upload image optional
      let imageUrl = "";
      if (campImage) {
        try {
          imageUrl = await uploadCampImageViaApi(campImage);
        } catch (e) {
          dbgError("uploadCampImageViaApi failed - continue without image", e);
          alert("تعذر رفع صورة المعسكر. سيتم إنشاء المعسكر بدون صورة.");
          imageUrl = "";
        }
      }

      // 5) Insert Camp
      const campPayload = {
        name: campName.trim(),
        description: "",
        pic: imageUrl,
        creatorUser: creatorUserName,
      };

      const campInsertRes = await sb(
        "Camp: insert new camp",
        db.from("Camp").insert([campPayload]).select("id").single()
      );

      if (campInsertRes.error || !campInsertRes.data?.id) {
        dbgError("Camp insert FAILED", campInsertRes.error, campPayload);
        alert("حدثت مشكلة أثناء إنشاء المعسكر. شوفي الكونسول للتفاصيل.");
        return;
      }

      const newCampId = Number(campInsertRes.data.id);
      dbg("New camp created", { newCampId });

      // 6) Join creator
      const joinPayload = {
        campId: newCampId,
        pUserName: creatorUserName,
        joinedAt: new Date().toISOString(),
      };

      const joinRes = await sb(
        "CampParticipants: insert creator membership (IMPORTANT)",
        db.from("CampParticipants").insert([joinPayload])
      );

      if (joinRes.error) {
        dbgError("Creator join FAILED (look at code/details/hint)", joinRes.error, joinPayload);
        alert("تم إنشاء المعسكر ولكن تعذر إكمال العضوية. شوفي الكونسول للتفاصيل.");
        return;
      }

      // 7) Invite friends
      const finalInvites = invitedFriends
        .map(normalizeUserName)
        .filter(Boolean)
        .filter((u) => u.toLowerCase() !== creatorUserName.toLowerCase())
        .filter((u, idx, arr) => arr.findIndex((x) => x.toLowerCase() === u.toLowerCase()) === idx);

      dbg("Final invites after pre-validation", { finalInvites });

      if (finalInvites.length > 0) {
        const rows = finalInvites.map((u) => ({
          campId: newCampId,
          pUserName: u,
          joinedAt: new Date().toISOString(),
        }));

        const friendsInsertRes = await sb(
          "CampParticipants: insert invited friends",
          db.from("CampParticipants").insert(rows)
        );

        if (friendsInsertRes.error) {
          dbgError("Friends insert FAILED", friendsInsertRes.error, rows);
          alert("تم إنشاء المعسكر، لكن تعذر إضافة بعض الأعضاء. شوفي الكونسول للتفاصيل.");
        }
      }

      dbg("Route to camp", { newCampId });
      router.push(`/camp/${newCampId}`);
    } catch (e) {
      dbgError("handleCreateCamp() unexpected error", e);
      alert("حدث خطأ غير متوقع. شوفي الكونسول للتفاصيل.");
    } finally {
      setLoading(false);
      dbg("handleCreateCamp() end");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="w-[420px] rounded-[30px] border border-purple-500 p-8 shadow-lg backdrop-blur-xl bg-white/5">
        <input
          type="text"
          placeholder="اسم المعسكر..."
          value={campName}
          onChange={(e) => setCampName(e.target.value)}
          className="w-full mb-4 px-5 py-3 rounded-full bg-transparent border border-purple-500 outline-none"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCampImage(e.target.files?.[0] || null)}
          className="w-full mb-4"
        />

        {previewUrl && (
          <img
            src={previewUrl}
            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            alt="Camp image preview"
          />
        )}

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="اسم المستخدم (Participant فقط)..."
            value={friendUserName}
            onChange={(e) => setFriendUserName(e.target.value)}
            className="flex-1 px-5 py-3 rounded-full bg-transparent border border-purple-500 outline-none"
          />
          <button type="button" onClick={handleAddFriend} className="px-4 py-2 rounded-full bg-purple-600">
            +
          </button>
        </div>

        <ul className="mb-4 text-sm text-gray-300 space-y-1">
          {invitedFriends.map((friend) => (
            <li key={friend} className="flex items-center justify-between gap-2">
              <span>• {friend}</span>
              <button
                type="button"
                onClick={() => handleRemoveFriend(friend)}
                className="text-xs text-red-300 hover:text-red-200"
              >
                إزالة
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={handleCreateCamp}
          disabled={!canSubmit}
          className="w-full py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 font-bold disabled:opacity-60"
        >
          {loading ? "جاري إنشاء المعسكر..." : "إنشاء المعسكر"}
        </button>
      </div>
    </div>
  );
}
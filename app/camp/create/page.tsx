"use client";

/**
 * الملف: app/camp/create/page.tsx
 * الدور: صفحة إنشاء معسكر جديد للمشارك (Participant)
 * يرتبط بـ:
 * - Supabase DB Tables: Member, Admin, Participant, Camp, CampParticipants
 * - Next.js API Route لرفع الصورة: app/api/camp/upload/route.ts
 * - authService: للحصول على المستخدم الحالي (email) وتحديد إذا هو مسجل دخول
 * المخرجات النهائية:
 * - إنشاء سجل في Camp
 * - ربط المنشئ في CampParticipants
 * - (اختياري) إضافة أعضاء مدعوين في CampParticipants
 * - توجيه المستخدم إلى /camp/[id]
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

export default function CreateCampPage() {
  /**
   * الجزء: Router
   * الدور: التنقل بين صفحات المشروع بعد نجاح/فشل العمليات (مثل الانتقال للـ camp أو صفحة login)
   * يرتبط بـ:
   * - مسارات Next.js داخل app/...
   * المدخلات: لا يوجد
   * المخرجات: تنفيذ router.push أو router.replace للتوجيه
   */
  const router = useRouter();

  /**
   * الجزء: حالات النموذج (Form State)
   * الدور: تخزين قيم إدخال المستخدم داخل الواجهة
   * يرتبط بـ:
   * - عناصر الإدخال Input في JSX
   * المدخلات: إدخال المستخدم (اسم المعسكر/الصورة/أسماء المستخدمين المدعوين)
   * المخرجات: قيم تُستخدم في عمليات الإنشاء والرفع والإضافة
   */
  const [campName, setCampName] = useState("");
  const [campImage, setCampImage] = useState<File | null>(null);
  const [friendUserName, setFriendUserName] = useState("");
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * الجزء: إعدادات التحقق (Validation Settings)
   * الدور: قواعد بسيطة لرفع الجودة وتجربة المستخدم
   * يرتبط بـ:
   * - uploadCampImageViaApi (حجم ونوع الصورة)
   * - handleAddFriend (حد أقصى للدعوات)
   * المدخلات: لا يوجد
   * المخرجات: تفعيل قيود للتحقق
   */
  const MAX_INVITES = 20;
  const MAX_IMAGE_MB = 5;

  /**
   * الجزء: canSubmit
   * الدور: تحديد إمكانية الضغط على زر الإنشاء (لمنع إرسال نموذج ناقص أو أثناء التحميل)
   * يرتبط بـ:
   * - زر "إنشاء المعسكر" (disabled)
   * المدخلات: campName, loading
   * المخرجات: boolean
   */
  const canSubmit = useMemo(() => {
    return campName.trim().length > 0 && !loading;
  }, [campName, loading]);

  /**
   * الدالة: uploadCampImageViaApi
   * الدور: رفع صورة المعسكر عبر Backend API (بدل الرفع المباشر من المتصفح)
   * لماذا؟ لأن الرفع المباشر قد يتأثر بسياسات RLS على Storage.
   * يرتبط بـ:
   * - Route: app/api/camp/upload/route.ts (يستخدم service_role على السيرفر)
   * - Storage bucket: camp-images
   * المدخلات:
   * - file: ملف صورة من المستخدم (File)
   * المخرجات:
   * - publicUrl: رابط الصورة النهائي (string) لاستخدامه في حقل pic بجدول Camp
   */
  const uploadCampImageViaApi = async (file: File): Promise<string> => {
    // تحقق نوع الملف
    if (!file.type.startsWith("image/")) {
      throw new Error("يرجى اختيار ملف صورة صالح.");
    }

    // تحقق حجم الملف
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      throw new Error(`حجم الصورة كبير. الحد الأقصى ${MAX_IMAGE_MB}MB.`);
    }

    // تجهيز FormData لإرسال الملف إلى API
    const formData = new FormData();
    formData.append("file", file);

    // إرسال الملف إلى API Route
    const res = await fetch("/api/camp/upload", {
      method: "POST",
      body: formData,
    });

    // قراءة الرد
    const json = await res.json().catch(() => ({}));

    // إذا فشل الرد، نرجع رسالة مناسبة للمستخدم
    if (!res.ok) {
      throw new Error(json?.error || "تعذر رفع الصورة. يرجى المحاولة مرة أخرى.");
    }

    // التأكد من وجود رابط عام
    if (!json?.publicUrl) {
      throw new Error("تعذر الحصول على رابط الصورة. يرجى المحاولة مرة أخرى.");
    }

    return String(json.publicUrl);
  };

  /**
   * الدالة: handleAddFriend
   * الدور: إضافة اسم مستخدم إلى قائمة الدعوات
   * يرتبط بـ:
   * - حقل إدخال اسم المستخدم (friendUserName)
   * - قائمة invitedFriends
   * المدخلات:
   * - قيمة friendUserName (string)
   * المخرجات:
   * - تحديث invitedFriends بإضافة اسم جديد (إن لم يكن مكررًا)
   */
  const handleAddFriend = () => {
    const u = friendUserName.trim();
    if (!u) return;

    // منع تجاوز الحد الأعلى للدعوات
    if (invitedFriends.length >= MAX_INVITES) {
      alert(`تم الوصول للحد الأعلى من الدعوات (${MAX_INVITES}).`);
      return;
    }

    // منع التكرار
    const exists = invitedFriends.some((x) => x.toLowerCase() === u.toLowerCase());
    if (exists) {
      alert("هذا المستخدم موجود بالفعل ضمن قائمة الدعوات.");
      setFriendUserName("");
      return;
    }

    setInvitedFriends((prev) => [...prev, u]);
    setFriendUserName("");
  };

  /**
   * الدالة: handleRemoveFriend
   * الدور: إزالة اسم مستخدم من قائمة الدعوات
   * يرتبط بـ:
   * - قائمة invitedFriends (في واجهة المستخدم)
   * المدخلات:
   * - u: اسم المستخدم المراد إزالته
   * المخرجات:
   * - تحديث invitedFriends بعد الحذف
   */
  const handleRemoveFriend = (u: string) => {
    setInvitedFriends((prev) => prev.filter((x) => x !== u));
  };

  /**
   * الدالة: handleCreateCamp
   * الدور: تسلسل إنشاء المعسكر كاملًا (رفع صورة -> إنشاء Camp -> ربط المنشئ -> إضافة المدعوين)
   * يرتبط بـ:
   * - authService.getCurrentUser(): لتحديد المستخدم الحالي
   * - جدول Member: لجلب userName من email
   * - جدول Admin / Participant: للتحقق من الصلاحية
   * - جدول Camp: لإنشاء سجل المعسكر
   * - جدول CampParticipants: لربط العضوية
   * المدخلات:
   * - campName, campImage, invitedFriends
   * المخرجات:
   * - إنشاء معسكر وربطه -> توجيه إلى /camp/[id]
   */
  const handleCreateCamp = async () => {
    try {
      // منع إرسال اسم فاضي
      if (!campName.trim()) {
        alert("يرجى إدخال اسم المعسكر.");
        return;
      }

      setLoading(true);

      /**
       * 1) التحقق من تسجيل الدخول
       * المدخلات: لا يوجد (يعتمد على جلسة الدخول الحالية)
       * المخرجات: currentUser.email أو توجيه إلى /login
       */
      const currentUser = await authService.getCurrentUser();
      if (!currentUser?.email) {
        alert("يرجى تسجيل الدخول للمتابعة.");
        router.push("/login");
        return;
      }

      /**
       * 2) جلب userName من جدول Member باستخدام email
       * المدخلات: currentUser.email
       * المخرجات: creatorUserName (string)
       */
      const { data: memberData, error: memberError } = await supabase
        .from("Member")
        .select("userName")
        .eq("email", currentUser.email)
        .single();

      if (memberError || !memberData?.userName) {
        console.error("Member fetch error:", memberError);
        alert("تعذر تحميل بيانات حسابك. يرجى المحاولة مرة أخرى.");
        return;
      }

      const creatorUserName = String(memberData.userName);

      /**
       * 3) تحقق الصلاحية:
       * - Admin ممنوع من إنشاء معسكر
       * - Participant مسموح
       * المدخلات: creatorUserName
       * المخرجات: السماح بالمتابعة أو منع العملية برسالة مناسبة
       */
      const [adminCheck, participantCheck] = await Promise.all([
        supabase.from("Admin").select("AuserName").eq("AuserName", creatorUserName).maybeSingle(),
        supabase
          .from("Participant")
          .select("PuserName")
          .eq("PuserName", creatorUserName)
          .maybeSingle(),
      ]);

      if (adminCheck.data) {
        alert("لا يمكن إنشاء معسكر باستخدام هذا النوع من الحسابات.");
        return;
      }

      if (!participantCheck.data) {
        alert("إنشاء المعسكرات متاح لحسابات المشاركين فقط.");
        return;
      }

      /**
       * 4) منع إنشاء أكثر من معسكر لنفس المستخدم (حسب شرطكم)
       * الفكرة: إذا كان المستخدم مرتبط بأي CampParticipants -> نوجهه لمعسكره الحالي
       * المدخلات: creatorUserName
       * المخرجات: إما توجيه إلى /camp/[id] أو السماح بإنشاء جديد
       */
          const { data: existingMembership, error: membershipErr } = await supabase
      .from("CampParticipants")
      .select("campId")
      .eq("pUserName", creatorUserName)
      .order("joinedAt", { ascending: false })
      .limit(1)
      .maybeSingle();

      if (membershipErr) {
        console.error("Membership check error:", membershipErr);
        alert("تعذر التحقق من حالة المعسكر. يرجى المحاولة مرة أخرى.");
        return;
      }

      if (existingMembership?.campId) {
        alert("لديك معسكر مرتبط بحسابك بالفعل. سيتم نقلك إليه.");
        router.push(`/camp/${existingMembership.campId}`);
        return;
      }

      /**
       * 5) رفع صورة المعسكر (اختياري)
       * - إذا فشل الرفع: نكمل بدون صورة حتى لا تتعطل تجربة المستخدم
       * المدخلات: campImage
       * المخرجات: imageUrl (string) أو ""
       */
      let imageUrl = "";
      if (campImage) {
        try {
          imageUrl = await uploadCampImageViaApi(campImage);
        } catch (e: any) {
          console.error("Upload API error:", e);
          alert("تعذر رفع صورة المعسكر. يمكنك المتابعة بدون صورة أو المحاولة لاحقًا.");
          imageUrl = "";
        }
      }

      /**
       * 6) إنشاء المعسكر في جدول Camp
       * المدخلات:
       * - name, description, pic, creatorUser
       * المخرجات:
       * - newCampId (id للمعسكر الجديد)
       */
      const { data: campInsertData, error: campInsertError } = await supabase
        .from("Camp")
        .insert([
          {
            name: campName.trim(),
            description: "",
            pic: imageUrl,
            creatorUser: creatorUserName,
          },
        ])
        .select()
        .single();

      if (campInsertError || !campInsertData?.id) {
        console.error("Camp insert error:", campInsertError);
        alert("حدثت مشكلة أثناء إنشاء المعسكر. يرجى المحاولة مرة أخرى.");
        return;
      }

      const newCampId = campInsertData.id;

      /**
       * 7) ربط صاحب المعسكر تلقائيًا في CampParticipants
       * المدخلات:
       * - campId: newCampId
       * - pUserName: creatorUserName
       * - joinedAt: تاريخ الانضمام
       * المخرجات:
       * - ضمان أن صاحب المعسكر يعتبر "عضو" ويستطيع دخول /camp/[id]
       */
      const { error: creatorJoinError } = await supabase.from("CampParticipants").insert([
        {
          campId: newCampId,
          pUserName: creatorUserName,
          joinedAt: new Date().toISOString(),
        },
      ]);

      if (creatorJoinError) {
        console.error("Creator join error:", creatorJoinError);
        alert("تم إنشاء المعسكر، ولكن تعذر إكمال إعداداته. يرجى المحاولة مرة أخرى.");
        return;
      }

      /**
       * 8) التحقق من وجود أسماء المستخدمين المدعوين في جدول Member
       * الهدف: تجاهل الأسماء غير الموجودة بدل فشل إدخال المشاركين
       * المدخلات: invitedFriends
       * المخرجات: validInvites (قائمة أسماء موجودة فقط)
       */
      let validInvites: string[] = [];
      if (invitedFriends.length > 0) {
        const normalized = invitedFriends
          .map((u) => u.trim())
          .filter(Boolean)
          .filter((u) => u.toLowerCase() !== creatorUserName.toLowerCase());

        if (normalized.length > 0) {
          const { data: existingMembers, error: checkErr } = await supabase
            .from("Member")
            .select("userName")
            .in("userName", normalized);

          if (checkErr) {
            console.error("Invites check error:", checkErr);
            validInvites = [];
          } else {
            const existingSet = new Set((existingMembers || []).map((m: any) => String(m.userName)));
            const invalid = normalized.filter((u) => !existingSet.has(u));

            if (invalid.length > 0) {
              alert("بعض أسماء المستخدمين غير موجودة، لذلك لم تتم إضافتهم إلى المعسكر.");
            }

            validInvites = normalized.filter((u) => existingSet.has(u));
          }
        }
      }

      /**
       * 9) إضافة الأصدقاء إلى CampParticipants (اختياري)
       * المدخلات:
       * - validInvites
       * المخرجات:
       * - إضافة العضويات، أو رسالة لطيفة في حال تعذر إضافة البعض
       */
      if (validInvites.length > 0) {
        const friendsToInsert = validInvites.map((u) => ({
          campId: newCampId,
          pUserName: u,
          joinedAt: new Date().toISOString(),
        }));

        const { error: friendsInsertError } = await supabase
          .from("CampParticipants")
          .insert(friendsToInsert);

        if (friendsInsertError) {
          console.error("Friends insert error:", friendsInsertError);
          alert("تم إنشاء المعسكر بنجاح، ولكن تعذر إضافة بعض الأعضاء. يمكنك إضافتهم لاحقًا.");
        }
      }

      /**
       * 10) الانتقال إلى صفحة المعسكر
       * يرتبط بـ:
       * - app/camp/[id]/page.tsx (صفحة عرض المعسكر)
       * المدخلات: newCampId
       * المخرجات: توجيه المستخدم إلى /camp/[id]
       */
      router.push(`/camp/${newCampId}`);
    } catch (err: any) {
      console.error("Unexpected error:", err);
      alert("حدثت مشكلة غير متوقعة. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * JSX UI
   * الدور: واجهة إدخال بيانات المعسكر + الدعوات + زر الإنشاء
   * يرتبط بـ:
   * - states: campName, campImage, invitedFriends
   * - handlers: handleAddFriend, handleRemoveFriend, handleCreateCamp
   */
  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="w-[420px] rounded-[30px] border border-purple-500 p-8 shadow-lg backdrop-blur-xl bg-white/5">
        {/* إدخال اسم المعسكر */}
        <input
          type="text"
          placeholder="اسم المعسكر..."
          value={campName}
          onChange={(e) => setCampName(e.target.value)}
          className="w-full mb-4 px-5 py-3 rounded-full bg-transparent border border-purple-500 outline-none"
        />

        {/* اختيار صورة المعسكر (اختياري) */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCampImage(e.target.files?.[0] || null)}
          className="w-full mb-4"
        />

        {/* معاينة الصورة المختارة */}
        {campImage && (
          <img
            src={URL.createObjectURL(campImage)}
            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            alt="Camp image preview"
          />
        )}

        {/* إدخال اسم مستخدم لدعوته */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="اسم المستخدم..."
            value={friendUserName}
            onChange={(e) => setFriendUserName(e.target.value)}
            className="flex-1 px-5 py-3 rounded-full bg-transparent border border-purple-500 outline-none"
          />
          <button
            type="button"
            onClick={handleAddFriend}
            className="px-4 py-2 rounded-full bg-purple-600"
          >
            +
          </button>
        </div>

        {/* عرض قائمة الدعوات */}
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

        {/* زر تنفيذ إنشاء المعسكر */}
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
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

const db: any = supabase;

type CampRow = {
  id: number;
  name: string;
  description: string;
  pic?: string | null;
  creatorUser: string;
};

type CampParticipantRow = {
  campId: number;
  pUserName: string;
  profilePic?: string | null;
};

type MessageRow = {
  id: number;
  campId: number;
  senderUser: string;
  body: string;
  createdAt: string;
  replyToMessageId?: number | null;
  senderProfilePic?: string | null;
};

type DialogVariant = "info" | "success" | "error" | "confirm";

type SystemDialogState = {
  isOpen: boolean;
  title: string;
  message: string;
  variant: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
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

async function sb<T>(
  label: string,
  query: Promise<{ data: T; error: any }>
): Promise<{ data: T; error: any }> {
  dbg(`${label} (start)`);
  const res = await query;
  if (res.error) dbgError(label, res.error);
  else dbg(`${label} (ok)`, res.data);
  return res;
}

function getDialogStyles(variant: DialogVariant) {
  switch (variant) {
    case "success":
      return {
        badge: "bg-green-500/15 text-green-200 border-green-400/30",
        button: "bg-green-600 hover:bg-green-500",
      };
    case "error":
      return {
        badge: "bg-red-500/15 text-red-200 border-red-400/30",
        button: "bg-red-600 hover:bg-red-500",
      };
    case "confirm":
      return {
        badge: "bg-amber-500/15 text-amber-200 border-amber-400/30",
        button: "bg-purple-600 hover:bg-purple-500",
      };
    default:
      return {
        badge: "bg-purple-500/15 text-purple-200 border-purple-400/30",
        button: "bg-purple-600 hover:bg-purple-500",
      };
  }
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

  // تعديل بيانات المعسكر
  const [isEditingCampInfo, setIsEditingCampInfo] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [isSavingCampInfo, setIsSavingCampInfo] = useState(false);
  const [selectedCampImageFile, setSelectedCampImageFile] = useState<File | null>(null);
  const [campImagePreview, setCampImagePreview] = useState("");

  // نافذة النظام بدل alert / confirm
  const [systemDialog, setSystemDialog] = useState<SystemDialogState>({
    isOpen: false,
    title: "",
    message: "",
    variant: "info",
    confirmText: "حسنًا",
    cancelText: "إلغاء",
    isLoading: false,
  });

  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  const messagesById = useMemo(() => {
    const m = new Map<number, MessageRow>();
    for (const msg of messages) m.set(msg.id, msg);
    return m;
  }, [messages]);

  const isOwner = useMemo(() => {
    return Boolean(camp?.creatorUser && currentUserName && camp.creatorUser === currentUserName);
  }, [camp, currentUserName]);

  useEffect(() => {
    setEditedDescription(camp?.description || "");
  }, [camp?.description]);

  useEffect(() => {
    setCampImagePreview(camp?.pic || "");
    setSelectedCampImageFile(null);
  }, [camp?.pic]);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  function openInfoDialog(
    title: string,
    message: string,
    variant: Exclude<DialogVariant, "confirm"> = "info"
  ) {
    setSystemDialog({
      isOpen: true,
      title,
      message,
      variant,
      confirmText: "حسنًا",
      cancelText: "إلغاء",
      isLoading: false,
    });
  }

  function closeDialog() {
    setSystemDialog((prev) => ({
      ...prev,
      isOpen: false,
      onConfirm: undefined,
      onCancel: undefined,
      isLoading: false,
    }));
  }

  function openConfirmDialog(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setSystemDialog({
        isOpen: true,
        title,
        message,
        variant: "confirm",
        confirmText: "تأكيد",
        cancelText: "إلغاء",
        isLoading: false,
      });
    });
  }

  function resolveConfirm(value: boolean) {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(value);
      confirmResolverRef.current = null;
    }
    closeDialog();
  }

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
      db
        .from("CampParticipants")
        .select("campId,pUserName")
        .eq("campId", cId)
        .eq("pUserName", userName)
        .maybeSingle()
    );

    if (membershipError || !membership) {
      dbg("Not member -> redirect /camp", { cId, userName });
      openInfoDialog("غير مسموح", "لا تملك صلاحية الوصول إلى هذا المعسكر.", "error");
      router.push("/camp");
      return false;
    }

    dbg("Membership OK", membership);
    return true;
  }

  async function enrichMembersWithProfilePictures(
    rawMembers: Array<{ campId: number; pUserName: string }>
  ): Promise<CampParticipantRow[]> {
    if (!rawMembers.length) return [];

    const usernames = rawMembers.map((m) => m.pUserName);

    const { data: profiles, error: profilesError } = await sb(
      "Profile: fetch profile pictures for members",
      db.from("Profile").select("pruserName,profilePic").in("pruserName", usernames)
    );

    if (profilesError) {
      return rawMembers.map((m) => ({
        campId: m.campId,
        pUserName: m.pUserName,
        profilePic: null,
      }));
    }

    const profileMap = new Map<string, string | null>();
    for (const p of (profiles as any[]) || []) {
      profileMap.set(p.pruserName, p.profilePic || null);
    }

    return rawMembers.map((m) => ({
      campId: m.campId,
      pUserName: m.pUserName,
      profilePic: profileMap.get(m.pUserName) || null,
    }));
  }

  async function enrichMessagesWithSenderPictures(
    rawMessages: MessageRow[]
  ): Promise<MessageRow[]> {
    if (!rawMessages.length) return [];

    const usernames = Array.from(new Set(rawMessages.map((m) => m.senderUser)));

    const { data: profiles, error: profilesError } = await sb(
      "Profile: fetch sender pictures for messages",
      db.from("Profile").select("pruserName,profilePic").in("pruserName", usernames)
    );

    if (profilesError) {
      return rawMessages.map((msg) => ({
        ...msg,
        senderProfilePic: null,
      }));
    }

    const profileMap = new Map<string, string | null>();
    for (const p of (profiles as any[]) || []) {
      profileMap.set(p.pruserName, p.profilePic || null);
    }

    return rawMessages.map((msg) => ({
      ...msg,
      senderProfilePic: profileMap.get(msg.senderUser) || null,
    }));
  }

  async function refreshMembers(targetCampId: number) {
    const { data: membersData } = await sb(
      "CampParticipants: refresh members",
      db.from("CampParticipants").select("campId,pUserName").eq("campId", targetCampId)
    );

    const rawMembers: Array<{ campId: number; pUserName: string }> =
      (membersData ?? []) as Array<{ campId: number; pUserName: string }>;

    const enrichedMembers = await enrichMembersWithProfilePictures(rawMembers);

    setMembers(enrichedMembers);
  }

  function handleChooseCampImage(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      openInfoDialog("ملف غير صالح", "الملف المختار ليس صورة.", "error");
      return;
    }

    const maxSizeInMb = 5;
    if (file.size > maxSizeInMb * 1024 * 1024) {
      openInfoDialog("حجم كبير", "حجم الصورة كبير. الحد الأقصى 5MB.", "error");
      return;
    }

    setSelectedCampImageFile(file);

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = previewUrl;
    setCampImagePreview(previewUrl);
  }

  async function uploadCampImage(file: File, targetCampId: number) {
    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `camp-${targetCampId}-${Date.now()}.${fileExt}`;
    const filePath = `camp-covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("camp-images")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      dbgError("uploadCampImage() upload failed", uploadError);
      throw new Error("UPLOAD_FAILED");
    }

    const { data } = supabase.storage.from("camp-images").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleSaveCampInfo() {
    if (!campId || !isOwner || !camp) return;

    setIsSavingCampInfo(true);
    dbg("handleSaveCampInfo() start", {
      campId,
      editedDescription,
      hasNewImage: Boolean(selectedCampImageFile),
    });

    try {
      const updates: Record<string, any> = {
        description: editedDescription.trim(),
      };

      if (selectedCampImageFile) {
        const uploadedImageUrl = await uploadCampImage(selectedCampImageFile, campId);
        updates.pic = uploadedImageUrl;
      }

      const { error } = await sb(
        "Camp: update camp info",
        db.from("Camp").update(updates).eq("id", campId)
      );

      if (error) {
        openInfoDialog("تعذر الحفظ", "تعذر حفظ بيانات المعسكر.", "error");
        return;
      }

      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }

      setCamp((prev) =>
        prev
          ? {
              ...prev,
              description: updates.description,
              pic: updates.pic ?? prev.pic,
            }
          : prev
      );

      setIsEditingCampInfo(false);
      setSelectedCampImageFile(null);
      openInfoDialog("تم الحفظ", "تم تحديث بيانات المعسكر بنجاح.", "success");
    } catch (e) {
      dbgError("handleSaveCampInfo() unexpected error", e);
      openInfoDialog("خطأ", "حدثت مشكلة أثناء حفظ بيانات المعسكر.", "error");
    } finally {
      setIsSavingCampInfo(false);
    }
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

        const allowed = await assertMembershipOrRedirect(campId, userName);
        if (!allowed) return;

        const { data: campData, error: campError } = await sb(
          "Camp: fetch camp row",
          db.from("Camp").select("id,name,description,pic,creatorUser").eq("id", campId).single()
        );

        if (campError || !campData) {
          openInfoDialog("تعذر التحميل", "تعذر تحميل بيانات المعسكر.", "error");
          router.push("/camp");
          return;
        }

        const { data: membersData } = await sb(
          "CampParticipants: fetch members",
          db.from("CampParticipants").select("campId,pUserName").eq("campId", campId)
        );

        const rawMembers: Array<{ campId: number; pUserName: string }> =
          (membersData ?? []) as Array<{ campId: number; pUserName: string }>;
        const enrichedMembers = await enrichMembersWithProfilePictures(rawMembers);

        const { data: messagesData } = await sb(
          "Messages: fetch messages",
          db.from("Messages").select("*").eq("campId", campId).order("createdAt", { ascending: true })
        );

        const enrichedMessages = await enrichMessagesWithSenderPictures(
          ((messagesData ?? []) as MessageRow[])
        );

        if (!alive) return;

        setCamp(campData as CampRow);
        setMembers(enrichedMembers);
        setMessages(enrichedMessages);

        dbg("CampPage state updated", {
          campLoaded: Boolean(campData),
          membersCount: enrichedMembers.length,
          messagesCount: enrichedMessages.length,
        });
      } catch (e) {
        dbgError("CampPage fetchData() unexpected error", e);
        openInfoDialog("خطأ", "حدثت مشكلة أثناء تحميل المعسكر.", "error");
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
        async (payload) => {
          dbg("Realtime INSERT payload", payload?.new);
          const row = payload.new as MessageRow;

          const { data: profileData } = await sb(
            "Profile: fetch sender picture for realtime message",
            db.from("Profile").select("pruserName,profilePic").eq("pruserName", row.senderUser).maybeSingle()
          );

          const enrichedRow: MessageRow = {
            ...row,
            senderProfilePic: (profileData as any)?.profilePic || null,
          };

          setMessages((prev) => {
            if (prev.some((x) => x.id === enrichedRow.id)) {
              dbg("Realtime duplicate ignored", { id: enrichedRow.id });
              return prev;
            }
            return [...prev, enrichedRow];
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

    dbg("handleSendMessage() start", {
      campId,
      bodyLen: body.length,
      replyToId: replyTo?.id ?? null,
    });

    try {
      const senderUser = await getUserNameOrRedirect();
      if (!senderUser) return;

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
        openInfoDialog("تعذر الإرسال", "تعذر إرسال الرسالة.", "error");
        return;
      }

      setNewMessage("");
      setReplyTo(null);

      if (messageInputRef.current) {
        messageInputRef.current.style.height = "auto";
      }
    } catch (e) {
      dbgError("handleSendMessage() unexpected error", e);
      openInfoDialog("خطأ", "تعذر إرسال الرسالة.", "error");
    }
  }

  async function handleAddParticipant() {
    if (!campId || !camp || !currentUserName) return;

    const targetUserName = newParticipantUserName.trim();
    if (!targetUserName) {
      openInfoDialog("بيانات ناقصة", "اكتبي اسم المستخدم أولًا.", "error");
      return;
    }

    if (!isOwner) {
      openInfoDialog("غير مسموح", "فقط مالك المعسكر يمكنه إضافة المشاركين.", "error");
      return;
    }

    setIsAddingParticipant(true);
    dbg("handleAddParticipant() start", { campId, targetUserName, currentUserName });

    try {
      if (targetUserName.toLowerCase() === currentUserName.toLowerCase()) {
        openInfoDialog("تنبيه", "أنتِ موجودة أصلًا داخل المعسكر.", "info");
        return;
      }

      const { data: participantRow, error: participantError } = await sb(
        "Participant: validate target user exists",
        db.from("Participant").select("PuserName").eq("PuserName", targetUserName).maybeSingle()
      );

      if (participantError) {
        openInfoDialog("تعذر التحقق", "تعذر التحقق من المستخدم.", "error");
        return;
      }

      if (!participantRow) {
        openInfoDialog("غير موجود", "هذا المستخدم غير موجود ضمن حسابات المشاركين.", "error");
        return;
      }

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
        openInfoDialog("تعذر التحقق", "تعذر التحقق من عضوية المستخدم داخل هذا المعسكر.", "error");
        return;
      }

      if (existingInThisCamp) {
        openInfoDialog("موجود مسبقًا", "هذا المستخدم موجود بالفعل في المعسكر.", "info");
        return;
      }

      const { data: existingMembershipRows, error: existingMembershipError } = await sb(
        "CampParticipants: check target user has another camp",
        db.from("CampParticipants").select("campId,pUserName").eq("pUserName", targetUserName)
      );

      if (existingMembershipError) {
        openInfoDialog("تعذر التحقق", "تعذر التحقق من معسكرات المستخدم.", "error");
        return;
      }

      const alreadyHasCamp =
        Array.isArray(existingMembershipRows) && existingMembershipRows.length > 0;

      if (alreadyHasCamp) {
        openInfoDialog("غير ممكن", "هذا المستخدم لديه معسكر بالفعل ولا يمكن إضافته.", "error");
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
        openInfoDialog("تعذر الإضافة", "تعذر إضافة المشارك.", "error");
        return;
      }

      setNewParticipantUserName("");
      await refreshMembers(campId);
      setIsMembersOpen(true);
      openInfoDialog("تمت الإضافة", "تمت إضافة المشارك بنجاح.", "success");
    } catch (e) {
      dbgError("handleAddParticipant() unexpected error", e);
      openInfoDialog("خطأ", "حدثت مشكلة أثناء إضافة المشارك.", "error");
    } finally {
      setIsAddingParticipant(false);
    }
  }

  async function handleLeaveCamp() {
    if (!campId || !currentUserName) return;

    const confirmed = await openConfirmDialog(
      "تأكيد المغادرة",
      isOwner
        ? "هل أنتِ متأكدة من مغادرة المعسكر؟ إذا بقي أعضاء فسيتم نقل الملكية، وإذا كنتِ آخر عضو فسيتم حذف المعسكر بالكامل."
        : "هل أنتِ متأكدة من مغادرة المعسكر؟"
    );

    if (!confirmed) return;

    setIsLeavingCamp(true);
    dbg("handleLeaveCamp() start", { campId, currentUserName, isOwner });

    try {
      // حذف العضو الخارج من CampParticipants مباشرة
      const { error: deleteMembershipError } = await sb(
        "CampParticipants: delete current user membership",
        db.from("CampParticipants").delete().eq("campId", campId).eq("pUserName", currentUserName)
      );

      if (deleteMembershipError) {
        openInfoDialog("تعذر المغادرة", "تعذر مغادرة المعسكر.", "error");
        return;
      }

      // تحديث القائمة فورًا محليًا
      setMembers((prev) => prev.filter((m) => m.pUserName !== currentUserName));

      const { data: remainingMembersData, error: remainingMembersError } = await sb(
        "CampParticipants: fetch remaining members after leave",
        db.from("CampParticipants").select("campId,pUserName").eq("campId", campId)
      );

      if (remainingMembersError) {
        openInfoDialog("تنبيه", "تمت المغادرة لكن تعذر التحقق من حالة المعسكر.", "error");
        router.push("/camp");
        return;
      }

      const remainingRaw: Array<{ campId: number; pUserName: string }> =
        (remainingMembersData ?? []) as Array<{ campId: number; pUserName: string }>;

      if (remainingRaw.length === 0) {
        const { error: deleteMessagesError } = await sb(
          "Messages: delete all camp messages",
          db.from("Messages").delete().eq("campId", campId)
        );

        if (deleteMessagesError) {
          openInfoDialog("تنبيه", "تمت المغادرة لكن تعذر حذف رسائل المعسكر.", "error");
          router.push("/camp");
          return;
        }

        const { error: cleanupParticipantsError } = await sb(
          "CampParticipants: cleanup remaining rows",
          db.from("CampParticipants").delete().eq("campId", campId)
        );

        if (cleanupParticipantsError) {
          openInfoDialog("تنبيه", "تمت المغادرة لكن تعذر تنظيف أعضاء المعسكر.", "error");
          router.push("/camp");
          return;
        }

        const { error: deleteCampError } = await sb(
          "Camp: delete empty camp",
          db.from("Camp").delete().eq("id", campId)
        );

        if (deleteCampError) {
          openInfoDialog("تنبيه", "تمت المغادرة لكن تعذر حذف المعسكر الفارغ.", "error");
          router.push("/camp");
          return;
        }

        openInfoDialog(
          "تمت المغادرة",
          "تمت مغادرة المعسكر، وبما أنه لم يبق أي عضو فقد تم حذف المعسكر.",
          "success"
        );
        router.push("/camp");
        return;
      }

      if (isOwner) {
        const newOwner = remainingRaw[0]?.pUserName ?? null;

        if (newOwner) {
          const { error: updateOwnerError } = await sb(
            "Camp: transfer ownership to remaining member",
            db.from("Camp").update({ creatorUser: newOwner }).eq("id", campId)
          );

          if (updateOwnerError) {
            openInfoDialog("تنبيه", "تمت المغادرة لكن تعذر نقل ملكية المعسكر.", "error");
            router.push("/camp");
            return;
          }
        }
      }

      openInfoDialog("تمت المغادرة", "تمت مغادرة المعسكر بنجاح.", "success");
      router.push("/camp");
    } catch (e) {
      dbgError("handleLeaveCamp() unexpected error", e);
      openInfoDialog("خطأ", "حدثت مشكلة أثناء مغادرة المعسكر.", "error");
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

  const dialogStyles = getDialogStyles(systemDialog.variant);

  return (
    <div dir="rtl" className="min-h-screen bg-[#0a0614] text-white">
      <div className="px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 sm:gap-5">
          {/* Header */}
          <div className="relative overflow-hidden rounded-[24px] border border-purple-500/30 bg-[#081126] px-4 py-5 sm:rounded-[28px] sm:px-5 sm:py-6 md:px-8 md:py-8">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute right-4 top-4 h-24 w-24 rounded-full bg-fuchsia-500/10 blur-3xl sm:right-10 sm:top-8 sm:h-36 sm:w-36" />
              <div className="absolute bottom-0 left-4 h-28 w-28 rounded-full bg-green-400/10 blur-3xl sm:left-10 sm:h-40 sm:w-40" />
            </div>

            <div className="relative z-10 mb-5 flex flex-wrap items-center justify-between gap-3">
              {currentUserName && (
                <button
                  type="button"
                  onClick={handleLeaveCamp}
                  disabled={isLeavingCamp}
                  className="w-[120px] py-1 border border-[#FF27F0] text-white rounded-full font-bold text-sm font-['Cairo']"
                >
                  {isLeavingCamp ? "جاري المغادرة..." : "مغادرة"}
                </button>
              )}

              <button
                type="button"
                onClick={() => router.back()}
                className="text-xs text-green-300 transition hover:text-green-200 sm:text-sm"
              >
                السابق
              </button>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative mb-4">
                {campImagePreview || camp?.pic ? (
                  <img
                    src={campImagePreview || camp?.pic || ""}
                    alt={camp?.name || "camp"}
                    className="h-20 w-20 rounded-full border border-purple-400/50 object-cover shadow-[0_0_25px_rgba(168,85,247,0.22)] sm:h-24 sm:w-24 md:h-28 md:w-28"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-purple-400/40 bg-[#140d25] text-xl font-bold text-purple-200 shadow-[0_0_25px_rgba(168,85,247,0.18)] sm:h-24 sm:w-24 md:h-28 md:w-28 md:text-2xl">
                    {camp?.name?.charAt(0) || "م"}
                  </div>
                )}

                {isOwner && isEditingCampInfo && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-purple-300/40 bg-[#1e1236] px-3 py-1.5 text-[11px] text-purple-100 shadow-[0_0_18px_rgba(168,85,247,0.20)] transition hover:bg-[#2a184a] sm:text-xs"
                  >
                    تغيير الصورة
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleChooseCampImage(e.target.files?.[0] || null)}
                />
              </div>

              <div className="flex max-w-full items-center justify-center gap-2">
                <h1 className="break-words text-xl font-bold text-white sm:text-2xl md:text-4xl">
                  {camp?.name}
                </h1>

                {isOwner && !isEditingCampInfo && (
                  <button
                    type="button"
                    onClick={() => setIsEditingCampInfo(true)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-purple-400/40 bg-white/5 transition hover:bg-white/10 sm:h-10 sm:w-10"
                    title="تعديل بيانات المعسكر"
                  >
                    <img
                      src="/images/icons/edit-icon3.png"
                      alt="edit"
                      className="h-5 w-5 object-contain sm:h-6 sm:w-6"
                    />
                  </button>
                )}
              </div>

              {!isEditingCampInfo &&
                (!!camp?.description ? (
                  <p className="mt-3 max-w-3xl px-2 text-sm leading-7 text-gray-300 sm:text-base">
                    {camp.description}
                  </p>
                ) : (
                  <p className="mt-3 max-w-3xl px-2 text-sm leading-7 text-gray-400 sm:text-base">
                    لا يوجد وصف للمعسكر حاليًا.
                  </p>
                ))}

              {isEditingCampInfo && isOwner && (
                <div className="mt-5 w-full max-w-2xl rounded-3xl border border-purple-500/30 bg-[#10091d]/80 p-3 text-right shadow-[0_0_30px_rgba(168,85,247,0.10)] backdrop-blur-sm sm:p-4">
                  <div className="mb-3 text-sm font-semibold text-purple-100">
                    تعديل بيانات المعسكر
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-sm text-gray-300">
                      وصف المعسكر
                    </label>
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      rows={4}
                      placeholder="اكتب وصف المعسكر هنا..."
                      className="w-full resize-none rounded-2xl border border-purple-500/40 bg-[#120b22] px-4 py-3 text-right text-sm text-white outline-none placeholder:text-gray-400"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap justify-start gap-2">
                    <button
                      type="button"
                      onClick={handleSaveCampInfo}
                      disabled={isSavingCampInfo}
                      className="rounded-2xl bg-purple-600 px-4 py-2 text-sm text-white transition hover:bg-purple-500 disabled:opacity-60"
                    >
                      {isSavingCampInfo ? "جاري الحفظ..." : "حفظ التعديلات"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (previewObjectUrlRef.current) {
                          URL.revokeObjectURL(previewObjectUrlRef.current);
                          previewObjectUrlRef.current = null;
                        }
                        setEditedDescription(camp?.description || "");
                        setCampImagePreview(camp?.pic || "");
                        setSelectedCampImageFile(null);
                        setIsEditingCampInfo(false);
                      }}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/10"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Members accordion */}
          <div className="overflow-hidden rounded-[22px] border border-purple-500/40 bg-white/5">
            <button
              type="button"
              onClick={() => setIsMembersOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-right transition hover:bg-white/5 sm:px-5"
            >
              <div className="text-right">
                <div className="text-sm font-semibold sm:text-base md:text-lg">أعضاء المعسكر</div>
                <div className="text-xs text-gray-400 sm:text-sm">{members.length} عضو</div>
              </div>
              <span className="shrink-0 text-xs text-purple-200 sm:text-sm">
                {isMembersOpen ? "إخفاء" : "إظهار"}
              </span>
            </button>

            {isMembersOpen && (
              <div className="border-t border-white/10 px-4 py-3 sm:px-5">
                {isOwner && (
                  <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-3 text-right text-sm font-medium text-purple-100">
                      إضافة مشارك جديد
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      <button
                        type="button"
                        onClick={handleAddParticipant}
                        disabled={isAddingParticipant}
                        className="rounded-2xl bg-purple-600 px-4 py-3 text-sm font-medium transition hover:bg-purple-500 disabled:opacity-60 md:order-1"
                      >
                        {isAddingParticipant ? "جاري الإضافة..." : "إضافة"}
                      </button>

                      <input
                        type="text"
                        value={newParticipantUserName}
                        onChange={(e) => setNewParticipantUserName(e.target.value)}
                        placeholder="اسم المستخدم للمشارك..."
                        className="flex-1 rounded-2xl border border-purple-500/40 bg-[#120b22] px-4 py-3 text-right text-sm outline-none placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                )}

                {members.length === 0 ? (
                  <p className="text-right text-sm text-gray-400">لا يوجد أعضاء حاليًا.</p>
                ) : (
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {members.map((m) => {
                      const memberIsOwner = camp?.creatorUser === m.pUserName;

                      return (
                        <li
                          key={m.pUserName}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {m.profilePic ? (
                              <img
                                src={m.profilePic}
                                alt={m.pUserName}
                                className="h-11 w-11 shrink-0 rounded-full border border-purple-400/40 object-cover sm:h-12 sm:w-12"
                              />
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-purple-400/40 bg-[#1a1230] text-sm font-bold text-purple-200 sm:h-12 sm:w-12">
                                {m.pUserName?.charAt(0)?.toUpperCase() || "م"}
                              </div>
                            )}

                            <div className="min-w-0 text-right">
                              <div className="truncate text-sm text-purple-100 sm:text-[15px]">
                                {m.pUserName}
                              </div>
                              {memberIsOwner && (
                                <div className="mt-1 text-[11px] text-pink-200 sm:text-xs">
                                  قائد المعسكر
                                </div>
                              )}
                            </div>
                          </div>

                          {memberIsOwner && (
                            <span className="shrink-0 rounded-full border border-pink-400/40 bg-pink-500/10 px-2 py-1 text-[10px] text-pink-200 sm:text-xs">
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

          {/* Chat messages */}
          <div className="relative pb-[165px] sm:pb-[180px] md:pb-[200px]">
            {messages.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center text-sm text-gray-400 sm:min-h-[420px]">
                لا توجد رسائل بعد.
              </div>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {messages.map((msg, index) => {
                  const replied = msg.replyToMessageId
                    ? messagesById.get(msg.replyToMessageId)
                    : null;

                  const isMine = currentUserName === msg.senderUser;

                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

                  const isSameSenderAsPrev = prevMsg?.senderUser === msg.senderUser;
                  const isSameSenderAsNext = nextMsg?.senderUser === msg.senderUser;

                  const showAvatar = !isSameSenderAsNext;

                  return (
                    <div
                      key={msg.id}
                      className={`flex w-full ${isMine ? "justify-start" : "justify-end"} ${
                        isSameSenderAsPrev ? "mt-1" : "mt-3"
                      }`}
                    >
                      <div
                        className={`flex max-w-[94%] items-end gap-2 sm:max-w-[80%] lg:max-w-[66%] ${
                          isMine ? "flex-row" : "flex-row-reverse"
                        }`}
                      >
                        <div className="w-9 shrink-0 sm:w-10">
                          {showAvatar ? (
                            msg.senderProfilePic ? (
                              <img
                                src={msg.senderProfilePic}
                                alt={msg.senderUser}
                                className="h-9 w-9 rounded-full border border-purple-400/40 object-cover sm:h-10 sm:w-10"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-purple-400/40 bg-[#1a1230] text-xs font-bold text-purple-200 sm:h-10 sm:w-10">
                                {msg.senderUser?.charAt(0)?.toUpperCase() || "م"}
                              </div>
                            )
                          ) : null}
                        </div>

                        <div
                          className={`w-fit min-w-[110px] rounded-2xl px-3 py-3 shadow-[0_8px_25px_rgba(0,0,0,0.22)] sm:min-w-[120px] sm:px-4 ${
                            isMine
                              ? "rounded-bl-md bg-[#B794F6] text-white"
                              : "rounded-br-md border border-white/10 bg-[#1b1330]/95 text-white"
                          }`}
                        >
                          {!isSameSenderAsPrev && (
                            <div
                              className={`mb-2 text-[10px] sm:text-[11px] ${
                                isMine ? "text-white/85" : "text-gray-300"
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleString("ar-SA")} • {msg.senderUser}
                            </div>
                          )}

                          {replied && (
                            <div
                              className={`mb-2 rounded-xl border px-3 py-2 text-right text-[11px] sm:text-xs ${
                                isMine
                                  ? "border-white/20 bg-white/10 text-white/90"
                                  : "border-white/10 bg-black/20 text-gray-200"
                              }`}
                            >
                              <div className="mb-1 opacity-80">ردًا على: {replied.senderUser}</div>
                              <div className="line-clamp-3 whitespace-pre-wrap break-words">
                                {replied.body}
                              </div>
                            </div>
                          )}

                          <div className="whitespace-pre-wrap break-words text-right text-sm leading-7">
                            {msg.body}
                          </div>

                          <div className="mt-3 flex justify-start">
                            <button
                              type="button"
                              onClick={() => setReplyTo(msg)}
                              className={`text-[11px] transition ${
                                isMine
                                  ? "text-white/90 hover:text-white"
                                  : "text-purple-200 hover:text-purple-100"
                              }`}
                            >
                              رد (اقتباس)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed composer */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 lg:px-8">
        <div className="pointer-events-auto mx-auto w-full max-w-[980px]">
          {replyTo && (
            <div className="mb-3 rounded-2xl border border-purple-500/40 bg-purple-950/70 px-4 py-3 backdrop-blur-sm">
              <div className="mb-1 text-right text-xs text-gray-200">
                أنت ترد على: {replyTo.senderUser}
              </div>
              <div className="line-clamp-2 text-right text-sm text-gray-100">
                {replyTo.body}
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="mt-2 text-xs text-red-200 hover:text-red-100"
              >
                إلغاء الرد
              </button>
            </div>
          )}

          <div className="rounded-[24px] border border-purple-500/40 bg-[#110a20]/88 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[28px] sm:p-3">
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleSendMessage}
                className="h-[48px] shrink-0 rounded-2xl bg-purple-600 px-4 text-sm font-medium transition hover:bg-purple-500 sm:h-[50px] sm:px-5"
              >
                إرسال
              </button>

              <textarea
                ref={messageInputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="اكتب رسالتك..."
                rows={1}
                className="max-h-40 min-h-[48px] flex-1 resize-none overflow-y-auto rounded-2xl border border-purple-500/50 bg-[#120b22] px-4 py-3 text-right text-sm text-white outline-none placeholder:text-gray-400 sm:min-h-[50px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* System dialog بدل alert/confirm */}
      {systemDialog.isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#0f0a1d] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-xs ${dialogStyles.badge}`}
              >
                {systemDialog.variant === "success" && "نجاح"}
                {systemDialog.variant === "error" && "تنبيه"}
                {systemDialog.variant === "confirm" && "تأكيد"}
                {systemDialog.variant === "info" && "معلومة"}
              </span>

              <button
                type="button"
                onClick={() => {
                  if (systemDialog.variant === "confirm") {
                    resolveConfirm(false);
                  } else {
                    closeDialog();
                  }
                }}
                className="text-sm text-gray-400 transition hover:text-white"
              >
                إغلاق
              </button>
            </div>

            <h3 className="mb-2 text-right text-lg font-semibold text-white">
              {systemDialog.title}
            </h3>

            <p className="text-right text-sm leading-7 text-gray-300">
              {systemDialog.message}
            </p>

            <div className="mt-5 flex flex-wrap justify-start gap-2">
              {systemDialog.variant === "confirm" ? (
                <>
                  <button
                    type="button"
                    onClick={() => resolveConfirm(true)}
                    className={`rounded-2xl px-4 py-2 text-sm text-white transition ${dialogStyles.button}`}
                  >
                    {systemDialog.confirmText || "تأكيد"}
                  </button>

                  <button
                    type="button"
                    onClick={() => resolveConfirm(false)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/10"
                  >
                    {systemDialog.cancelText || "إلغاء"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={closeDialog}
                  className={`rounded-2xl px-4 py-2 text-sm text-white transition ${dialogStyles.button}`}
                >
                  {systemDialog.confirmText || "حسنًا"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
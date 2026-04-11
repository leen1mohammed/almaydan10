'use client';
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Glow from "./Glow";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

const AVATARS = [
  "/images/avatars/avatar1.png",
  "/images/avatars/avatar3.png",
  "/images/avatars/avatar2.png",
  "/images/avatars/avatar6.png",
  "/images/avatars/avatar7.png",
  "/images/avatars/avatar8.png",
  "/images/avatars/avatar9.png",
  "/images/avatars/avatar10.png",
  "/images/avatars/avatar11.png",
  "/images/avatars/avatar12.png",
];

const DEFAULT_AVATAR = "/images/avatars/avatar1.png";

// ─────────────────────────────────────────────
// Avatar Picker Modal
// ─────────────────────────────────────────────
function AvatarModal({
  current,
  onSelect,
  onClose,
  isFirstLogin,
}: {
  current: string;
  onSelect: (src: string) => void;
  onClose: () => void;
  isFirstLogin: boolean;
}) {
  const [selected, setSelected] = useState(current);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(6,17,37,0.85)", backdropFilter: "blur(6px)" }}
      onClick={isFirstLogin ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-[600px] mx-4 rounded-2xl p-[1.5px]"
        style={{ background: "linear-gradient(135deg, #FF27F0, #B37FEB, #29FF64)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-2xl px-8 py-8 flex flex-col gap-6"
          style={{ background: "linear-gradient(145deg, #0D0A2E, #0a1628)" }}
        >
          <div className="flex items-center justify-between" dir="rtl">
            <div>
              <h2 className="text-[22px] font-[900] text-white font-['Cairo']">
                اختر صورتك الشخصية
              </h2>
              {isFirstLogin && (
                <p className="text-white/40 text-[13px] font-['Cairo'] mt-1">
                  مرحباً! اختر أفاتار يمثلك في الميدان 🎮
                </p>
              )}
            </div>
            {!isFirstLogin && (
              <button onClick={onClose} className="text-white/40 hover:text-white text-[22px] transition-colors leading-none">
                ✕
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            {AVATARS.map((src) => {
              const isSelected = selected === src;
              return (
                <button
                  key={src}
                  onClick={() => setSelected(src)}
                  className="relative rounded-full transition-transform hover:scale-105 active:scale-95"
                  style={{
                    padding: "2px",
                    background: isSelected ? "linear-gradient(135deg, #FF27F0, #29FF64)" : "transparent",
                    boxShadow: isSelected ? "0 0 18px rgba(255,39,240,0.6)" : "none",
                  }}
                >
                  <div className="w-full aspect-square rounded-full overflow-hidden bg-[#1A0B36]">
                    <img src={src} alt="avatar" className="w-full h-full object-cover rounded-full" />
                  </div>
                  {isSelected && (
                    <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#29FF64] flex items-center justify-center border-2 border-[#0D0A2E]">
                      <span className="text-[#0D0A2E] text-[11px] font-black">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => { onSelect(selected); onClose(); }}
            className="w-full py-3 rounded-[30px] border-[1.4px] border-[#B37FEB] text-[#0B051E] font-[800] text-[18px] transition-all hover:shadow-[0_0_25px_rgba(41,255,100,0.8)] active:scale-95 font-['Cairo']"
            style={{
              background: "linear-gradient(319deg, rgba(255,255,255,0.80) 11.46%, rgba(255,255,255,0.80) 34.44%, rgba(255,255,255,0.00) 66.52%, rgba(255,255,255,0.80) 94.3%), rgba(41,255,100,0.53)",
              backgroundBlendMode: "soft-light, normal",
              boxShadow: "0 0 20px 2px rgba(41,255,100,0.5)",
            }}
          >
            تأكيد الاختيار
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Read-only field
// ─────────────────────────────────────────────
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 w-full" dir='rtl'>
      <label className="text-[18px] font-[600] text-right text-white/80 font-['Cairo']">{label}</label>
      <div className="w-full h-[40px] bg-white/5 border-[1.5px] border-[#B37FEB]/40 rounded-md px-[12px] flex items-center justify-end text-sm text-white/50 font-['Cairo'] cursor-not-allowed select-none">
        {value || "—"}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Admin Card (shown on own profile when user is admin)
// ─────────────────────────────────────────────
function AdminCard({
  contactInfo,
  onChange,
}: {
  contactInfo: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="w-full mb-14">
      <div className="flex items-center justify-end gap-3 mb-4">
        <label className="text-[22px] font-[900] text-right text-white font-['Cairo']">
          بطاقة المشرف
        </label>
        <span className="text-[28px]">🛡️</span>
      </div>

      <div
        className="w-full rounded-2xl p-[1.5px] relative"
        style={{ background: "linear-gradient(135deg, #29FF64, #B37FEB, #FF27F0)" }}
      >
        <div
          className="w-full rounded-2xl px-6 py-8 flex flex-col items-end gap-5"
          style={{
            background: "linear-gradient(145deg, #0D0A2E, #0a1628)",
            boxShadow: "inset 0 0 40px rgba(41,255,100,0.07)",
          }}
        >
          <p className="text-right text-white/40 text-[13px] font-['Cairo']">
            أنت مسؤول في الميدان — رقم جوالك سيظهر للزوار في صفحتك
          </p>

          <div className="w-full flex flex-col gap-2">
            <label className="text-right text-white/70 text-[13px] font-['Cairo'] font-bold">
              📞 رقم الجوال
            </label>
            <input
              type="tel"
              dir="ltr"
              value={contactInfo}
              onChange={(e) => onChange(e.target.value)}
              placeholder="+966 5X XXX XXXX"
              className="w-full bg-white/5 border border-[#29FF64]/30 rounded-xl px-4 py-3 text-left text-white font-['Cairo'] text-[15px] outline-none focus:border-[#29FF64] focus:ring-1 focus:ring-[#29FF64] transition-all placeholder:text-white/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main ProfilePage
// ─────────────────────────────────────────────
export default function ProfilePage() {
  const [name, setName]             = useState("");
  const [username, setUsername]     = useState("");
  const [email, setEmail]           = useState("");
  const [bio, setBio]               = useState("");
  const [profilePic, setProfilePic] = useState(DEFAULT_AVATAR);
  const [zoneinfo, setZoneinfo]     = useState("");
  const [isAdmin, setIsAdmin]       = useState(false);
  const [contactInfo, setContactInfo] = useState("");
  const [loading, setLoading]       = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [saveMsg, setSaveMsg]       = useState<string | null>(null);
  const [showModal, setShowModal]   = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const user = await authService.getCurrentUser();
        if (!user) { setLoading(false); return; }

        setEmail(user.email);
        setUsername(user.userName);
        setName(user.name);

        // ✅ Check if admin
        const adminCheck = await authService.checkIsAdmin(user.userName);
        setIsAdmin(adminCheck);

        if (adminCheck) {
          // Fetch contactInfo from Admin table
          const { data: adminData } = await supabase
            .from("Admin")
            .select("contactInfo")
            .eq("AuserName", user.userName)
            .maybeSingle();
          if (adminData) setContactInfo(adminData.contactInfo ?? "");
        }

        // Fetch bio + profilePic from Profile
        const { data: profileData } = await supabase
          .from("Profile")
          .select("bio, profilePic")
          .eq("pruserName", user.userName)
          .maybeSingle();

        if (profileData) {
          setBio(profileData.bio ?? "");
          setProfilePic(profileData.profilePic || DEFAULT_AVATAR);
        }

        // Fetch zoneinfo from Participant (only needed for non-admins)
        if (!adminCheck) {
          const { data: participantData } = await supabase
            .from("Participant")
            .select("zoneinfo")
            .eq("PuserName", user.userName)
            .maybeSingle();
          if (participantData) setZoneinfo(participantData.zoneinfo ?? "");
        }

        const firstLogin = searchParams.get("firstLogin") === "true";
        if (firstLogin) {
          setIsFirstLogin(true);
          setShowModal(true);
        }

      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleAvatarSelect = async (src: string) => {
    setProfilePic(src);
    if (isFirstLogin && username) {
      await supabase.from("Profile").update({ profilePic: src }).eq("pruserName", username);
      setIsFirstLogin(false);
      router.replace("/profile");
    }
  };
    
  // Admin only saves profilePic, regular user saves bio + zoneinfo + profilePic
   const handleSave = async () => {
    if (!username) return;
    setIsSaving(true);
    setSaveMsg(null);

  if (isAdmin) {
    // Save profilePic AND contactInfo
    const [{ error: profileErr }, { error: adminErr }] = await Promise.all([
      supabase.from("Profile").update({ profilePic }).eq("pruserName", username),
      supabase.from("Admin").update({ contactInfo }).eq("AuserName", username),
    ]);
    setSaveMsg(profileErr || adminErr ? "حدث خطأ أثناء الحفظ ❌" : "تم حفظ التعديلات بنجاح 🔥");
  } else {
    const [{ error: profileErr }, { error: participantErr }] = await Promise.all([
      supabase.from("Profile").update({ bio, profilePic }).eq("pruserName", username),
      supabase.from("Participant").update({ zoneinfo }).eq("PuserName", username),
    ]);
    setSaveMsg(profileErr || participantErr ? "حدث خطأ أثناء الحفظ ❌" : "تم حفظ التعديلات بنجاح 🔥");
  }

  setTimeout(() => setSaveMsg(null), 3000);
  setIsSaving(false);
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#061125] flex items-center justify-center text-white font-['Cairo']">
        <p className="animate-pulse text-2xl">جاري تحميل الميدان...</p>
      </main>
    );
  }

  return (
    <>
      {showModal && (
        <AvatarModal
          current={profilePic}
          onSelect={handleAvatarSelect}
          onClose={() => setShowModal(false)}
          isFirstLogin={isFirstLogin}
        />
      )}

      <main className="min-h-screen bg-[#061125] text-white flex flex-col items-center font-['Cairo'] relative overflow-x-hidden" dir="rtl">
        <Glow />
        <div className="z-10 w-full max-w-[923px] flex flex-col items-center pb-28 px-4">

          {/* Title */}
          <h1 className="w-full text-center text-[80px] font-[900] leading-[100px] text-white mt-10 mb-16"
            style={{ textShadow: "0 3px 0 #FF27F0" }}>
            صفحتك الشخصية
          </h1>

          {/* Header: Avatar + Save */}
          <div className="flex flex-row items-center justify-between w-full mb-14">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-[120px] h-[120px] rounded-full border-[1.5px] border-[#B37FEB] overflow-hidden p-1 bg-[#1A0B36] shadow-[0_0_20px_rgba(179,127,235,0.4)]">
                  <img src={profilePic} alt="Profile" className="w-full h-full rounded-full object-cover" />
                </div>
                <button onClick={() => setShowModal(true)}
                  className="absolute bottom-0 right-0 bg-[#74C38E] w-10 h-10 rounded-full border-2 border-[#0B051E] flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                  <img src="/images/icons/edit-icon3.png" alt="edit" className="w-8 h-8 object-contain" />
                </button>
              </div>
              <div className="text-right">
                <h2 className="text-[24px] font-bold">{name || "الاسم"}</h2>
                <p className="text-[16px] opacity-60">@{username || "username"}</p>
                {/* ✅ Admin badge next to username */}
                {isAdmin && (
                  <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#29FF64]/40 text-[#29FF64]"
                    style={{ background: "rgba(41,255,100,0.08)" }}>
                    ADMIN 🛡️
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button onClick={handleSave} disabled={isSaving}
                className="flex items-center justify-center w-[160px] h-[45px] px-[16px] rounded-[30px] border-[1.4px] border-[#B37FEB] text-[#0B051E] font-[800] text-[16px] transition-all hover:shadow-[0_0_25px_rgba(41,255,100,0.8)] active:scale-95 disabled:opacity-50"
                style={{
                  background: "linear-gradient(319deg, rgba(255,255,255,0.80) 11.46%, rgba(255,255,255,0.80) 34.44%, rgba(255,255,255,0.00) 66.52%, rgba(255,255,255,0.80) 94.3%), rgba(41,255,100,0.53)",
                  backgroundBlendMode: "soft-light, normal",
                  boxShadow: "0 0 20px 2px rgba(41,255,100,0.5)",
                }}>
                {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
              {saveMsg && (
                <p className="text-sm font-bold animate-pulse"
                  style={{ color: saveMsg.includes("❌") ? "#FF27F0" : "#29FF64" }}>
                  {saveMsg}
                </p>
              )}
            </div>
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-2 gap-x-[60px] gap-y-8 w-full mb-10">
            <ReadOnlyField label="الاسم" value={name} />
            <ReadOnlyField label="اسم المستخدم" value={`@${username}`} />
            <ReadOnlyField label="البريد الإلكتروني" value={email} />
            <div />
          </div>

          {/* ✅ ADMIN: show admin card only */}
          {isAdmin ? (
            <AdminCard contactInfo={contactInfo} onChange={setContactInfo} />
                    ) : (
            <>
              {/* عنك */}
              <div className="w-full flex flex-col gap-3 mb-12">
                <label className="text-[20px] font-[700] text-right text-white font-['Cairo']">عنك</label>
                <p className="text-right text-white/40 text-[13px] -mt-1">
                  ألعابك المفضلة • فريقك المفضل • نبذة عنك • أهدافك في الإيسبورتس
                </p>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                  rows={5}
                  placeholder="مثال: أنا لاعب فورتنايت منذ 2019، فريقي المفضل Falcons، هدفي الوصول للمحترفين..."
                  className="w-full bg-transparent border-[1.5px] border-[#B37FEB] rounded-xl px-[14px] py-[12px] text-right text-sm text-white outline-none focus:border-[#FF27F0] focus:ring-1 focus:ring-[#FF27F0] transition-all resize-none font-['Cairo'] leading-relaxed placeholder:text-white/20"
                />
                <p className=" text-white/30 text-[12px]">{bio.length}/300</p>
              </div>

              {/* Zone Info */}
              <div className="w-full mb-14">
                <div className="flex items-center gap-3 mb-4">
                  <label className="text-[22px] font-[900] text-right text-white font-['Cairo']" dir='rtl'>ساحة إنجازاتك</label>
                  <span className="text-[28px]">🏆</span>
                </div>
                <div className="w-full rounded-2xl p-[1.5px] relative"
                  style={{ background: "linear-gradient(135deg, #FF27F0, #B37FEB, #29FF64)" }}>
                  <div className="w-full rounded-2xl px-6 py-6 flex flex-col gap-4"
                    style={{ background: "linear-gradient(145deg, #0D0A2E, #0a1628)", boxShadow: "inset 0 0 40px rgba(179,127,235,0.07)" }}>
                    <p className="text-right text-white/40 text-[13px] font-['Cairo']">
                      سجّل إنجازاتك الكبرى، بطولاتك، ومسيرتك في عالم الإيسبورتس 🎮
                    </p>
                    <div className="absolute top-4 left-4 text-[11px] font-bold px-3 py-1 rounded-full border border-[#FF27F0]/40 text-[#FF27F0]"
                      style={{ background: "rgba(255,39,240,0.08)" }}>
                      ZONE
                    </div>
                    <textarea
                      value={zoneinfo}
                      onChange={(e) => setZoneinfo(e.target.value)}
                      maxLength={500}
                      rows={6}
                      placeholder={`مثال:\n🥇 المركز الأول في بطولة PUBG الرياض 2024\n🏅 عضو فريق Phantom Wolves\n⚡ 3 سنوات تنافسية في Valorant`}
                      className="w-full bg-transparent border-[1.5px] border-[#B37FEB]/30 rounded-xl px-[14px] py-[12px] text-right text-sm text-white outline-none focus:border-[#FF27F0] focus:ring-1 focus:ring-[#FF27F0]/50 transition-all resize-none font-['Cairo'] leading-loose placeholder:text-white/15"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-white/25 text-[12px]">{zoneinfo.length}/500</p>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
                            style={{
                              background: zoneinfo.length > i * 100 ? `hsl(${280 + i * 20}, 90%, 65%)` : "rgba(255,255,255,0.1)",
                              boxShadow: zoneinfo.length > i * 100 ? `0 0 6px hsl(${280 + i * 20}, 90%, 65%)` : "none",
                            }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Logout */}
          <button onClick={handleLogout}
            className="mt-4 w-[245px] h-[58px] bg-[#A62D44]/60 hover:bg-[#A62D44] text-white font-[800] text-[20px] rounded-[30px] border-[1.4px] border-[#B37FEB] shadow-[0_0_15px_rgba(166,45,68,0.5)] transition-all active:scale-95">
            تسجيل خروج
          </button>

        </div>
      </main>
    </>
  );
}
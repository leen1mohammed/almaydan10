import { supabase } from "../lib/supabase";

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
export const registerUser = async (email, password, userName, fullName) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (authError) return { success: false, message: authError.message };

  try {
    const { error: memberError } = await supabase.from('Member').insert([
      { userName, name: fullName, email, password },
    ]);
    if (memberError) throw memberError;

    const { error: profileError } = await supabase.from('Profile').insert([
      { pruserName: userName, bio: "", profilePic: "" },
    ]);
    if (profileError) throw profileError;

    const { error: participantError } = await supabase.from('Participant').insert([
      { PuserName: userName, zoneinfo: "" },
    ]);
    if (participantError) throw participantError;

    return { success: true, message: "تم إنشاء حسابك وملفاتك بنجاح! 🏆" };
  } catch (err) {
    console.error("خطأ في الربط باليوزر نيم:", err.message);
    return { success: false, message: "حصلت مشكلة في تجهيز الجداول المرتبطة." };
  }
};

// ─────────────────────────────────────────────
// CHECK USERNAME
// ─────────────────────────────────────────────
export const checkUsername = async (userName) => {
  const { data } = await supabase
    .from('Member')
    .select('userName')
    .eq('userName', userName)
    .single();
  return !!data;
};

// ─────────────────────────────────────────────
// LOGIN
// Returns: { success, data, isFirstLogin }
// isFirstLogin = true when profilePic is empty → redirect to profile
// ─────────────────────────────────────────────
export const loginUser = async (userName, password) => {
  console.log("محاولة دخول", userName);

  // 1. Get email from Member
  const { data: memberData, error: memberError } = await supabase
    .from('Member')
    .select('email')
    .eq('userName', userName)
    .single();

  if (memberError || !memberData) {
    return { success: false, message: "اسم المستخدم هذا غير موجود" };
  }

  // 2. Sign in with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email: memberData.email,
    password,
  });
  if (error) return { success: false, message: "كلمة المرور غير صحيحة" };

  // 3. Check if first login by seeing if profilePic is empty
  const { data: profileData } = await supabase
    .from('Profile')
    .select('profilePic')
    .eq('pruserName', userName)
    .maybeSingle();

  const isFirstLogin = !profileData?.profilePic;

  return { success: true, data, isFirstLogin };
};

// ─────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────
export const authService = {

  // ✅ Now fetches userName AND name — fixes the missing name bug
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;

      const { data: memberData, error: memberErr } = await supabase
        .from("Member")
        .select("userName, name")
        .eq("email", user.email)
        .maybeSingle();

      if (memberErr || !memberData) return null;

      return {
        email: user.email ?? "",
        userName: memberData.userName ?? "",
        name: memberData.name ?? "",
      };
    } catch {
      return null;
    }
  },

  checkIsAdmin: async (userName) => {
    if (!userName) return false;
    const { data, error } = await supabase
      .from("Admin")
      .select("AuserName")
      .eq("AuserName", userName)
      .maybeSingle();
    if (error) {
      console.error("checkIsAdmin error:", error);
      return false;
    }
    return !!data;
  },

  checkIsParticipant: async (userName) => {
    if (!userName) return false;
    const { data, error } = await supabase
      .from("Participant")
      .select("PuserName")
      .eq("PuserName", userName)
      .maybeSingle();
    if (error) {
      console.error("checkIsParticipant error:", error);
      return false;
    }
    return !!data;
  },

  onAuthChange: (callback) => supabase.auth.onAuthStateChange(callback),
};
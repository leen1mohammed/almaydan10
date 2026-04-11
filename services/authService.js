import { supabase } from "../lib/supabase";
import{sendWelcomeEmail} from "../services/EmailService";
// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
export const registerUser = async (email, password, userName, fullName) => {
  // 1. Create auth account
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (authError) return { success: false, message: authError.message };

  try {
    // 2. Insert into Member table
    const { error: memberError } = await supabase.from('Member').insert([
      { userName, name: fullName, email, password },
    ]);
    if (memberError) throw memberError;

    // 3. Insert into Profile table
    const { error: profileError } = await supabase.from('Profile').insert([
      { pruserName: userName, bio: "", profilePic: "" },
    ]);
    if (profileError) throw profileError;

    // 4. Insert into Participant table
    const { error: participantError } = await supabase.from('Participant').insert([
      { PuserName: userName, zoneinfo: "" },
    ]);
    if (participantError) throw participantError;

    await sendWelcomeEmail(fullName,email);


    // 5. ✅ Auto sign-in after registration so user doesn't need to login manually
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Registration worked but auto-login failed → send to login page
      return { success: true, redirectTo: '/login' };
    }

    // 6. ✅ Auto-login worked → send directly to profile as first time user
    return { success: true, redirectTo: '/profile?firstLogin=true' };

  } catch (err) {
    console.error("خطأ في التسجيل:", err.message);
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

  // 1. Get email from Member using userName
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

export const checkEmail = async (email) => {
  const { data, error } = await supabase
    .from('Member')
    .select('email')
    .eq('email', email)
    .single();

  return !!data; // يرجع true إذا حصل إيميل، و false إذا ما حصل
};

// GOOGLE LOGIN
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:3000/auth/callback', // نغيره بعدين للدومين حقنا
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
};
// ─────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────
export const authService = {

  // ✅ Fetches userName AND name — fixes the missing name bug
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

  getUserRole: async (userName) => {
    try {
      const { data: adminData } = await supabase
        .from('Admin')
        .select('AuserName')
        .eq('AuserName', userName)
        .single();
      if (adminData) return 'admin';

      const { data: participantData } = await supabase
        .from('Participant')
        .select('PuserName')
        .eq('PuserName', userName)
        .single();
      if (participantData) return 'participant';

      return null;
    } catch (error) {
      console.error("Error fetching role:", error);
      return null;
    }
  },

  onAuthChange: (callback) => supabase.auth.onAuthStateChange(callback),
};
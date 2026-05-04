import { supabase } from "../lib/supabase";
import { sendWelcomeEmail } from "../services/EmailService";

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
export const registerUser = async (email, password, userName, fullName) => {
  // 1. Single signUp call (was being called twice before — that was the bug)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: userName,
        full_name: fullName,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`,
      },
    },
  });

  if (authError) {
    return { success: false, message: authError.message };
  }

  // 2. If Supabase email confirmation is ON, authData.user will be null
  //    and the user must confirm their email before we can insert into tables.
  //    Handle that gracefully:
  if (!authData.user) {
    return {
      success: false,
      message: "تم إرسال رابط التأكيد على بريدك الإلكتروني. يرجى تأكيد الإيميل أولاً.",
    };
  }

  try {
    // 3. Insert into Member table
    const { error: memberError } = await supabase.from("Member").insert([
      { userName, name: fullName, email, password },
    ]);
    if (memberError) throw memberError;

    // 4. Insert into Profile table
    const { error: profileError } = await supabase.from("Profile").insert([
      { pruserName: userName, bio: "", profilePic: "" },
    ]);
    if (profileError) throw profileError;

    // 5. Insert into Participant table
    const { error: participantError } = await supabase.from("Participant").insert([
      { PuserName: userName, zoneinfo: "" },
    ]);
    if (participantError) throw participantError;

    // 6. Send welcome email (non-blocking — we don't fail registration if this fails)
    await sendWelcomeEmail(fullName, email).catch((err) =>
      console.warn("Welcome email failed (non-critical):", err)
    );

    // 7. Auto sign-in so the user lands directly on the profile page
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Registration worked but auto sign-in failed → send to login
      return { success: true, redirectTo: "/login" };
    }

    // 8. All good → send to profile as first-time user
    return { success: true, redirectTo: "/profile?firstLogin=true" };

  } catch (err) {
    console.error("Registration error:", err.message);
    return { success: false, message: "حصلت مشكلة في تجهيز الجداول المرتبطة: " + err.message };
  }
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
export const loginUser = async (userName, password) => {
  // 1. Get email from Member table using userName
  const { data: memberData, error: memberError } = await supabase
    .from("Member")
    .select("email")
    .eq("userName", userName)
    .single();

  if (memberError || !memberData) {
    return { success: false, message: "اسم المستخدم هذا غير موجود" };
  }

  // 2. Sign in with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email: memberData.email,
    password,
  });

  if (error) {
    return { success: false, message: "كلمة المرور غير صحيحة" };
  }

  // 3. Check if first login (profilePic is empty → redirect to profile to pick avatar)
  const { data: profileData } = await supabase
    .from("Profile")
    .select("profilePic")
    .eq("pruserName", userName)
    .maybeSingle();

  const isFirstLogin = !profileData?.profilePic;
  return { success: true, data, isFirstLogin };
};

// ─────────────────────────────────────────────
// GOOGLE LOGIN
// ─────────────────────────────────────────────
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
};

// ─────────────────────────────────────────────
// CHECK USERNAME (used in register form validation)
// ─────────────────────────────────────────────
export const checkUsername = async (userName) => {
  const { data } = await supabase
    .from("Member")
    .select("userName")
    .eq("userName", userName)
    .single();
  return !!data;
};

// ─────────────────────────────────────────────
// CHECK EMAIL (used in register form validation)
// ─────────────────────────────────────────────
export const checkEmail = async (email) => {
  const { data } = await supabase
    .from("Member")
    .select("email")
    .eq("email", email)
    .single();
  return !!data;
};

// ─────────────────────────────────────────────
// AUTH SERVICE OBJECT
// (used across the app for session + role checks)
// ─────────────────────────────────────────────
export const authService = {

  // Get current logged-in user's info from Member table
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

  // Check if a user is an Admin
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

  // Check if a user is a Participant
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

  // Get user role: 'admin' | 'participant' | null
  getUserRole: async (userName) => {
    try {
      const { data: adminData } = await supabase
        .from("Admin")
        .select("AuserName")
        .eq("AuserName", userName)
        .single();
      if (adminData) return "admin";

      const { data: participantData } = await supabase
        .from("Participant")
        .select("PuserName")
        .eq("PuserName", userName)
        .single();
      if (participantData) return "participant";

      return null;
    } catch (error) {
      console.error("Error fetching role:", error);
      return null;
    }
  },

  // Subscribe to auth state changes
  onAuthChange: (callback) => supabase.auth.onAuthStateChange(callback),
};
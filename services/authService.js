import { supabase } from "../lib/supabase";


//const supabase = createClientComponentClient();

export const registerUser=async (email,password,userName,fullName) => {
    const{data:authData,error:authError}=await supabase.auth.signUp({
        email:email,
        password:password
    });
    if(authError) return {success:false,message:authError.message}

     try {
    // 2. الإضافة لجدول Member
    const { error: memberError } = await supabase.from('Member').insert([
      {         userName:userName,
                name:fullName,
                email:email,
                password:password }
    ]);
    if (memberError) throw memberError;

    // 3. الإضافة لجدول Profile (الربط عن طريق userName)
    const { error: profileError } = await supabase.from('Profile').insert([
      { 
        pruserName: userName, //الربط باليوزر نيم كما طلبتِ
        bio: "",  
        profilePic:""
      }
    ]);

    if (profileError) throw profileError;

    // 4. الإضافة لجدول Participant (الربط عن طريق userName)
    const { error: participantError } = await supabase.from('Participant').insert([
      { 
        PuserName: userName, // الربط باليوزر نيم هنا أيضاً
        zoneinfo:"" 
      }
    ]);
    if (participantError) throw participantError;

    return { success: true, message: "تم إنشاء حسابك وملفاتك بنجاح! 🏆" };

  } catch (err) {
    console.error("خطأ في الربط باليوزر نيم:", err.message);
    return { success: false, message: "حصلت مشكلة في تجهيز الجداول المرتبطة." };
  }
};


export const checkUsername=async(userName)=>{
    const{data,error}=await supabase.from('Member').select('userName').eq('userName',userName).single()
    if(data) return true;
    return false;
}


export const loginUser=async(userName,password)=>{
    console.log("محاولة دخول",userName)
    const{data:memberData,error:memberError}=await supabase.from('Member').select('email').eq('userName',userName).single()

    if(memberError || !memberData){
        return{success:false,message:"اسم المستخدم هذا غير موجود"}
    }
    console.log("email",memberData.email)
    const{data,error}=await supabase.auth.signInWithPassword({
        email:memberData.email,
        password:password
    });
    if(error){
        return{success:false,message:"كلمة المرور غير صحيحة"}
    }
    return{success:true,data};
};

//


// تعريفه مرة واحدة فقط هنا!
//const supabase = createClientComponentClient();
// service/authservice.js

export const authService = {
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;

      const { data: memberData, error: memberErr } = await supabase
        .from("Member")
        .select("userName")
        .eq("email", user.email)
        .maybeSingle();

      if (memberErr) return user;
      return memberData?.userName ? { ...user, userName: memberData.userName } : user;
    } catch {
      return null;
    }
  },

  // ✅ مهم: maybeSingle بدل single عشان ما يطلع 406 لما ما يكون Admin
  checkIsAdmin: async (userName) => {
    if (!userName) return false;

    const { data, error } = await supabase
      .from("Admin")
      .select("AuserName")
      .eq("AuserName", userName)
      .maybeSingle();

    if (error) {
      console.error("checkIsAdmin error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return false;
    }

    return !!data;
  },

  onAuthChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },

 logout: async () => {
    try {
      // تسجيل الخروج من سوبا بيز
      const { error } = await supabase.auth.signOut();
      
      // حركة إضافية لضمان مسح أي بيانات عالقة في المتصفح
      if (typeof window !== 'undefined') {
        localStorage.clear(); // يمسح كل شي مخزن يخص الجلسة
        sessionStorage.clear();
      }

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error.message);
      return false;
    }
  },

  // ✅ نفس الفكرة
 checkIsParticipant: async (userName) => {
    if (!userName) return false;

    const { data, error } = await supabase
      .from("Participant")
      .select("PuserName")
      .eq("PuserName", userName)
      .maybeSingle();

    if (error) {
      console.error("checkIsParticipant error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return false;
    }

    return !!data;
  },


 getUserRole: async (userName) => {
    try {
      // 1. نبحث في جدول الأدمن أولاً
      const { data: adminData } = await supabase
        .from('Admin')
        .select('AuserName')
        .eq('AuserName', userName)
        .single();

      if (adminData) return 'admin'; // إذا وجدناه، فهو أدمن

      // 2. إذا لم نجده في الأدمن، نبحث في جدول المشاركين
      const { data: participantData } = await supabase
        .from('Participant')
        .select('PuserName')
        .eq('PuserName', userName)
        .single();

      if (participantData) return 'participant'; // إذا وجدناه، فهو مشارك

      return null; // مستخدم جديد لم يتحدد دوره بعد
    } catch (error) {
      console.error("Error fetching role:", error);
      return null;
    }
  }, 

  onAuthChange: (callback) => supabase.auth.onAuthStateChange(callback),
};


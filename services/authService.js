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
export const authService = {
  // 1. جلب بيانات العضو المسجل
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;

      // نجيب الـ userName من جدول Member باستخدام الـ email
      const { data: memberData } = await supabase
        .from('Member')
        .select('userName')
        .eq('email', user.email) 
        .single();

      return memberData ? { ...user, userName: memberData.userName } : user;
    } catch (e) {
      return null;
    }
  },

  // 2. التحقق هل هو "أدمن" من جدول Admin
  checkIsAdmin: async (userName) => {
    if (!userName) return false;
    const { data } = await supabase
      .from('Admin')
      .select('AuserName')
      .eq('AuserName', userName)
      .single();
    return !!data; 
  },

  // 3. التحقق هل هو "مستخدم عادي" من جدول Participant
  checkIsParticipant: async (userName) => {
    if (!userName) return false;
    const { data } = await supabase
      .from('Participant')
      .select('PuserName')
      .eq('PuserName', userName)
      .single();
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
  }
}


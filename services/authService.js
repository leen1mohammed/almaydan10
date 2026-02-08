import { supabase } from "../lib/supabase";

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

   /* if(!error && data.user){
        const{error: dbError}=await supabase.from('Member').insert([
            {
                userName:userName,
                name:fullName,
                email:email,
                password:password
            }

        ]);

        if(dbError){
            return{success:false, message:"فشل حفظ بيانات الممبر" + dbError.message}
        }

    }
    return{data,error,success:!error};

}*/

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
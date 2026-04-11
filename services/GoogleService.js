import { supabase } from "../lib/supabase";

export const handleGoogleUser = async (user) => {
    console.log("دخلنا هاندل قوقل يوزر",user.email)
  // تحقق هل موجود
  const { data: member } = await supabase
    .from('Member')
    .select('*')
    .eq('email', user.email)
    .maybeSingle();

  if (!member) {
    const userName = user.email.split('@')[0];

    // إنشاء المستخدم
    const { error: memberError } = await supabase
    .from('Member')
    .insert([
      {
        userName,
        name: user.user_metadata.full_name || "",
        email: user.email,
      },
    ]);
    if(memberError){
        console.error("member error",memberError.message)
    }

    await supabase.from('Profile').insert([
      { pruserName: userName, bio: "", profilePic: "" },
    ]);

    await supabase.from('Participant').insert([
      { PuserName: userName, zoneinfo: "" },
    ]);

    return { isNew: true };
  }

  return { isNew: false };
};

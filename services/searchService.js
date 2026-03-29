import { supabase } from "../lib/supabase";


export const searchService = {
  searchGlobal: async (query) => {
    if (!query) return { users: [], arenas: [] };

    try {
      // 1. البحث عن المستخدمين (في جدول Member)
      const { data: users, error: userError } = await supabase
            .from('Member')
            .select(`
                userName,
                Profile!inner (
                profilePic
                )
                 `) // !inner تضمن إنه يجيب الممبر اللي له بروفايل فقط، وتدخل لجدول البروفايل تجيب الصورة
            .ilike('userName', `%${query}%`)
            .limit(5); // يبحث عن أي اسم يحتوي على الكلمة

      // 2. البحث عن الساحات (في جدول Arena)
      const { data: arenas, error: arenaError } = await supabase
        .from('Arena')
        .select('name, logo') 
        .ilike('name', `%${query}%`)
        .limit(5);

      if (userError || arenaError) throw (userError || arenaError);

      return { users: users || [], arenas: arenas || [] };
    } catch (error) {
      console.error("خطأ في البحث:", error.message);
      return { users: [], arenas: [] };
    }
  }
};

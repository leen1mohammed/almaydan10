import { supabase } from "../lib/supabase";


export const arenaService = {
  // 1. جلب كل الساحات
  getAllArenas: async () => {
    const { data, error } = await supabase
      .from('Arena')
      .select('*');
    if (error) throw error;
    return data;
  },

  // 2. جلب الساحات التي انضم لها المستخدم مع نقاطه
  getMyArenas: async (userName) => {
    const { data, error } = await supabase
      .from('Joins')
      .select(`
        points,
        ArenaName,
        Arena (*) 
      `)
      .eq('PUserName', userName); // تصحيح اسم الحقل لـ PUserName
    
    if (error) throw error;
    return data.map(item => ({
      ...item.Arena,
      userPoints: item.points
    }));
  },

  // 3. جلب محتويات الساحة (المنشورات)
  getArenaContent: async (arenaName) => {
    const { data, error } = await supabase
      .from('ArenaItem')
      .select(`*, Profile:PUserName(profilePic)`)
      .eq('ArenaName', arenaName)
      .order('created_at', { ascending: false });
    
    if (error) {
        console.error("خطا في جلب الرسائل",error.message);
        return [];
    }
    return data;
  },

  // 4. التحقق من حالة الانضمام وجلب النقاط
  getMembershipDetails: async (userName, arenaName) => {
    const { data, error } = await supabase
      .from('Joins')
      .select('points')
      .eq('PUserName', userName) 
      .eq('ArenaName', arenaName)
      .single();
    
    if (error) return null; 
    return data; 
  },

  // 5. دالة الانضمام لساحة جديدة (إضافة سجل في جدول Joins)
  joinArena: async (userName, arenaName) => {
    const { error } = await supabase
      .from('Joins')
      .insert([
        { 
          PUserName: userName, 
          ArenaName: arenaName, 
          points: 0 // البداية دائماً من صفر
        }
      ]);
    if (error) throw error;
    return { success: true };
  },

  // 4. إضافة "آيتم" جديد داخل الساحة (تفاعل المستخدم)
  // ملاحظة: هنا المفروض يكون فيه Trigger في الداتابيز يزيد النقاط تلقائياً في جدول Joins
  addArenaItem: async (arenaName, body) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: memberData } = await supabase
        .from('Member')
        .select('userName')
        .eq('email', user.email) 
        .single();
    
    const { data, error } = await supabase
      .from('ArenaItem')
      .insert([
        { 
          ArenaName: arenaName, 
          body: body,
          PUserName:memberData.userName,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('it-IT') // تنسيق HH:MM:SS
        }
      ]);
    
    if (error) throw error;

    const { error: updateError } = await supabase.rpc('increment_xp', { 
    arena_n: arenaName, 
    user_n: memberData.userName,
    amount: 10 // عدد النقاط لكل رسالة
  });

  if (updateError) {
    // إذا فشل الـ RPC، نستخدم Update عادي
    await supabase
      .from('Joins') // تأكدي من اسم جدول الانضمام عندك
      .update({ points: supabase.sql`points + 10` }) // هذه تحتاج إعداد بسيط في سوبابيز
      .match({ ArenaName: arenaName, PUserName: memberData.userName });
  }

  return data;
  },

  leaveArena: async (userName, arenaName) => {
  const { error } = await supabase
    .from('Joins')
    .delete() // أمر الحذف
    .eq('PUserName', userName) // شرط: اليوزرنيم الخاص باللاعب
    .eq('ArenaName', arenaName); // شرط: اسم الساحة المحددة

  if (error) throw error;
  return { success: true };
},
createArena: async (arenaData) => {
  try {
    const { data, error } = await supabase
      .from('Arena') // تأكدي من اسم الجدول عندك (Arena أو Arenas)
      .insert([
        { 
          name: arenaData.name, 
          pic: arenaData.image, 
          logo: arenaData.logo,
          description: arenaData.description || "ساحة جديدة للأبطال" 
        }
      ]);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error creating arena:", error.message);
    return { success: false, error: error.message };
  }
},

}
import { supabase } from "../lib/supabase";


export const arenaService = {
  // 1. جلب كل الساحات
  getAllArenas: async () => {
    const { data, error } = await supabase
      .from('Arena')
      .select(`
        *,
        Joins (
          PUserName,
          Member (
            Profile (profilePic)
          )
        )
      `);
    if (error) throw error;
    
    // سنقوم بحساب العدد وتجهيز الأفاتارز لكل ساحة
    return data.map(arena => ({
      ...arena,
      playerCount: arena.Joins?.length || 0,
      playerAvatars: arena.Joins?.slice(0, 3).map(j => j.Member?.Profile?.profilePic)||[]
    }));
  },

  // 2. جلب الساحات التي انضم لها المستخدم مع نقاطه
  getMyArenas: async (userName) => {
    try{
    const { data, error } = await supabase
      .from('Joins')
      .select(`
        points,
        ArenaName,
        Arena (*,
        Joins (
          PUserName,
          Member (
            Profile (profilePic)
          )
        )
      )
      `)
      .eq('PUserName', userName); // تصحيح اسم الحقل لـ PUserName
    
    if (error) throw error;

    return data.map(item =>{
    const arena=item.Arena;
     return{
      ...arena,
      userPoints: item.points,
      playerCount: arena.Joins?.length || 0,
      playerAvatars: arena.Joins?.slice(0, 3).map(j => j.Member?.Profile?.profilePic)||[]
     };
    });
  }catch(error){
  console.error(" خطا في جلب ساحاتي ",error);
  return[];
      
}
  },

  // 3. جلب محتويات الساحة (المنشورات)
  getArenaContent: async (arenaName) => {
    try{
    const { data, error } = await supabase
      .from('ArenaItem')
      .select(`*, Profile:PUserName(profilePic), Item_Reactions (
          item_id,
          reaction,
          PUserName
        )`)
      .eq('ArenaName', arenaName)
      .order('created_at', { ascending: false });
    
    if (error) {
        console.error("خطا في جلب الرسائل",error.message);
        return [];
    }
    return  data.map(msg =>{
      const rawReactions= msg.Item_Reactions || [];
      const reactionsArray=Array.isArray(rawReactions)?rawReactions:[]
      return {
        ...msg,
        // تنفيذ الـ reduce على المصفوفة المضمونة
        reactions: reactionsArray.reduce((acc, curr) => {
          if (!acc[curr.reaction]) acc[curr.reaction] = [];
          acc[curr.reaction].push(curr);
          return acc;
        }, {})
      };
    });
  } catch (error) {
    console.error("خطأ في جلب محتوى الساحة:", error);
    return [];
}
},

  
  toggleReaction: async (itemId, reaction, userName, arenaName) => {
  
  // 1. search
  const { data: existing, error: fetchError } = await supabase
    .from('Item_Reactions')
    .select('*')
    .eq('item_id', itemId)
    .eq('reaction', reaction)
    .eq('PUserName', userName)
    .maybeSingle();

  if (fetchError) {
    console.error("خطأ أثناء البحث:", fetchError.message);
    return;}
  //if user already clicked reaction then delete it
  if (existing) {
    const { error: deleteError } = await supabase
      .from('Item_Reactions')
      .delete()
      .eq('id', existing.id);

    if (deleteError) console.error("خطأ في الحذف:", deleteError.message);
    else console.log("تم الحذف بنجاح ✅");
    return { action: 'deleted' };
  //new reaction
  } else {
    const { data: insertedData, error: insertError } = await supabase
      .from('Item_Reactions')
      .insert({
        item_id: itemId,
        reaction: reaction,
        PUserName: userName,
        Arena_Name: arenaName
      })
    if (insertError) console.error("خطأ في الإضافة:", insertError.message);
    else console.log("تمت الإضافة بنجاح ✅ البيانات المضافة:", insertedData);
    return { action: 'inserted' };
  }
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

  // 4.insert new message to arena and increase user point
  addArenaItem: async (arenaName, body) => {
    //get user
    const { data: { user } } = await supabase.auth.getUser();
    const { data: memberData } = await supabase
        .from('Member')
        .select('userName')
        .eq('email', user.email) 
        .single();
    //add new arena item
    const { data, error } = await supabase
      .from('ArenaItem')
      .insert([
        { 
          ArenaName: arenaName, 
          body: body,
          PUserName:memberData.userName,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('it-IT') } ]);
    
    if (error) throw error;
    //increse user points to that arena
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

deleteArena: async (arenaName) => {
  try {
    const { error } = await supabase
      .from('Arena')
      .delete()
      .eq('name', arenaName);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
},

uploadImage: async (file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`; // اسم عشوائي عشان ما تتكرر الأسماء
    const filePath = `arenas/${fileName}`;

    // 1. رفع الملف للـ Bucket (تأكدي إن عندك Bucket اسمه 'arena-assets')
    const { error: uploadError } = await supabase.storage
      .from('arena-assets') 
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. جلب الرابط العام (Public URL) للصورة
    const { data } = supabase.storage
      .from('arena-assets')
      .getPublicUrl(filePath);

    console.log("الرابط :", data.publicUrl)

    return { success: true, url: data.publicUrl };
  }catch (error) {

    return { success: false, error: error.message };
  }
},

// جلب عينات من رسايل الساحات الثانية
async getOtherArenasMessages(currentArenaName) {
  const { data, error } = await supabase
    .from('ArenaItem')
    .select('body, ArenaName')
    .neq('ArenaName', currentArenaName) // استبعاد الساحة الحالية
    .order('created_at', { ascending: false })
    .limit(10); // نجيب آخر 10 رسايل عشان نختار منها

  if (error) throw error;
  return data;
},

}
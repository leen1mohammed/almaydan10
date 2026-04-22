'use client';
import React, { useState,useEffect } from 'react';
import ArenaCard from '../../components/ArenaCard';
import { arenaService } from '../../services/arenaService';
import { authService } from '../../services/authService';
import { supabase } from '../../lib/supabase';

export default function ArenaPage() {
  const [activeTab, setActiveTab] = useState('all'); // 'all' أو 'my-arenas'
  const [arenas,setArenas]=useState([]); //مخزن لكل الساحات 
  const [myArenas,setMyArenas]=useState([]); //مخزن ساحات اليوزر بسس
  const [loading,setLoading]=useState(true); //حالة التحميل
  const [role,setRole]=useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newArena, setNewArena] = useState({ name: '', description: '', image: '', logo: '' });

 const loadArenas = async () => {
      try {
        setLoading(true)
        // 1. نجيب كل الساحات من جدول Arena
        const allData = await arenaService.getAllArenas();
        setArenas(allData);

        // 2. نشوف مين اليوزر اللي داخل الحين
        const user = await authService.getCurrentUser();
        console.log("userrr",user);
        
        // 3. لو مسجل دخول، نجيب ساحاته ونقاطه من جدول Joins
        if (user?.userName) {
          const myData = await arenaService.getMyArenas(user.userName);
          setMyArenas(myData);

          const userRole= await authService.getUserRole(user.userName);
          setRole(userRole)
          console.log("تم التعرف على المستخدم",user.userName,"بدور:",userRole);

      }
      } 
      catch (error) {
        console.error("مشكلة في جلب الساحات:", error);
      } finally {
        setLoading(false);
      }
    };

useEffect(() => {

    loadArenas();
     // 2. إعداد "المستمع" اللحظي (Realtime Subscription)
  const channel = supabase
    .channel('arena-updates') // اسم القناة (أي اسم من عندك)
    .on(
      'postgres_changes', 
      { event: '*', schema: 'public', table: 'Arena' }, 
      (payload) => {
        console.log('تغيير جديد في الميدان!', payload);
        loadArenas(); // بمجرد ما يحس بتغيير، يحدث القائمة عند اليوزر فوراً
      }
    )
    .subscribe();

  // 3. تنظيف المستمع عند الخروج من الصفحة
  return () => {
    supabase.removeChannel(channel);
  };


  }, []);


  const handleRemoveArena = (arenaName) => {
  setArenas(prev => prev.filter(a => a.name !== arenaName));
  };

  const handleCreateSubmit = async () => {

  setLoading(true); // اختياري: عشان تظهر حالة تحميل
  console.log("بدا الانشاء ...")
  console.log("الملف المختار", newArena.imageFile)
  
  try {
    console.log(" جاري استدعاء دالة الرفع...")
    // 1. رفع صورة الخلفية
    let imageUrl = "";
    if (newArena.imageFile) {
      const upload = await arenaService.uploadImage(newArena.imageFile);
      console.log("نتيجة الرفع ", upload)
      if (upload.success) imageUrl = upload.url;
    }

    // 2. رفع اللوقو
    let logoUrl = "";
    if (newArena.logoFile) {
      const upload = await arenaService.uploadImage(newArena.logoFile);
      if (upload.success) logoUrl = upload.url;
    }
    // 3. حفظ الساحة في الداتابيز بالروابط الجديدة
    const result = await arenaService.createArena({
      name: newArena.name,
      description: newArena.description,
      image: imageUrl, // الرابط اللي جابه الكود أوتوماتيكياً
      logo: logoUrl
    });

    if (result.success) {
      alert("تم الإنشاء والرفع بنجاح! 🚀");
      setShowCreateModal(false);
      loadArenas(); // تحديث القائمة فورا
    }
  } catch (error) {
    alert("فشل الرفع: " + error.message);
  } finally {
    setLoading(false);
  }
};


   

  useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const targetId = urlParams.get('target');

  if (targetId) {
    // ننتظر شوي لين الكروت تتحمل
    setTimeout(() => {
      const element = document.getElementById(`arena-${targetId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 2000); 
  }
}, [arenas]); // يشتغل لما الساحات تتحمل



  return (
    
    <main className="relative min-h-[1624px] w-full bg-[#061125] overflow-hidden font-['Cairo'] flex flex-col items-center pt-10">
      {/* --- العناصر المتوهجة (Glow Effects) --- */}
      {/* التوهج الوردي */}
      <div className="absolute top-[10%] left-[-100px] w-[320px] h-[320px] rotate-[48.029deg] rounded-full bg-[rgba(255,39,240,0.44)] blur-[70.75px] pointer-events-none" />
      
      {/* التوهج الأخضر */}
      <div className="absolute bottom-[50%] right-[-100px] w-[320px] h-[320px] rotate-[48.029deg] rounded-full bg-[rgba(41,255,100,0.12)] blur-[70.75px] pointer-events-none" />
      <div className="absolute top-[70%] right-[50px] w-[320px] h-[320px] rotate-[48.029deg] rounded-full bg-[rgba(255,39,240,0.44)] blur-[70.75px] pointer-events-none" />


  {/* --- الخط الأخضر المتعرج --- */}
      {/* يظهر فقط إذا كنا في تبويب "الساحات" */}
      {activeTab === 'all' && (
        <div className="absolute top-[420px] z-0 scale-110 opacity-50 animate-fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" width="1105" height="1424" viewBox="0 0 1105 1424" fill="none">
            <path 
              d="M55 5.5H1088.5C1094.58 5.5 1099.5 10.4249 1099.5 16.5V415.5C1099.5 421.575 1094.58 426.5 1088.5 426.5H16.5C10.4248 426.5 5.5 431.425 5.5 437.5V898.5C5.5 904.575 10.4249 909.5 16.5 909.5H1088.5C1094.58 909.5 1099.5 914.425 1099.5 920.5V1407.5C1099.5 1413.58 1094.58 1418.5 1088.5 1418.5H59" 
              stroke="#29FF64" 
              strokeOpacity="0.25" 
              strokeWidth="11" 
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      {/* --- حاوية الأزرار (The Tabs) --- */}
      <div className="z-10 flex gap-4 mb-16"> 
  {/* زر الساحات */}
  <button
    onClick={() => setActiveTab('all')}
    className={`flex items-center justify-center w-[201px] py-2 px-4 rounded-[30px] border-[1.4px] transition-all 
        duration-500 font-['Cairo'] font-[1000] text-[16px] text-white shadow-[0_2px_2px_0_#000] ${
      activeTab === 'all' 
      ? 'border-[#B37FEB] shadow-[0_0_16px_0_rgba(41,255,100,0.4)]' // أخضر (النشط)
      : 'border-[#B37FEB] shadow-[0_0_16px_0_rgba(146,84,222,0.32)]' // بنفسجي (الآخر)
    }`}
    style={{
      background: activeTab === 'all' 
        ? 'linear-gradient(319deg, rgba(255, 255, 255, 0.8) 11.46%, rgba(255, 255, 255, 0.8) 34.44%, rgba(255, 255, 255, 0) 66.52%, rgba(255, 255, 255, 0.8) 94.3%), rgba(41, 255, 100, 0.53)' // الأخضر الفسفوري
        : 'linear-gradient(319deg, rgba(255, 255, 255, 0.8) 11.46%, rgba(255, 255, 255, 0.8) 34.44%, rgba(255, 255, 255, 0) 66.52%, rgba(255, 255, 255, 0.8) 94.3%), #12082A', // البنفسجي الغامق
      backgroundBlendMode: 'soft-light, normal'
    }}
  >
    الساحات
  </button>

  {/* 1. زر إنشاء ساحة جديدة (+): للأدمن فقط */}
    {role === 'admin' && (
      <button 
        onClick={() => setShowCreateModal(true)} // بنجهز المودال لاحقاً
        className="flex items-center justify-center w-12 h-12 rounded-full text-[#29FF64] 
        text-4xl font-light hover:bg-[#29FF64]/10 transition-all duration-300"
        title="إنشاء ساحة جديدة"
      >
        +
      </button>
    )}

  {/* زر ساحاتي */}
  {role==='participant'&& (
  <button
    onClick={() => setActiveTab('my-arenas')}
    className={`flex items-center justify-center w-[201px] py-2 px-4 rounded-[30px] border-[1.4px] transition-all duration-500 font-['Cairo'] font-[1000] text-[16px] text-white shadow-[0_2px_2px_0_#000] ${
      activeTab === 'my-arenas' 
      ? 'border-[#B37FEB] shadow-[0_0_16px_0_rgba(41,255,100,0.4)]' // أخضر (النشط)
      : 'border-[#B37FEB] shadow-[0_0_16px_0_rgba(146,84,222,0.32)]' // بنفسجي (الآخر)
    }`}
    style={{
      background: activeTab === 'my-arenas' 
        ? 'linear-gradient(319deg, rgba(255, 255, 255, 0.8) 11.46%, rgba(255, 255, 255, 0.8) 34.44%, rgba(255, 255, 255, 0) 66.52%, rgba(255, 255, 255, 0.8) 94.3%), rgba(41, 255, 100, 0.53)' // الأخضر الفسفوري
        : 'linear-gradient(319deg, rgba(255, 255, 255, 0.8) 11.46%, rgba(255, 255, 255, 0.8) 34.44%, rgba(255, 255, 255, 0) 66.52%, rgba(255, 255, 255, 0.8) 94.3%), #12082A', // البنفسجي الغامق
      backgroundBlendMode: 'soft-light, normal'
    }}
  >
    ساحاتي
  </button>
)}
</div>

      {/* --- المربع الأخضر مع العبارة --- */}
      {/* يظهر فقط في صفحة "الساحات" */}
      {/* --- منطقة المحتوى (تظهر فقط في "الساحات") --- */}
 {loading ? (
        <div className="text-white col-span-3 text-center opacity-60 animate-pulse">جاري تحميل الميدان...</div>
      ) : (
        <>
          {/* --- تبويب الساحات (الكل) --- */}
          {activeTab === 'all' && (
            <div className="z-10 w-full max-w-[1200px] flex flex-col items-center">
              {/* الصف العلوي (أول 3) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-6 justify-items-center w-full">
                {arenas.slice(0, 3).map((arena) => (
                  <div key={arena.name} id={`arena-${arena.name}`}>
                  <ArenaCard
                  {...arena}
                    name={arena.name}
                    image={arena.pic} // التأكد من مسمى picture
                    logo={arena.logo || "/images/logo.png"}
                    description={arena.description}
                    isjoined={myArenas.some(m => m.name === arena.name)}
                    role={role}
                    onDeleteSuccess={handleRemoveArena}
                  />
                  </div>
                ))}
              </div>

              {/* المربع الأخضر */}
<div className="flex items-center justify-center w-[798px] h-[163px] rounded-[13px] border-[6px] border-[#29FF64] 
                bg-[#020C1F] shadow-[0_42px_61.3px_-30px_rgba(255,39,240,0.30)] my-40">
                <h2 className="text-[#FFFDFD] text-center text-[40px] leading-[60px]">
                  <span className="font-normal" style={{ textShadow: '0 3px 0 #FF27F0' }}>ماهي الشجاعة</span>
                  <span> </span>
                  <span className="font-[1000]" style={{ textShadow: '0 3px 0 #FF27F0' }}>دون دفعة من التهور؟ </span>
                </h2>
              </div>

              {/* الصف السفلي (البقية) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-6 justify-items-center w-full">
                {arenas.slice(3).map((arena) => (
                  <div key={arena.name} id={`arena-${arena.name}`}>
                  <ArenaCard
                    {...arena}
                    name={arena.name}
                    image={arena.pic}
                    logo={arena.logo || "/images/logo.png"}
                    description={arena.description}
                    isjoined={myArenas.some(m => m.name === arena.name)}
                    role={role}
                    onDeleteSuccess={handleRemoveArena}
                  />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- تبويب ساحاتي --- */}
          {activeTab === 'my-arenas' && (
            <div className="z-10 w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-3 gap-12 px-8 justify-items-center">
              {myArenas.length > 0 ? (
                myArenas.map((arena) => (
                  <ArenaCard
                    {...arena}
                    key={arena.name}
                    name={arena.name}
                    image={arena.pic}
                    logo={arena.logo || "/images/logo.png"}
                    description={arena.description}
                    points={arena.userPoints}
                    isjoined={true}
                    onDeleteSuccess={handleRemoveArena}
                  />
                ))
              ) : (
                <div className="text-white col-span-3 text-center opacity-60">لم تنضم لأي ساحة بعد.. الميدان ينتظرك!</div>
              )}
            </div>
          )}
        </>
      )}
      {showCreateModal && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
    <div className="bg-[#020C1F] border-2 border-[#29FF64] w-full max-w-[500px] rounded-[30px] p-8 relative 
    shadow-[0_0_50px_rgba(41,255,100,0.2)]">
      
      {/* زر الإغلاق */}
      <button onClick={() => setShowCreateModal(false)} className="absolute top-6 left-6 text-gray-400 hover:text-white">✕</button>

      <h2 className="text-white font-['Cairo'] font-black text-2xl mb-6 text-center">إنشاء ساحة جديدة</h2>
      <div className="space-y-4">
        <div>
          <label className="text-white font-['Cairo'] block mb-2 mr-2">اسم الساحة</label>
          <input 
            type="text" 
            className="w-full bg-[#040F23] border border-gray-700 rounded-xl p-3 text-white focus:border-[#B37FEB] outline-none transition-all"
            placeholder="مثلاً: محبين Valorant"
            onChange={(e) => setNewArena({...newArena, name: e.target.value})}
          />
        </div>

        <div>
          <label className="text-white font-['Cairo'] block mb-2 mr-2">وصف الساحة </label>
          <input 
            type="text" 
            className="w-full bg-[#040F23] border border-gray-700 rounded-xl p-3 text-white
             focus:border-[#B37FEB] outline-none transition-all"
            placeholder="اكتب وصف الساحة هنا..."
            onChange={(e) => setNewArena({...newArena, description: e.target.value})}
          />
        </div>

        <div>
          <label className="text-white font-['Cairo'] block mb-2 mr-2">  صورة الساحة </label>
          <input 
            type="file" 
            accept='image/*'
            className="w-full bg-[#040F23] border border-gray-700 rounded-xl p-3 text-white
            focus:border-[#B37FEB] outline-none transition-all
            file:mr-4 file:py-1 file:px-2 file:rounded-full 
            file:border-0 file:text-sm file:bg-[#29FF64] file:text-black cursor-pointer"
            placeholder=" الصورة هنا..."
            onChange={(e) => setNewArena({...newArena, imageFile: e.target.files[0]})}
          />
        </div>

        <div>
          <label className="text-white font-['Cairo'] block mb-2 mr-2">شعار الساحة </label>
          <input 
            type="file" 
            accept='image/*'
            className="w-full bg-[#040F23] border border-gray-700 rounded-xl p-3 text-white
            focus:border-[#B37FEB] outline-none transition-all
            file:mr-4 file:py-1 file:px-2 file:rounded-full 
            file:border-0 file:text-sm file:bg-[#29FF64] file:text-black cursor-pointer"
            placeholder=" اللوقو هنا..."
            onChange={(e) => setNewArena({...newArena, logoFile: e.target.files[0] })}
          />
        </div>

        <button 
          onClick={handleCreateSubmit}
          className="flex  justify-center mx-auto w-[201px] py-2 px-4 rounded-[30px] border-[1.4px] transition-all 
        duration-500 font-['Cairo'] font-[1000] text-[16px] text-white shadow-[0_2px_2px_0_#000] 
        border-[#B37FEB] shadow-[0_0_16px_0_rgba(146,84,222,0.32)]"
        >
         انشاء الساحة
        </button>
      </div>
    </div>
  </div>
      )}
    </main>
  );
}
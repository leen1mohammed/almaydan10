'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/authService';
import { arenaService } from '../services/arenaService';

export default function ArenaCard({ name, image, logo, description, points, isjoined ,role}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const router = useRouter();

  const handleCardClick = () => {
    if (isjoined && points !== undefined) {
      router.push(`/arena/${name}`);
    } else {
      setIsFlipped(!isFlipped);
    }
  };

  const handleJoin = async (e) => {
  e.stopPropagation(); // عشان ما ينقلب الكرت وحنا نضغط الزر
  
  if(isjoined){
    router.push(`/arena/${encodeURIComponent(name)}`)
    return
  }
  try {
    // 1. نجيب اليوزر الحالي من الـ authService
    const currentUser = await authService.getCurrentUser();
    
    if (!currentUser) {
      alert("لازم تسجل دخول أول يا بطل! 🏆");
      router.push("/login");
      return;
    }

    // 2. نرسل طلب الانضمام للسيرفس
    const result = await arenaService.joinArena(currentUser.userName, name);
    
    if (result.success) {
      alert(`كفو! تم انضمامك لـ ${name} بنجاح 🔥`);
      // 3. تحديث الصفحة عشان يظهر زر "دخول" بدل "انضمام"
      window.location.reload(); 
    }
  } catch (error) {
    console.error("خطأ في الانضمام:", error);
    alert("حصلت مشكلة بسيطة، جرب مرة ثانية.");
  }
};

const handleDelete = async (arenaName) => {
  const result = await arenaService.deleteArena(arenaName);
  if (result.success) {
    alert("تم مسح الساحة من الميدان!");
    window.location.reload(); 
  } else {
    alert("فشل الحذف: " + result.error);
  }
};


  return (
    <div 
      className="relative cursor-pointer"
      style={{ width: '295px', height: '434px', perspective: '1000px' }}
      onClick={handleCardClick}
    >
      {/* حاوية الدوران */}
      <div 
        className="relative w-full h-full transition-transform duration-500"
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        
        {/* --- الوجه الأمامي --- */}
        <div 
          className="absolute inset-0"
          style={{
            borderRadius: '30px',
            border: '1px solid #29FF64',
            boxShadow: '0 6px 37.5px -15px #FF27F0',
            background: `linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%), url(${image}) 
            lightgray 50% / cover no-repeat`,
            backfaceVisibility: 'hidden', // تمنع ظهور ظهر الوجه الأمامي
            WebkitBackfaceVisibility: 'hidden',
            zIndex: 2
          }}
        >
          {points !== undefined && (
            <div className="absolute top-5 right-5 bg-[#29FF64] text-[#020C1F] px-3 py-1 rounded-full font-black text-[12px] shadow-[0_0_15px_#29FF64]">
              {points} نقطة
            </div>
          )}

          {/* المربع السفلي */}
          <div 
            className="absolute bottom-0 left-0 flex flex-col items-center pt-8"
            style={{
              width: '100%',
              height: '164.204px',
              borderRadius: '30px',
              border: '1px solid #29FF64',
              background: 'linear-gradient(180deg, #061125 0%, #020C1F 100%)',
              boxShadow: '0 6px 37.5px -15px #FF27F0'
            }}
          >
            <div className="absolute -top-[22.5px] flex items-center justify-center overflow-hidden"
              style={{ width: '168px', height: '60px', background: '#040F23', border: '1px solid #29FF64', borderRadius: '8px' }}>
              <img src={logo} alt="Logo" className="h-full w-full object-cover object-center" />
            </div>

            <h3 className="mt-4 text-white text-center font-['Cairo'] font-[900] text-[19px] leading-[24px] w-[200px]">
              {name}
            </h3>

            <div className="mt-6 flex items-center gap-1 opacity-70">
               <div className="w-6 h-6 rounded-full bg-gray-600 border border-pink-500"></div>
               <div className="w-6 h-6 rounded-full bg-gray-500 border border-pink-500 -ml-2"></div>
               <div className="text-[12px] text-white mr-2">عدد اللاعبين</div>
            </div>
          </div>
        </div>

        {/* --- الوجه الخلفي --- */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
          style={{
            borderRadius: '30px',
            border: '2px solid #FF27F0',
            background: '#061125',
            boxShadow: '0 0 20px #FF27F0',
            transform: 'rotateY(180deg)', // مقلوب جاهز
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <h3 className="text-[#29FF64] font-['Cairo'] font-[900] text-[22px] mb-4">{name}</h3>
          <p className="text-white font-['Cairo'] text-[14px] leading-[22px] mb-8 opacity-90">
            {description || "هذه الساحة مخصصة لأبطال الميدان. انضم الآن لتثبت شجاعتك وتجمع النقاط!"}
          </p>

          <div className="flex flex-col gap-3 w-full items-center">
  {role === 'admin' ? (
    <>
      {/* زر دخول الساحة للأدمن */}
      <button 
        onClick={() => router.push(`/arena/${name}`)}
        className="flex items-center justify-center w-[150px] py-2 px-4 rounded-[30px] 
            border-[1.4px] border-[#B37FEB] transition-all duration-500 font-['Cairo'] font-[800] 
            text-[16px] text-white shadow-[0_0_16px_0_rgba(41,255,100,0.4)] hover:scale-105"
            style={{
              background: 'linear-gradient(319deg, rgba(255, 255, 255, 0.8) 11.46%, rgba(255, 255, 255, 0.8) 34.44%, rgba(255, 255, 255, 0) 66.52%, rgba(255, 255, 255, 0.8) 94.3%), rgba(41, 255, 100, 0.53)',
              backgroundBlendMode: 'soft-light, normal'}}
      >
        دخول الساحة
      </button>
      {/* زر حذف الساحة للأدمن */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          if(confirm(`هل أنتِ متأكدة من حذف ساحة ${name}؟`)) {
             handleDelete(name);
          }
        }}
        className="flex items-center justify-center w-[150px] py-2 px-4 rounded-[30px] 
    border-[1.4px] transition-all duration-500 font-['Cairo'] font-[800] 
    text-[16px] text-white shadow-[0_0_16px_0_rgba(255,0,0,0.4)] hover:scale-105"
  style={{
    background: 'linear-gradient(319deg, rgba(255, 255, 255, 0.8) 11.46%, rgba(255, 255, 255, 0.8) 34.44%, rgba(255, 255, 255, 0) 66.52%, rgba(255, 255, 255, 0.8) 94.3%), rgba(255, 0, 0, 0.53)',
    backgroundBlendMode: 'soft-light, normal',
    borderColor: '#FF4D4F'
  }}
      >
        حذف الساحة 🗑️
      </button>
    </>
  ) : (
    /* زر الانضمام/الدخول العادي للمشارك (كودك القديم) */
                  <button 
            onClick={handleJoin}
            className="flex items-center justify-center w-[150px] py-2 px-4 rounded-[30px] 
            border-[1.4px] border-[#B37FEB] transition-all duration-500 font-['Cairo'] font-[800] 
            text-[16px] text-white shadow-[0_0_16px_0_rgba(41,255,100,0.4)] hover:scale-105"
            style={{
              background: 'linear-gradient(319deg, rgba(255, 255, 255, 0.8) 11.46%, rgba(255, 255, 255, 0.8) 34.44%, rgba(255, 255, 255, 0) 66.52%, rgba(255, 255, 255, 0.8) 94.3%), rgba(41, 255, 100, 0.53)',
              backgroundBlendMode: 'soft-light, normal'
            }}
          >
              {isjoined? "دخول الساحة":"انضمام"}
                </button>
  )}

    </div>
    </div>
    </div>
    </div>
    );
    }

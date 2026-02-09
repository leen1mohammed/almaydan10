'use client';
import React, { useState } from 'react';
import Navbar from "@/components/Navbar";

export default function ArenaPage() {
  const [activeTab, setActiveTab] = useState('all'); // 'all' أو 'my-arenas'

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
        <div className="absolute top-[250px] z-0 opacity-50 animate-fade-in">
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
    className={`flex items-center justify-center w-[201px] py-2 px-4 rounded-[30px] border-[1.4px] transition-all duration-500 font-['Cairo'] font-[1000] text-[16px] text-white shadow-[0_2px_2px_0_#000] ${
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

  {/* زر ساحاتي */}
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

</div>

      {/* --- المربع الأخضر مع العبارة --- */}
      {/* يظهر فقط في صفحة "الساحات" */}
      {activeTab === 'all' && (
        <div className="z-10 flex items-center justify-center w-[600px] h-[120px] rounded-[13px] border-[6px] border-[#29FF64] bg-[#020C1F] shadow-[0_42px_61.3px_-30px_rgba(255,39,240,0.30)] my-118 animate-fade-in">
          <h2 className="text-[#FFFDFD] text-center text-[40px] leading-[60px]">
            <span className="font-normal" style={{ textShadow: '0 3px 0 #FF27F0' }}>ماهي الشجاعة </span>
            <span className="font-[1000]" style={{ textShadow: '0 3px 0 #FF27F0' }}>دون دفعة من التهور؟</span>
          </h2>
        </div>
      )}

      {/* --- منطقة الكروت --- */}
      <div className="z-10 w-full max-w-[1200px] px-8 py-10">
        {activeTab === 'all' ? (
          <div className="grid grid-cols-3 gap-y-12 gap-x-6">
            {/* هنا كروت كل الساحات */}
          </div>
        ) : (
<div className="grid grid-cols-3 gap-y-12 gap-x-6">
             {/* هنا كروت ساحاتي فقط (بدون الخلفية والعبارة) */}
          </div>
        )}
      </div>

    </main>
  );
}
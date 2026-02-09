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

      {/* --- منطقة عرض المحتوى (Content Area) --- */}
      <div className="z-10 w-full max-w-[1200px] px-8 text-right">
        {activeTab === 'all' ? (
          <h2 className="text-white text-2xl mb-8">أشهر الساحات</h2>
        ) : ("")}
        
        {/* هنا بنحط الـ Grid حق الكروت لاحقاً */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {/* الكروت بتجي هنا */}
        </div>
      </div>
    </main>
  );
}
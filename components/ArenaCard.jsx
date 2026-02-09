'use client';
import React from 'react';

export default function ArenaCard({ name, image, logo }) {
  return (
    <div 
      className="relative overflow-hidden transition-transform duration-300 hover:scale-105"
      style={{
        width: '295px',
        height: '434px',
        borderRadius: '30px',
        border: '1px solid #29FF64',
        boxShadow: '0 6px 37.5px -15px #FF27F0',
        background: `linear-gradient(0 deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%),
         url(${image}) lightgray 50% / cover no-repeat`
      }}
    >
      {/* المربع السفلي */}
      <div 
        className="absolute bottom-0 left-0 flex flex-col items-center pt-8"
        style={{
          width: '295px',
          height: '164.204px',
          borderRadius: '30px',
          border: '1px solid #29FF64',
          background: 'linear-gradient(180deg, #061125 0%, #020C1F 100%)',
          boxShadow: '0 6px 37.5px -15px #FF27F0'
        }}
      >
        {/* المربع الصغير حق اللوجو (يبرز للأعلى قليلاً) */}
        <div 
          className="absolute -top-[22.5px] flex items-center justify-center overflow-hidden"
          style={{
            width: '168px',
            height: '45px',
            background: '#040F23',
            border: '1px solid #29FF64', // أضفت بوردر خفيف ليبرز
            borderRadius: '8px'
          }}
        >
          {/* هنا يوضع اللوجو */}
          <img src={logo} alt="Logo" className="h-[80%] object-contain" />
        </div>

        {/* اسم الأرينا */}
        <h3 
          className="mt-4 text-white text-center font-['Cairo'] font-[900] text-[19px] leading-[24px]"
          style={{
            width: '200px', // كبّرته شوي عشان يستوعب الأسماء الطويلة
            height: '19.584px'
          }}
        >
          {name}
        </h3>

        {/* هنا ممكن نضيف الـ Avatars لاحقاً */}
        <div className="mt-6 flex items-center gap-1 opacity-70">
           <div className="w-6 h-6 rounded-full bg-gray-600 border border-pink-500"></div>
           <div className="w-6 h-6 rounded-full bg-gray-500 border border-pink-500 -ml-2"></div>
           <span className="text-[12px] text-white mr-2">479 لاعب</span>
        </div>
      </div>
    </div>
  );
}
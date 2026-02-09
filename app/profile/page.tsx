'use client';
import { useState } from "react";
import Glow from "./Glow";

export default function ProfilePage() {
  const [name, setName] = useState("الاسم");
  const [email, setEmail] = useState("Email@gmail.com");
  const [password, setPassword] = useState("password123");
  const [bio, setBio] = useState("اكتب نبذة عنك هنا...");

  return (
    <main className="min-h-screen bg-[#061125] text-white flex flex-col items-center font-['Cairo'] relative overflow-x-hidden" dir="rtl">
      <Glow />

      {/* Main Content Container */}
      <div className="z-10 w-full max-w-[923px] flex flex-col items-center pb-20 px-4">
        
        {/* Title */}
        <h1 className="w-full text-center text-[80px] font-[900] leading-[100px] text-white mt-10 mb-20"
            style={{ textShadow: '0 3px 0 #FF27F0' }}>
          صفحتك الشخصية
        </h1>

        {/* Header Row: Avatar & Save Button */}
        <div className="flex flex-row items-center justify-between w-full mb-16">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-[120px] h-[120px] rounded-full border-[1.5px] border-[#B37FEB] overflow-hidden p-1 bg-[#1A0B36] shadow-[0_0_20px_rgba(179,127,235,0.4)]">
                <img src="/avatar2.png" alt="Profile" className="w-full h-full rounded-full object-cover" />
              </div>
              <button className="absolute bottom-0 right-0 bg-[#74C38E] w-10 h-10 rounded-full border-2 border-[#0B051E] flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                <img src="/edit-icon3.png" alt="edit" className="w-6 h-6 object-contain" />
              </button>
            </div>
            <div className="text-right">
              <h2 className="text-[24px] font-bold">سميرة</h2>
              <p className="text-[16px] opacity-60">@soso9898__98</p>
            </div>
          </div>

          <button className="
            flex items-center justify-center
            w-[160px] h-[45.2px] px-[16px] py-[8px]
            rounded-[30px] border-[1.4px] border-[#B37FEB]
            text-[#0B051E] font-[1000] text-[16px]
            transition-all animate-pulse hover:animate-none active:scale-95
          "
          style={{
            background: 'linear-gradient(319deg, rgba(255, 255, 255, 0.80) 11.46%, rgba(255, 255, 255, 0.80) 34.44%, rgba(255, 255, 255, 0.00) 66.52%, rgba(255, 255, 255, 0.80) 94.3%), rgba(41, 255, 100, 0.53)',
            backgroundBlendMode: 'soft-light, normal',
            boxShadow: '0 0 20px 2px rgba(41, 255, 100, 0.5)'
          }}>
            حفظ التعديلات
          </button>
        </div>

        {/* Input Grid: All fields now have identical sizing */}
        <div className="grid grid-cols-2 gap-x-[115px] gap-y-12 w-full">
          {/* Right Column */}
          <div className="flex flex-col gap-8 items-end">
            <InputField label="اسمك" value={name} onChange={setName} />
            <InputField label="بريدك" value={email} onChange={setEmail} type="email" />
          </div>

          {/* Left Column */}
          <div className="flex flex-col gap-8 items-end">
            <div className="flex flex-col gap-2 w-[404px]">
              <label className="text-[20px] font-[500] text-right">كلمة المرور</label>
              <div className="relative w-full">
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[32px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md px-4 text-right outline-none focus:border-[#FF27F0] focus:ring-1 focus:ring-[#FF27F0] transition-all"
                />
                <button className="absolute left-4 top-1/2 -translate-y-1/2">
                  <img src="/eye-icon.png" alt="show" className="w-5 h-5 opacity-60" />
                </button>
              </div>
            </div>
            
            {/* BIO SECTION: Now uses InputField to match Name size exactly */}
            <InputField label="عنك (Bio)" value={bio} onChange={setBio} />
          </div>
        </div>

        {/* Logout Button */}
        <button className="mt-20 w-[245px] h-[58px] bg-[#A62D44]/60 hover:bg-[#A62D44] text-white font-[800] text-[20px] rounded-[30px] border-[1.4px] border-[#B37FEB] shadow-[0_0_15px_rgba(166,45,68,0.5)] transition-all active:scale-95">
          تسجيل خروج
        </button>
      </div>
    </main>
  );
}

function InputField({ label, value, onChange, type = "text" }) {
  return (
    <div className="flex flex-col gap-2 w-[404px]">
      <label className="text-[20px] font-[500] text-right text-white font-['Cairo']">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[32px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md px-[10px] text-right text-sm outline-none focus:border-[#FF27F0] focus:ring-1 focus:ring-[#FF27F0] transition-all text-white font-['Cairo']"
      />
    </div>
  );
}
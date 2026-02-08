
'use client';
import React, {useState} from "react";
import {  useRouter } from "next/navigation";
import Glow  from "./Glow";
import Link from "next/link";
import { loginUser } from "@/services/authService";

export default function LoginPage() {
  const [userName, setUserName] = useState(''); // غيرنا هنا
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [loginError,setLoginError]=useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    // ننادي الدالة باليوزر نيم والباسورد
    const result = await loginUser(userName, password);

    if (result.success) {
      alert("أهلاً بك مجدداً في الميدان! 🔥");
      router.push('/app'); 
    } else {
      setLoginError(result.message)
    }
  };



  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#061125] text-white font-['Cairo'] p-4 rtl" dir="rtl">
      <Glow/>
      <div className="z-10">
      {/* العنوان الكبير مع الشدو الزهري */}
      <h1 className="text-[80px] font-[900] leading-[100px] text-white text-center mb-20"
          style={{ textShadow: '0 3px 0 #FF27F0' }}>
        مرحبًا بعودتك!
      </h1>

      <form className="w-full max-w-[404px] space-y-6" onSubmit={handleLogin}>
        
        {/* اسم المستخدم */}
        <div className="space-y-2 text-right">
          <label className="block text-[20px] font-[500] text-white">اسم المستخدم</label>
          <input 
            type="text" 
            required
            value={userName}
            onChange={(e)=> setUserName(e.target.value)}
            placeholder="ادخل اسم حسابك..."
            className="w-full h-[32px] p-[10px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md text-right text-sm 
            outline-none focus:border-[#FF27F0] focus:ring-1 focus:ring-[#FF27F0] transition-all"
          />
        </div>

        {/* كلمة المرور */}
        <div className="space-y-2 text-right">
          <label className="block text-[20px] font-[500] text-white">كلمة المرور</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e)=> setPassword(e.target.value)}
            placeholder="ادخل كلمة المرور..."
            className="w-full h-[32px] p-[10px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md text-right text-sm 
            outline-none focus:border-[#FF27F0] focus:ring-1 focus:ring-[#FF27F0] transition-all"
          />
          {loginError && (
            <div className="text-[#FF27F0] text-center text-sm mb-4 animate-pulse font-bold"
       style={{ textShadow: '0 0 10px rgba(255, 39, 240, 0.5)' }}>
           {loginError}
            </div>
          )}
        </div>


        {/* زر تسجيل الدخول (الجرادينت الأخضر) */}
        <button 
            type="submit"
            className="w-full py-[8px] px-[16px] rounded-[30px] border-[1.4px] border-[#B37FEB] font-[1000] text-[20px] leading-[24px]
             text-white transition-all duration-300 animate-pulse hover:animate-none active:scale-95 shadow-[0_0_20px_rgba(41,255,100,0.6)]"
            style={{
            background: 'linear-gradient(319deg, rgba(255, 255, 255, 0.80) 11.46%, rgba(255, 255, 255, 0.80) 34.44%, rgba(255, 255, 255, 0.00) 66.52%, rgba(255, 255, 255, 0.80) 94.3%), rgba(41, 255, 100, 0.53)',
            backgroundBlendMode: 'soft-light, normal',
            boxShadow: '0 0 15px 2px rgba(41, 255, 100, 0.5), 0 0 30px 5px rgba(41, 255, 100, 0.3)'
         }}
        >
         سجل دخول
        </button>

        {/* الروابط السفلية */}
        <div className="text-center mt-4 space-x-2 space-x-reverse text-[14px]">
          <span className="font-[500]">ما عندك حساب؟</span>
          <span></span>
          <Link href="/register" className="font-800 text-white hover:text-[#FF27F0] transition-colors cursor-pointer font-bold">
          تسجيل جديد
          </Link>
        </div>

      </form>
      </div>
    </main>
  );
}
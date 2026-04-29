'use client';
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Glow from "./Glow";
import Link from "next/link";
import { loginUser,signInWithGoogle } from "@/services/authService";

export default function LoginPage() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    const result = await loginUser(userName, password);

    if (result.success) {
      if (result.isFirstLogin) {
        // ✅ First time logging in → go to profile to pick avatar
        router.push('/profile?firstLogin=true');
      } else {
        // ✅ Returning user → go to main app
        router.push('/');
      }
    } else {
      setLoginError(result.message);
    }

    setIsLoading(false);
  };

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center bg-[#05051a] text-white font-['Cairo'] p-4 overflow-hidden"
      dir="rtl"
    >
      <Glow />
      <div className="z-10 w-full max-w-[404px] flex flex-col items-center">
        <h1
          className="text-[80px] font-[900] leading-[100px] text-white text-center mb-20 whitespace-nowrap"
          style={{ textShadow: '0 3px 0 #FF27F0' }}
        >
          مرحبًا بعودتك!
        </h1>

        <form className="w-full space-y-5" onSubmit={handleLogin}>

          {/* اسم المستخدم */}
          <div className="space-y-1 text-right">
            <label className="block text-[20px] font-[500] text-white">اسم المستخدم</label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="ادخل اسم حسابك..."
              className="w-full h-[32px] p-[10px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md text-right text-sm outline-none focus:border-[#FF27F0] focus:ring-1 focus:ring-[#FF27F0] transition-all"
            />
          </div>

          {/* كلمة المرور */}
          <div className="space-y-1 text-right">
            <label className="block text-[20px] font-[500] text-white">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ادخل كلمة المرور..."
              className="w-full h-[32px] p-[10px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md text-right text-sm outline-none focus:border-[#FF27F0] focus:ring-1 focus:ring-[#FF27F0] transition-all"
            />
            {loginError && (
              <div
                className="text-[#FF27F0] text-center text-sm mt-2 animate-pulse font-bold"
                style={{ textShadow: '0 0 10px rgba(255,39,240,0.5)' }}
              >
                {loginError}
              </div>
            )}
          </div>

          {/* زر تسجيل الدخول */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-base btn-green !w-full !py-[8px] !px-[16px] !font-weight:1000 
            transition-all duration-300 animate-pulse hover:animate-none active:scale-95 disabled:opacity-50
             disabled:animate-none"
          >
            {isLoading ? "جاري التحقق..." : "سجل دخول"}
          </button>


          <button
              type="button"
              onClick={async () => {
                const res = await signInWithGoogle();
                if (!res.success) {
                  setLoginError(res.message);
                }
              }}
              className="!w-full !py-[8px] !px-[16px] btn-base btn-purple"
            >
              الدخول باستخدام Google
            </button>

          {/* رابط التسجيل */}
          <div className="text-center mt-4 space-x-2 space-x-reverse text-[14px]">
            <span className="font-[500]">ما عندك حساب؟</span>
            <span></span>
            <Link
              href="/register"
              className="font-[800] text-white hover:text-[#FF27F0] transition-colors cursor-pointer"
            >
              تسجيل جديد
            </Link>
          </div>

          

        </form>
      </div>
    </main>
  );
}
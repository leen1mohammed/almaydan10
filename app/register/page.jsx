'use client';
import Link from 'next/link';
import Glow from '../login/Glow';
import { registerUser, checkUsername,checkEmail,signInWithGoogle } from '@/services/authService';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; 

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userError, setUserError] = useState('');
  const [passError, setPassError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userError || passError) return;

    setIsLoading(true);
    const result = await registerUser(email, password, userName, fullName);

    if (result.success) {
      // ✅ redirect to profile?firstLogin=true directly (auto signed-in)
      router.push(result.redirectTo);
    } else {
      alert("فيه مشكلة: " + result.message);
    }
    setIsLoading(false);
  };

  const handleUsernameChange = async (val) => {
    setUserName(val);
    if (val.length > 2) {
      const isTaken = await checkUsername(val);
      if (isTaken) {
        setUserError('اووه! اسم المستخدم هذا محجوز, جرب واحد ثاني');
      } else {
        setUserError('');
      }
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (val.length > 0 && val.length < 6) {
      setPassError('كلمة المرور قصيرة.. لازم 6 خانات');
    } else {
      setPassError('');
    }
  };

  const handleEmailChange = async (val) => {
  setEmail(val);
  // نتحقق فقط إذا كان الشكل إيميل صحيح @
  if (val.includes('@') && val.includes('.')) {
    const isTaken = await checkEmail(val); // هذي الدالة لازم تكون في الـ authService
    if (isTaken) {
      setEmailError('هذا البريد مسجل مسبقاً، جرب واحد ثاني او سجل دخولك');
    } else {
      setEmailError('');
    }
  }
};

  const handleConfirmPasswordChange = (val) => {
  setConfirmPassword(val);
  if (val !== password) {
    setPassError('كلمات المرور غير متطابقة!');
  } else {
    setPassError('');
  }
};

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-[#05051a] text-white font-['Cairo'] p-4 overflow-hidden rtl" dir="rtl">
      <Glow />

      <div className="z-10 w-full max-w-[404px] flex flex-col items-center">
        <h1 className="text-[80px] font-[900] leading-[100px] text-white text-center mb-20 whitespace-nowrap"
          style={{ textShadow: '0 3px 0 #FF27F0' }}>
          انضم للميدان!
        </h1>

        <form className="w-full space-y-5" onSubmit={handleSubmit}>

          {/* الاسم */}
          <div className="space-y-1 text-right">
            <label className="block text-[20px] font-[500]">الاسم</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ادخل اسمك..."
              className="w-full h-[32px] p-[10px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md text-right text-sm outline-none focus:border-[#FF27F0] transition-all"
            />
          </div>

          {/* اسم المستخدم */}
          <div className="space-y-1 text-right">
            <label className="block text-[20px] font-[500]">اسم المستخدم</label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="ادخل اسم حسابك..."
              className="w-full h-[32px] p-[10px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md text-right text-sm outline-none focus:border-[#FF27F0] transition-all"
            />
            {userError && <p className="text-[#FF27F0] text-xs mt-1 animate-pulse">{userError}</p>}
          </div>

          {/* البريد الإلكتروني */}
          <div className="space-y-1 text-right">
            <label className="block text-[20px] font-[500]">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="ادخل البريد الالكتروني..."
              className="w-full h-[32px] p-[10px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md text-right text-sm outline-none focus:border-[#FF27F0] transition-all"
            />
            {emailError && <p className="text-[#FF27F0] text-xs mt-1 animate-pulse">{emailError}</p>}
          </div>

          {/* كلمة المرور */}
          <div className="space-y-1 text-right">
            <label className="block text-[20px] font-[500]">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="ادخل كلمة مرور..."
              className="w-full h-[32px] p-[10px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md text-right text-sm outline-none focus:border-[#FF27F0] transition-all"
            />
            {passError && <p className="text-[#FF27F0] text-xs mt-1 animate-pulse">{passError}</p>}
          </div>

          {/* تأكيد كلمة المرور */}
          <div className="space-y-1 text-right">
            <label className="block text-[20px] font-[500]">تأكيد كلمة المرور</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e)=> handleConfirmPasswordChange(e.target.value)}
              placeholder="ادخل كلمة المرور مرة اخرى..."
              className="w-full h-[32px] p-[10px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md text-right text-sm outline-none focus:border-[#FF27F0] transition-all"
            />
             {password !== confirmPassword && confirmPassword.length > 0 && (
              <p className="text-[#FF27F0] text-xs mt-1 animate-pulse">كلمات المرور غير متطابقة!</p>
            )}
          </div>

          {/* زر التسجيل */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-[8px] px-[16px] rounded-[30px] border-[1.4px] border-[#B37FEB] font-[1000] text-[20px] leading-[24px] text-white transition-all duration-300 animate-pulse hover:animate-none active:scale-95 disabled:opacity-50 disabled:animate-none"
            style={{
              background: 'linear-gradient(319deg, rgba(255, 255, 255, 0.80) 11.46%, rgba(255, 255, 255, 0.80) 34.44%, rgba(255, 255, 255, 0.00) 66.52%, rgba(255, 255, 255, 0.80) 94.3%), rgba(41, 255, 100, 0.53)',
              backgroundBlendMode: 'soft-light, normal',
              boxShadow: '0 0 15px 2px rgba(41, 255, 100, 0.5), 0 0 30px 5px rgba(41, 255, 100, 0.3)'
            }}>
            {isLoading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
          </button>

          <button
              type="button"
              onClick={async () => {
                const res = await signInWithGoogle();
                if (!res.success) {
                  alert(res.message);
                }
              }}
              className="w-full py-[8px] px-[16px] rounded-[30px] border-[1.4px] transition-all 
              duration-500 font-['Cairo'] font-[1000] text-[16px] text-white shadow-[0_2px_2px_0_#000] 
              border-[#B37FEB] shadow-[0_0_16px_0_rgba(146,84,222,0.32)]"
            >
              التسجيل باستخدام Google
            </button>


          {/* رابط تسجيل الدخول */}
          <div className="text-center mt-4 text-[14px]">
            <span className="font-[500]">عندك حساب؟ </span>
            <span></span>
            <Link href="/login" className="font-[800] text-white transition-all duration-300 hover:text-[#FF27F0]">
              سجل دخولك
            </Link>
          </div>

        </form>
      </div>
    </main>
  );
}
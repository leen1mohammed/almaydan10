'use client';
import Link from 'next/link';
import Glow from '../login/Glow';
import { registerUser,checkUsername } from '@/services/authService';
import { useState } from 'react';


export default function RegisterPage() {

  //تعريف متغيرات عشان نحفظ الي يكتبه
  const [fullName,setFullName]=useState('');
  const [userName,setUserName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [userError,setUserError]=useState('');
  const [passError,setPassError]=useState('');

//تنادي حقت التسجيل
  const handleSubmit=async (e)=>{
    e.preventDefault();
// إذا اليوزر نيم عليه خطأ لا يكمل
  if (userError || passError) return;
    const result=await registerUser(email,password,userName,fullName);
    console.log(result);

    if(result.success){
      alert("تم الانضمام بنجاح");
    }
    else{
      alert("فيه مشكلة" + result.message);
    }
  };

  //تنادي حقت التشييك
  const handleUsernameChange = async (val) => {
  setUserName(val);
  if (val.length > 2) {
    const isTaken = await checkUsername(val);
    if (isTaken) {
      setUserError('اووه! اليوزر هذا محجوز, جرب واحد ثاني');
    } else {
      setUserError(''); // متاح
    }
  }
};

const handlePasswordChange = (val) => {
  setPassword(val);
  if (password.length > 0 && val.length < 6) {
    setPassError('كلمة المرور قصيرة.. لازم 6 خانات')
  } else {
    setPassError('');
  }
  }




  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-[#05051a] 
    text-white font-['Cairo'] p-4 overflow-hidden rtl" dir="rtl">
      
      <Glow />

      <div className="z-10 w-full max-w-[404px] flex flex-col items-center">
        <h1 className="text-[80px] font-[900] leading-[100px] text-white text-center mb-20"
          style={{ textShadow: '0 3px 0 #FF27F0' }}>
          انضم للميدان!
        </h1>

        <form className="w-full space-y-5" onSubmit={handleSubmit}>


          <div className="space-y-1 text-right">
            <label className="block text-[20px] font-[500]">الاسم</label>
            <input 
              type="text" 
              required
              value={fullName}
              onChange={(e)=> setFullName(e.target.value)}
              placeholder="ادخل اسمك..."
              className="w-full h-[32px] p-[10px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md text-right text-sm outline-none focus:border-[#FF27F0] transition-all"
            />
          </div>
          
          <div className="space-y-1 text-right">
            <label className="block text-[20px] font-[500]">اسم المستخدم</label>
            <input 
              type="text" 
              required
              value={userName}
              onChange={(e)=> handleUsernameChange(e.target.value)}
              placeholder="ادخل اسم حسابك..."
              className="w-full h-[32px] p-[10px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md text-right text-sm outline-none focus:border-[#FF27F0] transition-all"
            />
            {userError && <p className="text-[#FF27F0] text-xs mt-1 animate-pulse">{userError}</p>}
          </div>

          <div className="space-y-1 text-right">
            <label className="block text-[20px] font-[500]">البريد الإلكتروني</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e)=> setEmail(e.target.value)}
              placeholder="ادخل البريد الالكتروني..."
              className="w-full h-[32px] p-[10px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md text-right text-sm outline-none focus:border-[#FF27F0] transition-all"
            />
          </div>

          <div className="space-y-1 text-right">
            <label className="block text-[20px] font-[500]">كلمة المرور</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e)=> handlePasswordChange(e.target.value)}
              placeholder="ادخل كلمة مرور..."
              className="w-full h-[32px] p-[10px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md text-right text-sm outline-none focus:border-[#FF27F0] transition-all"
            />
            {passError && <p className="text-[#FF27F0] text-xs mt-1 animate-pulse">{passError}</p>}
            </div>

            <div className="space-y-1 text-right">
            <label className="block text-[20px] font-[500]">تأكيد كلمة المرور</label>
            <input 
                type="password" 
                required
                placeholder="ادخل كلمة المرور مرة اخرى..."
                className="w-full h-[32px] p-[10px] bg-transparent border-[1.5px] border-[#B37FEB] rounded-md text-right text-sm outline-none focus:border-[#FF27F0] transition-all"
            />
            </div>

          <button  type="submit"
            className="w-full py-[8px] px-[16px] rounded-[30px] border-[1.4px] border-[#B37FEB] font-[1000] text-[20px] leading-[24px]
             text-white transition-all duration-300 animate-pulse hover:animate-none active:scale-95 shadow-[0_0_20px_rgba(41,255,100,0.6)]"
            style={{
            background: 'linear-gradient(319deg, rgba(255, 255, 255, 0.80) 11.46%, rgba(255, 255, 255, 0.80) 34.44%, rgba(255, 255, 255, 0.00) 66.52%, rgba(255, 255, 255, 0.80) 94.3%), rgba(41, 255, 100, 0.53)',
            backgroundBlendMode: 'soft-light, normal',
            boxShadow: '0 0 15px 2px rgba(41, 255, 100, 0.5), 0 0 30px 5px rgba(41, 255, 100, 0.3)'
         }}>
            إنشاء الحساب
          </button>

          <div className="text-center mt-4 text-[14px]">
            <span className="font-[500]">عندك حساب؟ </span>
            <Link 
              href="/login" 
              className="font-[800] text-white transition-all duration-300 hover:text-[#FF27F0]"
            >
              سجل دخولك
            </Link>
          </div>

        </form>
      </div>
    </main>
  );
}



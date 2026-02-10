'use client'; // ضروري لاستخدام الـ Hooks
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const LogoSVG = () => (
  <div className="w-[69px] h-[39px] flex-shrink-0">
    <svg
      width="69"
      height="39"
      viewBox="0 0 69 39"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M68.8607 36.5479L58.0343 1.78952C57.6411 0.563509 56.8546 0.00488281 55.5654 0.00488281H41.2647C39.6967 0.00488281 39.0198 0.954052 39.4677 2.4569L50.2941 37.2153C50.6873 38.4413 51.4738 38.9999 52.763 38.9999H67.0638C68.6367 38.9999 69.3087 38.0508 68.8607 36.5479ZM51.3444 5.74439C52.0612 5.74439 52.6485 6.32279 52.6485 7.03961C52.6485 7.75644 52.0612 8.33484 51.3444 8.33484C50.6276 8.33484 50.0353 7.75644 50.0353 7.03961C50.0353 6.32279 50.6226 5.74439 51.3444 5.74439ZM48.985 10.6138C48.2632 10.6138 47.6759 10.0305 47.6759 9.31367C47.6759 8.59685 48.2632 8.01845 48.985 8.01845C49.7067 8.01845 50.2891 8.59685 50.2891 9.31367C50.2891 10.0305 49.7067 10.6138 48.985 10.6138ZM51.3444 12.9719C50.6226 12.9719 50.0353 12.3886 50.0353 11.6718C50.0353 10.9549 50.6226 10.3765 51.3444 10.3765C52.0661 10.3765 52.6485 10.9549 52.6485 11.6718C52.6485 12.3886 52.0612 12.9719 51.3444 12.9719ZM53.659 10.6138C52.9372 10.6138 52.3499 10.0305 52.3499 9.31367C52.3499 8.59685 52.9372 8.01845 53.659 8.01845C54.3807 8.01845 54.9631 8.59685 54.9631 9.31367C54.9631 10.0305 54.3807 10.6138 53.659 10.6138Z"
        fill="#29FF64"
      />
      <path
        d="M27.7322 0H13.4315C12.1373 0 11.3558 0.558626 10.9626 1.78464L0.136202 36.543C-0.311785 38.0459 0.360196 38.9951 1.93313 38.9951H16.2339C17.5231 38.9951 18.3096 38.4364 18.7028 37.2104L29.5242 2.45202C29.9722 0.94917 29.3002 0 27.7322 0ZM16.0298 6.38218C16.0298 6.20421 16.1692 6.06084 16.3484 6.06084H18.1602C18.3394 6.06084 18.4788 6.20421 18.4788 6.38218V8.19648C18.4788 8.28052 18.4489 8.36456 18.3842 8.42388L17.4882 9.29395C17.3688 9.4126 17.1697 9.41754 17.0452 9.2989L16.1244 8.42388C16.0646 8.36456 16.0298 8.28052 16.0298 8.19648V6.38218ZM15.5967 10.8512H13.7699C13.5957 10.8512 13.4514 10.7029 13.4514 10.5299V8.71061C13.4514 8.53264 13.5957 8.38928 13.7699 8.38928H15.5967C15.6863 8.38928 15.766 8.42388 15.8257 8.4832L16.7018 9.38294C16.8262 9.50653 16.8262 9.70427 16.7068 9.82786L15.8307 10.7523C15.766 10.8116 15.6863 10.8512 15.5967 10.8512ZM18.4788 12.8286C18.4788 13.0066 18.3394 13.15 18.1602 13.15H16.3484C16.1692 13.15 16.0298 13.0066 16.0298 12.8286V11.0143C16.0298 10.9303 16.0646 10.8462 16.1244 10.7869L17.0203 9.91685C17.1448 9.7982 17.3389 9.7982 17.4634 9.91685L18.3842 10.7869C18.4439 10.8462 18.4788 10.9303 18.4788 11.0143V12.8286ZM21.0273 10.5299C21.0273 10.7029 20.883 10.8512 20.7038 10.8512H18.877C18.7924 10.8512 18.7078 10.8116 18.648 10.7523L17.772 9.82786C17.6525 9.70427 17.6525 9.50653 17.772 9.38294L18.648 8.4832C18.7078 8.42388 18.7924 8.38928 18.877 8.38928H20.7038C20.883 8.38928 21.0273 8.53264 21.0273 8.71061V10.5299Z"
        fill="#29FF64"
      />
      <path
        d="M31.8075 2.6543H37.1535C37.6463 2.6543 38.0843 2.97069 38.2287 3.44033L42.9624 18.5727C43.1864 19.2944 42.6438 20.0211 41.8872 20.0211H26.9494C26.1878 20.0211 25.6452 19.2845 25.8792 18.5628L30.7373 3.43044C30.8867 2.96574 31.3197 2.6543 31.8075 2.6543Z"
        fill="#29FF64"
      />
    </svg>
  </div>
);

const SearchSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
  >
    <path
      d="M19.5 17.8125L13.6838 11.9953C14.6211 10.7072 15.1253 9.15488 15.1238 7.56188C15.1238 3.39234 11.7314 0 7.56188 0C3.39234 0 0 3.39234 0 7.56188C0 11.7314 3.39234 15.1238 7.56188 15.1238C9.15488 15.1253 10.7072 14.6211 11.9953 13.6838L17.8125 19.5L19.5 17.8125ZM7.56188 12.7355C6.5385 12.7356 5.53809 12.4322 4.68714 11.8637C3.8362 11.2952 3.17296 10.4871 2.78129 9.54165C2.38961 8.5962 2.28711 7.55583 2.48674 6.55211C2.68637 5.5484 3.17916 4.62643 3.90279 3.90279C4.62643 3.17916 5.5484 2.68637 6.55211 2.48674C7.55583 2.28711 8.5962 2.38961 9.54165 2.78129C10.4871 3.17296 11.2952 3.8362 11.8637 4.68714C12.4322 5.53809 12.7356 6.5385 12.7355 7.56188C12.7339 8.9335 12.1883 10.2485 11.2184 11.2184C10.2485 12.1883 8.9335 12.7339 7.56188 12.7355Z"
      fill="white"
    />
  </svg>
);

const LiveDotSVG = () => (
  <svg
    className="animate-blink-live"
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="12"
    viewBox="0 0 13 12"
    fill="none"
  >
    <ellipse cx="6.5" cy="6" rx="6.5" ry="6" fill="#FF0000" />
  </svg>
);


export default function Navbar() {
  const router = useRouter();

  // --- حالات تجريبية (يتم ربطها لاحقاً بـ Supabase) ---
  const [isLoggedIn, setIsLoggedIn] = useState(false); // الحالة 1: هل سجل دخول؟
  const [isAdmin, setIsAdmin] = useState(false);       // الحالة 3: هل هو أدمن؟

  // دالة حماية الروابط (شرط 1)
  const handleProtectedAction = (e, path) => {
    if (!isLoggedIn) {
      e.preventDefault(); // منع الانتقال للرابط
      router.push("/login"); // التوجيه لصفحة تسجيل الدخول
    }
  };

  return (
    <div className="flex justify-center w-full mt-6 px-4 md:px-8">
      <nav
        dir="rtl"
        style={{ fontFamily: "var(--font-cairo)" }}
        className="w-full h-[78px] bg-esport-dark shadow-navbar rounded-2xl grid grid-cols-[auto_1fr_auto] 
        items-center px-6 text-white relative"
      >
        {/* RIGHT: Logo */}
        <div className="justify-self-end">
          <Link href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
            <LogoSVG />
          </Link>
        </div>

        {/* CENTER: Links */}
        <div className="hidden lg:flex items-center justify-center justify-self-center text-[14px] font-normal leading-[16px]">
          <Link href="/matches" className="hover:text-esport-primary transition-colors whitespace-nowrap">
            جدول المباريات
          </Link>

          <div className="mx-5 w-[1px] h-[25px] bg-esport-divider" />

          <Link href="/live" className="flex items-center gap-2 hover:text-esport-primary transition-colors whitespace-nowrap">
            <LiveDotSVG />
            <span>الآن</span>
          </Link>

          <div className="mx-5 w-[1px] h-[25px] bg-esport-divider" />

          {/* الساحة: محمي بشرط تسجيل الدخول (شرط 1) */}
          <Link
            href="/arena"
            onClick={(e) => handleProtectedAction(e, "/arena")}
            className="hover:text-esport-primary transition-colors whitespace-nowrap"
          >
            الساحة
          </Link>

          {/* المعسكر: محمي بشرط تسجيل الدخول + يختفي للأدمن (شرط 1 و 3) */}
          {!isAdmin && (
            <>
              <div className="mx-5 w-[1px] h-[25px] bg-esport-divider" />
              <Link
                href="/camp"
                onClick={(e) => handleProtectedAction(e, "/camp")}
                className="hover:text-esport-primary transition-colors whitespace-nowrap"
              >
                المعسكر
              </Link>
            </>
          )}

          <div className="mx-5 w-[1px] h-[25px] bg-esport-divider" />

          <Link href="/homidan" className="hover:text-esport-primary transition-colors whitespace-nowrap">
            اسأل حميدان
          </Link>
       

         <div className="mx-5 w-[1px] h-[25px] bg-esport-divider" />

          <Link href="/about" className="hover:text-esport-primary transition-colors whitespace-nowrap">
            حول
          </Link>


        </div>

        

        {/* LEFT: Profile + Search */}
        <div className="flex items-center gap-4 justify-self-start">
          {/* صورة البروفايل (شرط 1 و 2) */}
          <div 
            onClick={(e) => isLoggedIn ? router.push("/profile") : router.push("/login")}
            className="w-[49px] h-[49px] rounded-full border-2 border-[#722ED1] hover:border-esport-primary transition-all cursor-pointer overflow-hidden relative"
          >
            <Image
              src={isLoggedIn ? "https://placehold.co/100" : "/default-avatar.png"} // صورة افتراضية لو لم يسجل
              alt="User"
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <SearchSVG />
          </button>
        </div>
      </nav>
    </div>
  );
}
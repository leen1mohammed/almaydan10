import Image from "next/image";
import HeroSection from "@/components/HomePage/HeroSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-esport-dark">
      <HeroSection  />
      <div className="flex flex-col items-center justify-center h-[50vh] text-white">
        <h1 className="text-4xl font-bold"> هنا الصفحة الرئيسية الاولى الهوم بييج</h1>
      </div>
    </main>
  );
}

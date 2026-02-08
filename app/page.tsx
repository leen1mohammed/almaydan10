import Image from "next/image";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-esport-dark">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-[50vh] text-white">
        <h1 className="text-4xl font-bold"> هنا الصفحة الرئيسية الاولى الهوم بييج</h1>
      </div>
    </main>
  );
}

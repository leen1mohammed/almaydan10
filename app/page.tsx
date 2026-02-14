import Image from "next/image";
import HeroSection from "@/components/HomePage/HeroSection";
import HighlightSection from "@/components/HomePage/HighlightSection";
import ArenaSection from "@/components/HomePage/ArenaSection";
import CampSection from "@/components/HomePage/CampSection";
import ChatbotSection from "@/components/HomePage/ChatbotSection";
import ArenaComSection from "@/components/HomePage/ArenaComSection";
export default function Home() {
  return (
    <main className="min-h-screen bg-esport-dark">
      <HeroSection  />
      <HighlightSection  />
      <ArenaSection  />
      <ArenaComSection  />
      <CampSection  />
      <ChatbotSection  />
    </main>
  );
}

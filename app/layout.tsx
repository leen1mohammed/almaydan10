import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import NewNavbar from "@/components/NewNavbar";
import Footer from "@/components/Footer";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "الميدان",
  description: "الميدان ياحميدان",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${cairo.className} ${cairo.variable} bg-esport-dark text-white antialiased min-h-screen flex flex-col`}
      >
        <NewNavbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
  
}
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "萬象 Fatexi | 命的形狀，萬象承載",
  description: "全球首款量化命理趨勢分析平台。即時追蹤你的財富、事業、愛情與能量指數。",
  keywords: "命理,八字,占星,K線,運勢,量化命理,Fatexi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#030308] text-[#E0E0E0] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

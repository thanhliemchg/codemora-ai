import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CodeMora AI",
  description: "Hệ thống hỗ trợ dạy và học lập trình bằng trí tuệ nhân tạo"
}

export default function RootLayout({ children }: any) {
  return (
    <html lang="vi">
      <body className="flex flex-col min-h-screen bg-gray-50">

        <main className="flex-1">
          {children}
        </main>

        <Footer />

      </body>
    </html>
  )
}
"use client"

import { FaFacebookF, FaGithub, FaEnvelope } from "react-icons/fa"

export default function Footer() {
  return (
    <footer className="relative overflow-hidden text-white">

      {/* 🌌 BACKGROUND */}
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-[length:300%_300%]" />

      {/* ✨ GLOW */}
      <div className="absolute top-0 left-1/2 w-[600px] h-[300px] bg-pink-500/30 blur-3xl -translate-x-1/2 -z-10" />

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-start">

        {/* BRAND */}
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 mb-3">
            <img 
              src="/logo.png" 
              alt="logo" 
              className="w-9 h-9 rounded-xl shadow-md"
            />
            <span className="font-bold text-xl">
              CodeMora AI
            </span>
          </div>

          <p className="space-y-2 text-sm text-justify text-white/80 leading-relaxed">
            Nền tảng hỗ trợ dạy và học lập trình bằng trí tuệ nhân tạo, giúp giáo viên tiết kiệm thời gian chấm điểm và phát hiện sao chép code, đồng thời cung cấp phản hồi chi tiết để học sinh cải thiện kỹ năng lập trình.
          </p>

          {/* SOCIAL */}
          <div className="flex gap-3 mt-4">
            <Social 
              icon={<FaFacebookF/>} 
              link="https://facebook.com/thanhliemhg" 
            />
            <Social 
              icon={<FaGithub />} 
              link="https://github.com" 
            />
            <Social 
              icon={<FaEnvelope />} 
              link="mailto:ntliemit@gmail.com" 
            />
          </div>
        </div>

        {/* SYSTEM */}
        <div className="flex flex-col h-full">
          <h3 className="font-semibold mb-3 min-h-[24px]">📚 Hệ thống</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <FooterLink text="Lớp học" />
            <FooterLink text="Giao bài tập" />
            <FooterLink text="Bài nộp" />
            <FooterLink text="Phát hiện copy" />
          </ul>
        </div>

        {/* FEATURES */}
        <div className="flex flex-col h-full">
          <h3 className="font-semibold mb-3 min-h-[24px]">⚡ Tính năng</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <FooterLink text="Chấm điểm tự động" />
            <FooterLink text="Phát hiện sao chép mã nguồn" />
            <FooterLink text="Phân tích code" />
            <FooterLink text="Sinh đề tự động" />
            <FooterLink text="Sinh test tự động" />
          </ul>
        </div>

        {/* CONTACT */}
        <div className="flex flex-col h-full">
          <h3 className="font-semibold mb-3 min-h-[24px]">📞 Liên hệ</h3>
          <ul className="space-y-2 text-sm text-white/80">
          <li>Email: ntliemit@gmail.com</li>
            <li>Hotline: 0855 808 606</li>
            <li>Việt Nam</li>
          </ul>
        </div>

      </div>

      {/* DIVIDER */}
      <div className="border-t border-white/20" />

      {/* BOTTOM */}
      <div className="text-center text-sm text-white/70 py-4 backdrop-blur-md bg-white/5">
        © {new Date().getFullYear()} CodeMora AI • Made with ❤️ by Nguyen Thanh Liem - THPT Chuyen Ha Giang
      </div>

    </footer>
  )
}

/* COMPONENT */

function FooterLink({ text }: { text: string }) {
  return (
    <li className="hover:text-white hover:translate-x-1 transition-all cursor-pointer">
      {text}
    </li>
  )
}

function Social({ icon, link }: { icon: any, link: string }) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="w-9 h-9 flex items-center justify-center bg-white/20 rounded-full hover:bg-white hover:text-purple-600 transition cursor-pointer shadow-lg hover:scale-110"
    >
      {icon}
    </a>
  )
}
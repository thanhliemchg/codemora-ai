"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function Home(){

  const router = useRouter()

  return (
    <div className="min-h-screen text-white overflow-hidden">

      {/* BACKGROUND */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 animate-gradient bg-[length:300%_300%]" />

      {/* ================= HERO ================= */}
      <motion.section
        initial={{ opacity:0, y:40 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.6 }}
        className="text-center px-6 pt-24 pb-16"
      >

        <div className="flex items-center gap-3 px-2">
        <img 
          src="/logo.png" 
          alt="logo" 
          className="w-20 h-20 rounded-xl shadow-md"
        />
        <span className="text-4xl font-bold mb-6 text-white">
          CodeMora AI
        </span>
      </div>

        <p className="text-white/80 text-lg max-w-xl mx-auto">
          Chấm bài tự động • Phát hiện copy • Phân tích chi tiết chỉ trong 1 click
        </p>

        <div className="flex justify-center gap-4 mt-8 flex-wrap">
          <button
            onClick={()=>router.push("/login")}
            className="px-6 py-3 rounded-xl bg-white text-purple-600 font-semibold 
            hover:scale-105 transition shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.6)]"
          >
            Đăng nhập
          </button>

          <button
            onClick={()=>router.push("/register")}
            className="px-6 py-3 rounded-xl border border-white hover:bg-white hover:text-purple-600 transition"
          >
            Đăng ký
          </button>
        </div>

      </motion.section>

      {/* ================= FEATURES ================= */}
      <section className="px-6 py-16 max-w-6xl mx-auto">

        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          🚀 Tính năng nổi bật
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">

          {[
            {icon:"⚡", title:"Chấm tự động", desc:"Chấm bài nhanh chóng, chính xác"},
            {icon:"🚨", title:"Phát hiện copy", desc:"So sánh và phát hiện gian lận"},
            {icon:"🧠", title:"Phân tích code", desc:"Đưa ra nhận xét chi tiết"},
            {icon:"📊", title:"Thống kê", desc:"Theo dõi tiến độ học tập"}
          ].map((f,i)=>(
            <motion.div
              key={i}
              whileHover={{ scale:1.05 }}
              className="bg-white/10 backdrop-blur p-6 rounded-2xl shadow-lg 
              hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-white/70">{f.desc}</p>
            </motion.div>
          ))}

        </div>

      </section>
      {/* ================= DEMO TEXT ================= */}
      <section className="px-6 py-16 text-center">

        <h2 className="text-2xl md:text-3xl font-bold mb-10">
          🧪 Demo AI chấm bài
        </h2>

        <div className="max-w-4xl mx-auto bg-black/30 rounded-2xl p-6 backdrop-blur border border-white/20">

          <pre className="text-left text-sm text-green-400 font-mono whitespace-pre-wrap">

{`Input:
for(int i=0;i<n;i++){
  sum+=a[i];
}

Output:
✔ Độ đúng: 100%
⚡ Độ phức tạp: O(n)
🧠 Gợi ý: Có thể tối ưu bằng prefix sum
`}

          </pre>

        </div>

      </section>

      {/* ================= DASHBOARD PREVIEW ================= */}
      <section className="px-6 py-20 text-center">

        <h2 className="text-3xl font-bold mb-10">
          💻 Giao diện hệ thống
        </h2>

        <motion.div
          initial={{ opacity:0, scale:0.9 }}
          whileInView={{ opacity:1, scale:1 }}
          transition={{ duration:0.5 }}
          className="max-w-5xl mx-auto bg-black/30 backdrop-blur rounded-2xl p-4 border border-white/20 shadow-2xl"
        >
          <img 
            src="/dashboard.png"
            alt="dashboard"
            className="rounded-xl shadow-lg"
          />
        </motion.div>

      </section>

      {/* ================= CTA ================= */}
      <section className="text-center py-20 px-6">

        <div className="bg-white/10 backdrop-blur rounded-2xl p-10 max-w-xl mx-auto border border-white/20">

          <h2 className="text-2xl font-bold mb-4">
            Sẵn sàng nâng cấp việc dạy và học lập trình?
          </h2>

          <button
            onClick={()=>router.push("/register")}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-500 
            hover:scale-105 transition shadow-lg"
          >
            🚀 Bắt đầu
          </button>

        </div>

      </section>

    </div>
  )
}
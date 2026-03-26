"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"

export default function Login(){

  const router = useRouter()

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [showPassword,setShowPassword] = useState(false)
  const [loading,setLoading] = useState(false)

  async function handleLogin(e:any){
    e.preventDefault() // 🔥 bắt enter

    if(loading) return

    setLoading(true)

    try{
      const res = await fetch("/api/login",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({email,password})
      })

      const data = await res.json()

      if(data.user){

        localStorage.setItem("user",JSON.stringify(data.user))

        if(data.user.role==="admin"){
          router.push("/admin")
        }

        if(data.user.role==="teacher"){
          router.push("/teacher")
        }

        if(data.user.role==="student"){
          router.push("/student")
        }

      }else{
        alert("Sai email hoặc mật khẩu ❌")
      }

    }catch(err){
      alert("Lỗi đăng nhập ❌")
    }

    setLoading(false)
  }

  return(

  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-6">

<div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-8">

<div className="flex items-center gap-3 px-12">
  <img 
    src="/logo.png" 
    alt="logo" 
    className="w-9 h-9 items-center rounded-xl shadow-md"
  />
  <span className="text-lg sm:text-xl md:text-3xl font-bold text-white ">
    CodeMora AI
  </span>
</div>

      <p className="text-gray-200 text-center mb-6">
        Đăng nhập hệ thống
      </p>

      {/* 🔥 FORM */}
      <form onSubmit={handleLogin}>

        {/* EMAIL */}
        <div className="relative mb-4">
          <Mail className="absolute left-3 top-3 text-gray-300" size={18}/>

          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            className="w-full pl-10 pr-3 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* PASSWORD */}
        <div className="relative mb-6">
          <Lock className="absolute left-3 top-3 text-gray-300" size={18}/>

          <input
            type={showPassword?"text":"password"}
            required
            placeholder="Mật khẩu"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            className="w-full pl-10 pr-10 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <button
            type="button"
            className="absolute right-3 top-3 text-gray-300"
            onClick={()=>setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
          </button>
        </div>

        {/* BUTTON LOGIN */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold hover:scale-105 transition disabled:opacity-50"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

      </form>

      {/* BACK HOME */}
      <button
        onClick={()=>router.push("/")}
        className="w-full border text-white py-2 mt-3 rounded-lg"
      >
        ← Trang chủ
      </button>

      {/* REGISTER */}
      <p className="text-gray-200 text-center mt-6 text-sm">
        Chưa có tài khoản?{" "}
        <a href="/register" className="text-blue-300 hover:underline">
          Đăng ký
        </a>
      </p>

    </div>

  </div>

  )
}
"use client"

import { useState } from "react"

export default function Header({ user }: any) {

  const [showPassword, setShowPassword] = useState(false)
  const [showName, setShowName] = useState(false)
  
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  async function handleChangePassword(){

    if(!oldPassword || !newPassword || !confirmPassword){
      alert("Nhập đầy đủ thông tin")
      return
    }

    if(newPassword.length < 6){
      alert("Mật khẩu >= 6 ký tự")
      return
    }

    if(newPassword !== confirmPassword){
      alert("Mật khẩu nhập lại không khớp")
      return
    }

    const user = JSON.parse(localStorage.getItem("user")!)

    const res = await fetch("/api/change-password",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
      },
      body:JSON.stringify({
        userId: user.id,
        oldPassword,
        newPassword
      })
    })

    const result = await res.json()

    if(result.success){
      alert("Đổi mật khẩu thành công ✅")
      setShowPassword(false)
    }else{
      alert(result.message || "Sai mật khẩu cũ ❌")
    }
  }
  return (
    <>
      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center px-4 md:px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow">

        {/* ===== LEFT ===== */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* LOGO */}
          <img
            src="/logo.png"
            className="w-8 h-8 md:w-10 md:h-10"
          />

          {/* TITLE */}
          <span className="font-bold text-lg md:text-xl whitespace-nowrap">
            CodeMora AI
          </span>

        </div>

        {/* ===== RIGHT ===== */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* 🔑 ĐỔI MK */}
          <button
            onClick={() => setShowPassword(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm"
          >
            <span className="hidden md:inline">🔑 Đổi MK</span>
            <span className="md:hidden">🔑</span>
          </button>

          <div className="relative">

          <div
            onClick={() => setShowName(!showName)}
            className="bg-white/20 hover:bg-yellow-500 text-white px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm cursor-pointer"
          >
            <span>👤</span>

            {/* Desktop vẫn hiện bình thường */}
            <span className="hidden md:inline">
              {user?.name}
            </span>
          </div>

          {/* 👉 MOBILE HIỆN TÊN */}
          {showName && (
            <div className="absolute right-0 mt-2 bg-white text-gray-800 px-3 py-2 rounded-lg shadow-md text-sm md:hidden">
              {user?.name}
            </div>
          )}

        </div>

          {/* 🚪 LOGOUT */}
          <button
            onClick={() => {
              localStorage.removeItem("user")
              window.location.href = "/login"
            }}
            className="bg-red-500 hover:bg-red-600 px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm"
          >
            <span className="hidden md:inline">Đăng xuất</span>
            <span className="md:hidden">🚪</span>
          </button>

        </div>

      </div>

      {/* ===== MODAL ĐỔI MK ===== */}
      {showPassword && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

        <div className="bg-white p-6 rounded-xl w-80">

          <h2 className="font-bold mb-3 text-center">
            🔐 Đổi mật khẩu
          </h2>

          {/* 👉 MẬT KHẨU CŨ */}
          <input
            type="password"
            placeholder="Mật khẩu cũ"
            value={oldPassword}
            onChange={(e)=>setOldPassword(e.target.value)}
            className="border p-2 w-full mb-3 rounded"
          />

          {/* 👉 MẬT KHẨU MỚI */}
          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e)=>setNewPassword(e.target.value)}
            className="border p-2 w-full mb-3 rounded"
          />

          {/* 👉 NHẬP LẠI */}
          <input
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChange={(e)=>setConfirmPassword(e.target.value)}
            className="border p-2 w-full mb-3 rounded"
          />

          {/* BUTTON */}
          <button
            onClick={handleChangePassword}
            className="w-full bg-blue-600 text-white py-2 rounded mb-2"
          >
            Xác nhận
          </button>

          <button
            onClick={()=>setShowPassword(false)}
            className="w-full bg-gray-200 py-2 rounded"
          >
            Đóng
          </button>

        </div>

      </div>
      )}
    </>
  )
}
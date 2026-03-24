"use client"
import { useState } from "react"

export default function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile button */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 bg-purple-600 text-white px-3 py-2 rounded"
        onClick={() => setOpen(true)}
      >
        ☰
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed md:relative z-50
        top-0 left-0 h-full w-64
        bg-white border-r shadow-sm
        transform transition duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
      >
        <div className="p-4 font-bold text-purple-600 text-lg border-b">
          CodeMora
        </div>

        <div className="p-3 space-y-1 text-sm">
          <div className="p-2 rounded hover:bg-gray-100 cursor-pointer">Lớp học</div>
          <div className="p-2 rounded hover:bg-gray-100 cursor-pointer">Học sinh</div>
          <div className="p-2 rounded hover:bg-gray-100 cursor-pointer">Giao bài tập</div>
          <div className="p-2 rounded hover:bg-gray-100 cursor-pointer">Bài nộp</div>
          <div className="p-2 rounded hover:bg-gray-100 cursor-pointer">Phát hiện copy</div>
          <div className="p-2 rounded hover:bg-gray-100 cursor-pointer">Thống kê</div>
        </div>
      </div>
    </>
  )
}
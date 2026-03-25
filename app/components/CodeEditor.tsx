"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// 👉 load Monaco kiểu lazy (QUAN TRỌNG)
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false
})

export default function CodeEditor({ code, setCode, language }: any) {

  const [isMobile, setIsMobile] = useState(false)

  useEffect(()=>{
    setIsMobile(window.innerWidth < 768)
  },[])

  // 👉 MOBILE: dùng textarea (TRÁNH CRASH)
  if(isMobile){
    return (
      <textarea
    value={code}
    onChange={(e)=>setCode(e.target.value)}
    className="w-full h-[250px] p-3 border rounded-xl font-mono text-sm bg-gray-50"
    placeholder="Nhập code tại đây..."
    />
    )
  }

  // 👉 DESKTOP: dùng Monaco
  return (
    <Editor
      height="400px"
      language={language}
      value={code}
      onChange={(value)=>setCode(value || "")}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14
      }}
    />
  )
}
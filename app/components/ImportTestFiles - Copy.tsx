"use client"

import { useState } from "react"
import JSZip from "jszip"

export default function ImportTestPro({ tests, setTests }: any){

  const [preview,setPreview] = useState<any[]>([])

  async function parseFiles(fileList:any){

    const map:any = {}

    for(const file of fileList){

      let text = ""

      // nếu zip
      if(file.name.endsWith(".zip")){
        const zip = await JSZip.loadAsync(file)

        const entries = Object.keys(zip.files)

        for(const name of entries){
          const f = zip.files[name]
          if(f.dir) continue

          const content = await f.async("string")

          handleOne(name, content, map)
        }

      }else{
        text = await file.text()
        handleOne(file.name, text, map)
      }
    }

    const arr = Object.entries(map)
  .filter(([_,t]:any)=>t.input || t.output)  // 🔥 bỏ test rỗng
  .map(([name,t]:any)=>({
    name,
    input: t.input || "",
    output: t.output || "",
    hidden: name.toLowerCase().includes("hidden")
  }))

    setPreview(arr)
  }

  function handleOne(path:string, text:string, map:any){

  const parts = path.split("/")

  // ✅ lấy folder gần file nhất
  let key = parts.length > 1 
    ? parts[parts.length - 2]   // 🔥 FIX CHÍNH
    : path.replace(/\.(inp|in|out|txt)$/i,"")

  if(!map[key]) map[key] = {}

  const lower = path.toLowerCase()

  if(lower.endsWith(".inp") || lower.endsWith(".in")){
    map[key].input = text
  }
  else if(lower.endsWith(".out")){
    map[key].output = text
  }
}

  function importTests(){
    setTests([
      ...tests,
      ...preview.map(p=>({
        input: p.input,
        output: p.output,
        hidden: p.hidden
      }))
    ])
    setPreview([])
  }

  return(
    <div className="space-y-3">

      {/* DROP ZONE */}
      <div
        onDragOver={(e)=>e.preventDefault()}
        onDrop={(e)=>{
          e.preventDefault()
          parseFiles(e.dataTransfer.files)
        }}
        className="border-2 border-dashed border-gray-300 
                  hover:border-blue-500 hover:bg-blue-50
                  transition-all duration-200
                  p-2 rounded-xl text-center cursor-pointer"
      >
        <div className="text-3xl mb-2">📂</div>

        <div className="font-semibold text-gray-700">
          Kéo thả test vào đây
        </div>

        <div className="text-sm text-gray-500">
          Hỗ trợ .zip / folder / .inp / .out
        </div>
    </div>

      {/* INPUT */}
      <input
        type="file"
        multiple
        onChange={(e)=>parseFiles(e.target.files)}
      />

      {/* PREVIEW */}
      {preview.length > 0 && (
        <div className="border p-3 rounded space-y-2 bg-gray-50">

          <div className="font-bold">
            Preview ({preview.length} test)
          </div>

          {preview.map((t,i)=>(
            <div key={i} className="text-sm border p-2 rounded">

              <div>
                <b>{t.name}</b>
                {t.hidden && " 🔒"}
              </div>

              <div className="text-xs text-gray-600">
                Input: {t.input.slice(0,30)}
              </div>

              <div className="text-xs text-gray-600">
                Output: {t.output.slice(0,30)}
              </div>

            </div>
          ))}

          <button
            onClick={importTests}
            className="bg-green-600 text-white px-3 py-1 rounded"
          >
            ✅ Import vào hệ thống
          </button>

        </div>
      )}

    </div>
  )
}
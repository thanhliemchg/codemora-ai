"use client"

import { useState } from "react"
import ImportTestExcel from "./ImportTestExcel"

export default function TestEditor({ tests, setTests, exercise }: any){

  const [loading,setLoading] = useState(false)

  function addTest(){
    setTests([
      ...tests,
      { input:"", output:"", hidden:false }
    ])
  }

  function removeTest(index:number){
    const t = [...tests]
    t.splice(index,1)
    setTests(t)
  }

  function updateTest(index:number,field:string,value:any){
    const t = [...tests]
    t[index][field] = value
    setTests(t)
  }

async function generateTests(){

  if(!exercise){
    alert("❌ Chưa có đề bài")
    return
  }

  setLoading(true)

  const res = await fetch("/api/generate-tests",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      exercise   // 🔥 QUAN TRỌNG
    })
  })

  const data = await res.json()

  setLoading(false)

  if(data.error){
    alert(data.error)
    return
  }

  setTests(data.tests)
}

  return(

    <div className="bg-white p-6 rounded-xl shadow space-y-4">

      {/* HEADER */}
      <div className="flex gap-2 flex-wrap">

        <ImportTestExcel setTests={setTests} />

        <button
          onClick={addTest}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          ➕ Thêm test
        </button>

        <button
          onClick={generateTests}
          className="bg-purple-600 text-white px-3 py-1 rounded"
        >
          {loading ? "Đang sinh..." : "🤖 Sinh test"}
        </button>

      </div>

      {/* LIST */}
      {tests.map((t:any,i:number)=>(
        <div key={i} className="border p-3 rounded space-y-2">
          <div className={t.hidden ? "text-red-500 text-xs" : "text-green-600 text-xs"}>
              {t.hidden ? "🔒 Hidden" : "🌍 Public"}
          </div>
          <div className="flex justify-between">
            <div>Test {i+1}</div>
            <button
              onClick={()=>removeTest(i)}
              className="text-red-500"
            >
              Xoá
            </button>
          </div>

          <textarea
            value={t.input}
            onChange={(e)=>updateTest(i,"input",e.target.value)}
            placeholder="Input"
            className="border p-2 w-full text-black"
          />

          <textarea
            value={t.output}
            onChange={(e)=>updateTest(i,"output",e.target.value)}
            placeholder="Output"
            className="border p-2 w-full text-black"
          />

          <label>
            <input
              type="checkbox"
              checked={t.hidden}
              onChange={(e)=>updateTest(i,"hidden",e.target.checked)}
            />
            Ẩn test case (học sinh sẽ không thấy)
          </label>

        </div>
      ))}

    </div>
  )
}
"use client"

import { useState } from "react"
import ImportTestExcel from "./ImportTestExcel"
import ImportTestFiles from "./ImportTestFiles"
import { useEffect } from "react";
export default function TestEditor({ tests, setTests, exercise, action,setLoadingtest }: any){

//const [loadingtest,setLoadingtest] = useState(false)
useEffect(() => {
  if (!action?.type) return;

  if (action.type === "add") addTest();
  if (action.type === "generate") generateTests();

}, [action]);

  function addTest(){
    setTests([
      ...tests,
      { input:"", 
        output:"", 
        hidden:false }
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

  setLoadingtest(true)

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

  setLoadingtest(false)

  if(data.error){
    alert(data.error)
    return
  }

  setTests(data.tests)
}

  return(
  <div className="bg-white rounded-xl shadow p-4 space-y-4">

    {/* TITLE */}
 

    {/* TOP GRID */}
    <div className="grid grid-cols-2 gap-4">

      {/* IMPORT */}
      <div className="col-span-2">
        <ImportTestFiles tests={tests} setTests={setTests} />
      </div>

      
    </div>

    {/* STATS */}
    <div className="flex gap-3 text-sm">

      <div className="bg-gray-100 px-3 py-1 rounded">
        📦 {tests.length}
      </div>

      <div className="bg-green-100 text-green-700 px-3 py-1 rounded">
        🌍 {tests.filter((t:any)=>!t.hidden).length}
      </div>

      <div className="bg-red-100 text-red-600 px-3 py-1 rounded">
        🔒 {tests.filter((t:any)=>t.hidden).length}
      </div>

    </div>

    {/* LIST */}
    <div className="space-y-3">
{tests.map((t:any,i:number)=>{

  const shortInput = t.input?.slice(0,50)
  const shortOutput = t.output?.slice(0,50)

  return(
    <details key={i} className="border rounded-lg overflow-hidden group">

      {/* HEADER */}
      <summary className="flex justify-between items-center px-3 py-2 bg-gray-100 cursor-pointer hover:bg-gray-200">

        <div className="flex gap-3 items-center">

          <span className="font-semibold text-sm">
            #{i+1}
          </span>

          <span className={`text-xs px-2 py-1 rounded ${
            t.hidden ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
          }`}>
            {t.hidden ? "Hidden" : "Public"}
          </span>

          {/* PREVIEW MINI */}
          <span className="text-xs text-gray-500 hidden md:block">
            {shortInput?.replace(/\n/g," ")} → {shortOutput}
          </span>

        </div>

        <button
          onClick={(e)=>{
            e.preventDefault()
            removeTest(i)
          }}
          className="text-red-500 hover:underline text-sm"
        >
          🗑
        </button>

      </summary>

      {/* BODY */}
      <div className="p-3 bg-white space-y-3">

        {/* TABLE PREVIEW */}
        <div className="border rounded overflow-hidden text-sm">

          <div className="grid grid-cols-2 bg-gray-100 font-medium">
            <div className="p-2 border-r">Input</div>
            <div className="p-2">Output</div>
          </div>

          <div className="grid grid-cols-2">
            <textarea
              value={t.input}
              onChange={(e)=>updateTest(i,"input",e.target.value)}
              className="p-2 border-r bg-gray-50 text-black font-mono text-xs"
              rows={4}
            />
            <textarea
              value={t.output}
              onChange={(e)=>updateTest(i,"output",e.target.value)}
              className="p-2 bg-gray-50 text-black font-mono text-xs"
              rows={4}
            />
          </div>

        </div>

        {/* OPTION */}
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={t.hidden}
            onChange={(e)=>updateTest(i,"hidden",e.target.checked)}
          />
          🔒 Ẩn test (HS không thấy)
        </label>

      </div>

    </details>
  )
})}
</div>

  </div>
)
}
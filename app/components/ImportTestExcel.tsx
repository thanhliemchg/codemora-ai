"use client"

import * as XLSX from "xlsx"

export default function ImportTestExcel({ setTests }: any){

  async function handleFile(e:any){

    const file = e.target.files[0]
    if(!file) return

    const data = await file.arrayBuffer()

    const workbook = XLSX.read(data)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]

    const json:any[] = XLSX.utils.sheet_to_json(sheet)

    const tests:any[] = []
    const errors:string[] = []

    json.forEach((row:any,index:number)=>{

      const input = row.input ?? row["input"] ?? row["Input"]
      const output = row.output ?? row["output"] ?? row["Output"]
      let hidden = row.hidden ?? row["hidden"] ?? row["Hidden"]

      if(hidden === true || hidden === "true" || hidden === 1){
        hidden = true
      }else{
        hidden = false
      }

      if(!input || !output){
        errors.push(`Dòng ${index+2} thiếu input/output`)
        return
      }

      tests.push({
        input: String(input),
        output: String(output),
        hidden
      })

    })

    if(errors.length){
      alert(errors.join("\n"))
    }

    if(tests.length === 0){
      alert("❌ Không có test hợp lệ")
      return
    }

    setTests(tests)

    alert(`✅ Import ${tests.length} test`)
  }

  return(
    <input
      type="file"
      accept=".xlsx,.xls"
      onChange={handleFile}
      className="border p-2"
    />
  )
}
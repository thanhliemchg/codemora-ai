import { ai } from "@/lib/ai"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request){

try{

const { code, teacherExercise, student_id, class_id } = await req.json()

if(!code && !teacherExercise){
  return Response.json({
    error:"Không có dữ liệu"
  })
}

/* ====== SINH BÀI ====== */

const base = teacherExercise || code

const promptExercise = `
Tạo một bài lập trình mới tương đương nhưng khác hoàn toàn:

${base}
`

const res1 = await ai.models.generateContent({
  model:"gemini-2.5-flash",
  contents:promptExercise
})

const exercise =
res1.candidates?.[0]?.content?.parts?.[0]?.text || ""

/* ====== SINH TEST ====== */

const promptTest = `
Tạo 10 test case cho bài sau:

${exercise}

Trả về JSON dạng:
[
 { "input":"...", "output":"..." }
]
`

const res2 = await ai.models.generateContent({
  model:"gemini-2.5-flash",
  contents:promptTest
})

let tests:any[] = []

try{
  const raw = res2.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
  tests = JSON.parse(raw)
}catch{
  tests = []
}

/* 🔥 THÊM NGAY TẠI ĐÂY */
tests = tests.map((t:any,i:number)=>({
  ...t,
  hidden: i >= 2
}))

/* ====== LƯU DB ====== */

await supabase
.from("generated_exercises")
.insert([
{
  student_id,
  class_id,
  exercise,

  // 🔥 QUAN TRỌNG
  type:"practice",
  test_cases: tests
}
])

/* ====== RETURN ====== */

return Response.json({
  exercise,
  tests
})

}catch(err){

return Response.json({
  error:"AI lỗi"
})

}

}
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenAI } from "@google/genai"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ai = new GoogleGenAI({
apiKey: process.env.GOOGLE_API_KEY
})

function isGarbageCode(code:string){
if(!code) return true
const c = code.trim()
if(c.length < 8) return true
const lettersOnly = /^[a-zA-Z\s]+$/
if(lettersOnly.test(c)) return true
const hasSymbol = /[(){};=<>]/.test(c)
if(!hasSymbol) return true

const pythonKeywords = ["print","for","while","if","elif","else","def","return","input","range","import","class","lambda"]
const cppKeywords = ["#include","iostream","bits/stdc++.h","using namespace","std::","cout","cin","int main","return"]

const hasPython = pythonKeywords.some(k => c.includes(k))
const hasCpp = cppKeywords.some(k => c.includes(k))

if(!hasPython && !hasCpp) return true

return false
}

export async function POST(req: Request){

const body = await req.json()

const {
student_id,
exercise_id,
code,
language,
type,
exercise_text
} = body

if(!student_id || !code){
return NextResponse.json({error:"Thiếu dữ liệu"})
}

if(isGarbageCode(code)){
return NextResponse.json({
error:"Code không hợp lệ"
})
}

/* ======================
lấy class_id
====================== */

const { data:userData } = await supabase
.from("users")
.select("class_id")
.eq("id",student_id)
.single()

const class_id = userData?.class_id

/* ======================
LẤY TEST CASE
====================== */

let tests:any[] = []

if(type==="teacher" && exercise_id){

const { data:ex } = await supabase
.from("generated_exercises")
.select("test_cases")
.eq("id",exercise_id)
.single()

tests = ex?.test_cases || []
}

/* ======================
CHẤM TEST (SAFE + BATCH)
====================== */

// 🔥 giới hạn test
tests = (tests || []).slice(0, 10)

let passed = 0
let total = tests.length
let detail:any[] = []

// 👉 nếu không có test → skip
if(total > 0){

  try{

    const judgeRes = await fetch("https://codemora-judge-production.up.railway.app/run-batch",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        code,
        language,
        tests
      })
    })

    const judgeData = await judgeRes.json()

    const results = judgeData.results || []

    total = results.length

    for(const r of results){

      if(r.ok) passed++

      detail.push({
        input: r.input,
        expected: r.expected,
        output: r.output,
        ok: r.ok
      })
    }

  }catch(e){

    // 🔥 nếu judge lỗi → không crash
    detail.push({
      error:"Judge server lỗi",
      ok:false
    })

    passed = 0
  }

}else{

  // 👉 không có test
  detail.push({
    error:"Không có test",
    ok:false
  })

}

/* ======================
AI CHẤM (PHỤ)
====================== */

let ai_score: number = 0
let ai_feedback = ""

let realExerciseText = exercise_text

if(type==="teacher" && exercise_id){

const { data:ex } = await supabase
.from("generated_exercises")
.select("exercise")
.eq("id",exercise_id)
.single()

if(ex){
realExerciseText = ex.exercise
}
}

if(realExerciseText){

try{

const prompt = `
Bạn là giáo viên lập trình.

Đề bài:
${realExerciseText}

Code học sinh:
${code}

Hãy nhận xét (KHÔNG chấm điểm).
`

const response = await ai.models.generateContent({
model:"gemini-2.5-flash",
contents:prompt
})

ai_feedback = response.text || ""

}catch{
ai_feedback = ""
}

}

/* ======================
ĐIỂM = TEST
====================== */

if(total > 0){
  ai_score = Math.round((passed / total) * 10)
}else{
ai_score = 0
}

/* ======================
GHÉP FEEDBACK
====================== */

ai_feedback = `
📊 KẾT QUẢ TEST

✔ Đúng: ${passed}/${total}
❌ Sai: ${total - passed}

${ai_feedback ? "\n🤖 Nhận xét:\n" + ai_feedback : ""}
`

/* ======================
BÀI GIÁO VIÊN GIAO (UPSERT)
====================== */

if(type==="teacher"){

const { data:exist } = await supabase
.from("submissions")
.select("id")
.eq("student_id",student_id)
.eq("exercise_id",exercise_id)
.maybeSingle()

if(exist){

await supabase
.from("submissions")
.update({
code,
language,
status:"submitted",
ai_score,
ai_feedback
})
.eq("student_id",student_id)
.eq("exercise_id",exercise_id)

}else{

await supabase
.from("submissions")
.insert({
student_id,
class_id,
exercise_id,
code,
language,
type:"teacher",
status:"submitted",
ai_score,
ai_feedback
})

}

return NextResponse.json({
success:true,
ai_score,
ai_feedback,
detail
})

}

/* ======================
BÀI TỰ SINH
====================== */

await supabase
.from("submissions")
.insert({
student_id,
class_id,
code,
language,
type:"practice",
exercise_text,
status:"submitted",
ai_score,
ai_feedback
})

return NextResponse.json({
success:true,
ai_score,
ai_feedback,
detail
})

}
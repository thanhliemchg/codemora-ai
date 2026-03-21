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

/* ======================
LỌC CODE RÁC (Python + C++)
====================== */

function isGarbageCode(code:string){

if(!code) return true

const c = code.trim()

/* ======================
QUÁ NGẮN
====================== */

if(c.length < 8) return true


/* ======================
CHỈ TOÀN CHỮ
====================== */

const lettersOnly = /^[a-zA-Z\s]+$/

if(lettersOnly.test(c)){
return true
}


/* ======================
KHÔNG CÓ KÝ TỰ LẬP TRÌNH
====================== */

const hasSymbol = /[(){};=<>]/.test(c)

if(!hasSymbol){
return true
}


/* ======================
KEYWORD PYTHON
====================== */

const pythonKeywords = [
"print","for","while","if","elif","else",
"def","return","input","range","import",
"class","lambda"
]


/* ======================
KEYWORD C++
====================== */

const cppKeywords = [
"#include",
"iostream",
"bits/stdc++.h",
"using namespace",
"std::",
"cout",
"cin",
"int main",
"return"
]


const hasPython = pythonKeywords.some(k => c.includes(k))
const hasCpp = cppKeywords.some(k => c.includes(k))


/* ======================
KHÔNG PHẢI PYTHON HOẶC C++
====================== */

if(!hasPython && !hasCpp){
return true
}


/* ======================
CHỈ 1 DÒNG VÀ KHÔNG CÓ LOGIC
====================== */

const lines = c.split("\n")

if(lines.length < 1 && c.length < 20){
return true
}

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
LẤY ĐỀ BÀI THẬT
====================== */

let realExerciseText = exercise_text

if(type==="teacher" && exercise_id){

try{

const { data:ex } = await supabase
.from("generated_exercises")
.select("exercise")
.eq("id",exercise_id)
.single()

if(ex){
realExerciseText = ex.exercise
}

}catch(e){
console.log("Lỗi lấy đề bài",e)
}

}


/* ======================
AI CHẤM BÀI
====================== */

let ai_score: number | null = null
let ai_feedback = ""

if(realExerciseText){

  try{

    const prompt = `
Bạn là giáo viên lập trình.

Đề bài:
${realExerciseText}

Code học sinh:
${code}

Hãy:
1. kiểm tra đúng/sai
2. nhận xét chi tiết
3. cho điểm từ 0 đến 10

⚠️ Chỉ trả JSON THUẦN, KHÔNG markdown:

{
"score": number,
"feedback": "..."
}
`

    const response = await ai.models.generateContent({
      model:"gemini-2.5-flash",
      contents:prompt
    })

    const text = response.text || ""

    console.log("AI RAW:", text)

    // =========================
    // 1. LÀM SẠCH TEXT
    // =========================
    const clean = text
      .replace(/```json/g,"")
      .replace(/```/g,"")
      .trim()

    // =========================
    // 2. LẤY JSON TRONG TEXT
    // =========================
    const jsonMatch = clean.match(/\{[\s\S]*\}/)

    if(jsonMatch){

      try{
        const parsed = JSON.parse(jsonMatch[0])

        ai_score = Number(parsed.score)
        ai_feedback = parsed.feedback || clean

      }catch{
        console.log("Parse JSON lỗi")
      }

    }

    // =========================
    // 3. NẾU KHÔNG CÓ JSON → TỰ ĐỌC ĐIỂM
    // =========================
    if(ai_score === null){

      // tìm dạng: 8/10
      const scoreMatch = clean.match(/(\d+(\.\d+)?)\s*\/\s*10/)

      if(scoreMatch){
        ai_score = Number(scoreMatch[1])
      }

    }

    // =========================
    // 4. NẾU VẪN NULL → TÌM SỐ BẤT KỲ
    // =========================
    if(ai_score === null){

      const numberMatch = clean.match(/\b([0-9]|10)\b/)

      if(numberMatch){
        ai_score = Number(numberMatch[1])
      }

    }

    // =========================
    // 5. FALLBACK CUỐI
    // =========================
    if(ai_score === null){
      ai_score = 0
    }

    if(!ai_feedback){
      ai_feedback = clean
    }

  }catch(e){

    console.log("AI lỗi:", e)

    ai_score = 0
    ai_feedback = "AI không phản hồi"

  }

}


/* ======================
BÀI GIÁO VIÊN GIAO
====================== */

if(type==="teacher"){

const { data:exist } = await supabase
.from("submissions")
.select("id")
.eq("student_id",student_id)
.eq("exercise_id",exercise_id)
.limit(1)

if(exist && exist.length>0){

const { error } = await supabase
.from("submissions")
.update({
code,
language,
type:type,
status:"submitted",
exercise_text,
ai_score,
ai_feedback
})
.eq("student_id",student_id)
.eq("exercise_id",exercise_id)

if(error){
return NextResponse.json({error:error.message})
}

}else{

const { error } = await supabase
.from("submissions")
.insert({
student_id,
class_id,
exercise_id,
code,
language,
type:type,
status:"submitted",
exercise_text,
ai_score,
ai_feedback
})

if(error){
return NextResponse.json({error:error.message})
}

}

return NextResponse.json({
message:"Nộp bài thành công"
})

}


/* ======================
BÀI TỰ SINH
====================== */

const { error } = await supabase
.from("submissions")
.insert({
student_id,
class_id,
exercise_id:null,
code,
language,
type:"practice",
exercise_text:exercise_text || null,
status:"submitted",
ai_score,
ai_feedback
})

if(error){
return NextResponse.json({error:error.message})
}

return NextResponse.json({
message:"Nộp bài thành công"
})

}
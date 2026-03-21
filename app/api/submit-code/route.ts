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
CHECK CODE RÁC
====================== */
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

/* ======================
API
====================== */

export async function POST(req: Request){

  try{

    const body = await req.json()

    const {
      student_id,
      exercise_id,
      code,
      language,
      type,
      submission_id
    } = body

    if(!student_id || !code){
      return NextResponse.json({ error:"Thiếu dữ liệu" })
    }

    if(isGarbageCode(code)){
      return NextResponse.json({ error:"Code không hợp lệ" })
    }

    /* ======================
    LẤY TEST CASE
    ====================== */

    let tests:any[] = []

    // 🔹 bài GV
    if(type==="teacher" && exercise_id){

      const { data:ex } = await supabase
        .from("generated_exercises")
        .select("test_cases")
        .eq("id",exercise_id)
        .single()

      tests = ex?.test_cases || []
    }

    // 🔹 bài tự sinh
    else if(type==="practice"){

      if(!submission_id){
        return NextResponse.json({
          error:"Thiếu submission_id"
        })
      }

      const { data:sub } = await supabase
        .from("submissions")
        .select("test_cases")
        .eq("id", submission_id)
        .single()

      tests = sub?.test_cases || []
    }

    if(!tests.length){
      return NextResponse.json({
        error:"Không có test case"
      })
    }

    tests = tests.slice(0,10)

    /* ======================
    CHẤM TEST
    ====================== */

    let detail:any[] = []
    let passed = 0
    const total = tests.length

    try{

      const judgeRes = await fetch(
        "https://codemora-judge-production.up.railway.app/run-batch",
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body: JSON.stringify({
            code,
            language,
            tests
          })
        }
      )

      const judgeData = await judgeRes.json()
      const results = judgeData.results || []

      function normalize(s:any){
        return String(s)
          .trim()
          .replace(/\s+/g, " ")
      }

detail = results.map((r:any, i:number) => {

  const expected = tests[i]?.output

  const ok = normalize(r.output) === normalize(expected)

  if(ok) passed++

  return {
    input: tests[i]?.input,
    expected,
    output: r.output,
    passed: ok
  }
})
    }catch(e){
      console.log("Judge error:", e)
    }

    /* ======================
    SCORE
    ====================== */

    const ai_score = total > 0
      ? Math.round((passed / total) * 10)
      : 0

    /* ======================
    AI FEEDBACK
    ====================== */

    let ai_feedback_text = ""

    if(passed < total){

      const failedTests = detail
        .filter(t => !t.passed)
        .slice(0,3)

/* ===== LẤY ĐỀ BÀI ===== */
let exercise_text = ""

/* ===== BÀI GV ===== */
if(type === "teacher" && exercise_id){

  const { data:ex } = await supabase
    .from("generated_exercises")
    .select("exercise")
    .eq("id", exercise_id)
    .single()

  exercise_text = ex?.content || ""
}

/* ===== BÀI TỰ SINH ===== */
else if(type === "practice" && submission_id){

  const { data:sub } = await supabase
    .from("submissions")
    .select("exercise_text")
    .eq("id", submission_id)
    .single()

  exercise_text = sub?.exercise_text || ""
}

      const promptAI = `
Bạn là giáo viên chấm bài lập trình.

🎯 Nhiệm vụ:
Phân tích bài làm của học sinh dựa trên:
- Đề bài
- Code
- Kết quả của tất cảtest

=====================
📘 ĐỀ BÀI:
${exercise_text || "Không có"}

=====================
💻 CODE HỌC SINH:
${code}

=====================
📊 KẾT QUẢ:
${passed}/${total} test passed

=====================
❌ TEST SAI:
${failedTests.length > 0 
? failedTests.map((t,i)=>`
Test ${i+1}
Input: ${t.input}
Expected: ${t.expected}
Output: ${t.output}
`).join("\n")
: "Không có test sai"}

=====================
📌 YÊU CẦU:

1. 🔴 Chỉ ra lỗi chính (1 câu)
2. 🧠 Giải thích ngắn gọn (2-3 câu dễ hiểu)
3. 🛠 Gợi ý sửa cụ thể dựa trên đề bài (không viết lại code)

=====================
⚠️ QUY ĐỊNH:

- Không viết lại toàn bộ code
- Ngắn gọn, dễ hiểu
- Trả lời bằng tiếng Việt
- Viết markdown rõ ràng

=====================
🎁 BONUS (QUAN TRỌNG):

- Nếu sai nhiều test → nhấn mạnh lỗi logic
- Nếu sai ít test → gợi ý edge case
- Nếu output đúng nhưng vẫn fail → nhắc kiểm tra format (space, newline)
- Nếu dùng sai input → nhắc cách đọc input
- Nếu code có dấu hiệu sai cấu trúc → chỉ ra vị trí sai

=====================
✍️ FORMAT TRẢ LỜI:

## ❌ Lỗi chính
...

## 💡 Giải thích
...

## 🛠 Gợi ý sửa
...

## 🎯 Nhận xét thêm (ngắn)
...
`

      try{
        const aiRes = await ai.models.generateContent({
          model:"gemini-2.5-flash",
          contents: promptAI
        })

        ai_feedback_text =
          aiRes.candidates?.[0]?.content?.parts?.[0]?.text || ""

      }catch(e){
        console.log("AI error:", e)
      }
    }

    const ai_feedback = passed === total
      ? "🎉 AC (Accepted) - Code đúng hoàn toàn!"
      : `🎯 ${passed}/${total} test passed\n\n${ai_feedback_text}`

    /* ======================
    UPDATE DB
    ====================== */

    if(type === "practice" && submission_id){

      await supabase
        .from("submissions")
        .update({
          code,
          language,
          ai_score,
          ai_feedback: JSON.stringify({
            feedback: ai_feedback,
            detail
          }),
          status: "submitted"
        })
        .eq("id", submission_id)
    }

    if(type === "teacher" && exercise_id){

      await supabase
        .from("submissions")
        .update({
          code,
          language,
          ai_score,
          ai_feedback: JSON.stringify({
            feedback: ai_feedback,
            detail
          }),
          status: "submitted"
        })
        .eq("student_id", student_id)
        .eq("exercise_id", exercise_id)
    }

    /* ======================
    RETURN
    ====================== */

    return NextResponse.json({
      success:true,
      ai_score,
      ai_feedback,
      detail
    })

  }catch(err){

    console.log(err)

    return NextResponse.json({
      error:"Server lỗi"
    })
  }
}
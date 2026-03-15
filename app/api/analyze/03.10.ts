import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req:Request){

const body = await req.json()

const {submission_id, code, language} = body

if(!submission_id || !code){
return NextResponse.json({
error:"Thiếu dữ liệu"
})
}

const prompt = `
Bạn là giáo viên lập trình.

Hãy phân tích đoạn code sau:

${code}

Đánh giá:

1. Code đúng hay sai
2. Độ tối ưu
3. Lỗi logic nếu có
4. Gợi ý cải thiện

Cuối cùng cho điểm từ 0-10.
`

const res = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
contents:[
{
parts:[
{ text: prompt }
]
}
]
})
}
)

const data = await res.json()

const feedback =
data?.candidates?.[0]?.content?.parts?.[0]?.text || "AI chưa phân tích được"

// lưu feedback vào database

await supabase
.from("submissions")
.update({
ai_feedback:feedback
})
.eq("id",submission_id)

return NextResponse.json({
feedback
})

}
import { NextResponse } from "next/server"

export async function POST(req: Request) {

const body = await req.json()
const { prompt } = body

if(!prompt){
return NextResponse.json({
error:"Thiếu prompt"
})
}

const fullPrompt = `
Bạn là giáo viên Tin học.
Hãy tạo một bài tập lập trình cho học sinh theo ${prompt}
Trả về nội dung đề định dạng đúng theo form đề thi HSG Quốc gia:
- ....
- Yêu cầu: Em hãy lập trình.... (viết ngắn gọn vì đã có nội dung đề ở trên)
- Dữ liệu vào: Dữ liệu vào trình bày ở đây
- Kết quả: Kết quả ra là gì
- Ví dụ:
+ Input 
+ Output 
- Không được đưa ra lời giải hay gợi ý.
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
{ text: fullPrompt }
]
}
]
})
}
)

const data = await res.json()

const exercise =
data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

return NextResponse.json({
exercise
})

}
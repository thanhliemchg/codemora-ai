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
Bạn là giáo viên Tin học đang tạo bài tập lập trình cho học sinh THPT.
Hãy tạo một bài tập lập trình rõ ràng, dễ hiểu theo ${prompt}
QUY TẮC BẮT BUỘC:
1. Chỉ viết theo đúng cấu trúc dưới đây.
2. Không được lặp lại nội dung.
3. Không dùng ký hiệu LaTeX như A_{i-1}.
4. Chỉ dùng dạng chỉ số mảng như: A[i], A[i-1], A[i+1].
5. Nội dung ngắn gọn, dễ hiểu cho học sinh.
6. Không viết lại cùng một dòng hai lần.
7. Trước khi trả lời hãy kiểm tra và loại bỏ mọi nội dung bị lặp.
8. Không được đưa ra lời giải hay gợi ý.

Hãy trả lời bằng Markdown theo đúng cấu trúc sau:
## **BÀI TOÁN:** **Tiêu đề bài toán viết hoa ngắn gọn ở đây**
Mô tả bài toán rõ ràng (không cần ghi chữ mô tả).
## **Yêu cầu:** 
Mô tả ngắn gọn yêu cầu học sinh cần làm gì.
## **Dữ liệu vào:**
Dòng .....
## **Kết quả:**
In ra kết quả của bài toán.
## **Ví dụ:**
- Input: 

- Output: 

## **Giải thích:**
Giải thích ví dụ.

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
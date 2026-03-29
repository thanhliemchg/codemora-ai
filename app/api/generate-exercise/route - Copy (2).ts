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
Bạn là giáo viên Tin học THPT.

Hãy tạo 1 bài toán lập trình cơ bản, rõ ràng, phù hợp học sinh lớp 10–11 (mức độ dễ đến trung bình).

========================
YÊU CẦU BẮT BUỘC (TUÂN THỦ TUYỆT ĐỐI):

- Không dùng LaTeX
- Không lặp nội dung
- Không viết 2 dòng giống nhau
- Nội dung ngắn gọn, dễ hiểu
- Không mô tả mơ hồ
- Dữ liệu nhỏ, N <= 100 hoặc <= 200

========================
FORMAT MARKDOWN BẮT BUỘC (PHẢI GIỐNG 100%):

## **BÀI TOÁN:** **Tiêu đề bài toán viết hoa ngắn gọn ở đây**

<viết nội dung bài toán rõ ràng, KHÔNG ghi chữ "Mô tả">

## **Yêu cầu:** 
<viết rõ học sinh cần làm gì>

## **Dữ liệu vào:**
Dòng 1: ...
Dòng 2: ...

## **Kết quả:**
<viết rõ kết quả cần in>

## **Ví dụ:**
Input:
5
20 25 18 27 22

Output:
22.40
2

## **Ràng buộc**:
<ghi rõ>



## **Giải thích:**
Giải thích ví dụ.

========================
QUY TẮC BẮT BUỘC:

- Input nếu đầu bài có dòng thứ 1, 2...thì phải xuống dòng THẬT (mỗi dòng 1 dòng riêng)
- Output phải đúng 100% theo Input
- Không được sai format Markdown trên
- Không thêm ký tự thừa
- Không thêm phần ngoài cấu trúc đã yêu cầu

========================
KIỂM TRA LẠI TRƯỚC KHI TRẢ KẾT QUẢ:

- Nếu Input chưa xuống dòng → phải sửa lại
- Nếu format sai → phải sửa lại
- Chỉ trả về kết quả cuối cùng đúng format

========================
YÊU CẦU NÂNG CAO:

- Đảm bảo ví dụ luôn có đúng số dòng như phần "Dữ liệu vào"
- Không được để sai lệch giữa mô tả và ví dụ
- Output phải khớp hoàn toàn

========================
Trả về CHÍNH XÁC nội dung, không giải thích thêm.

========================
Hãy tạo bài toán theo chủ đề:
${prompt}
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
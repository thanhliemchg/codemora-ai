import { ai } from "@/lib/ai"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request){

try{

const { code, teacherExercise, student_id, class_id } = await req.json()

/* CHẶN TRƯỜNG HỢP KHÔNG CÓ DỮ LIỆU */

if(!code && !teacherExercise){

return Response.json({
error:"Không có code hoặc đề bài để sinh bài tập"
})

}

/* XÁC ĐỊNH NGUỒN SINH BÀI */

const base = teacherExercise ? teacherExercise : code

const prompt = `
Bạn là giáo viên Tin học.

Tạo một bài lập trình mới có độ khó tương đương nhưng code phải khác hoàn toàn với bài sau:

${base}
QUY TẮC BẮT BUỘC:
1. Chỉ viết theo đúng cấu trúc dưới đây.
2. Không được lặp lại nội dung.
3. Không dùng ký hiệu LaTeX như A_{i-1}.
4. Chỉ dùng dạng chỉ số mảng như: A[i], A[i-1], A[i+1].
5. Nội dung ngắn gọn, dễ hiểu cho học sinh.
6. Không viết lại cùng một dòng hai lần.
7. Trước khi trả lời hãy kiểm tra và loại bỏ mọi nội dung bị lặp.
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
- Không được đưa ra lời giải hay gợi ý.
`

const response = await ai.models.generateContent({
model:"gemini-2.5-flash",
contents:prompt
})

const text =
response.candidates?.[0]?.content?.parts?.[0]?.text || ""

await supabase
.from("generated_exercises")
.insert([
{
student_id,
class_id,
exercise:text
}
])

return Response.json({
exercise:text
})

}catch(err){

return Response.json({
error:"AI sinh bài tập lỗi"
})

}

}
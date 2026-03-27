import { ai } from "@/lib/ai"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request){

  try{

    const { code, teacherExercise, student_id } = await req.json()

    if(!student_id){
      return Response.json({ error:"Thiếu student_id" })
    }

    if(!code && !teacherExercise){
      return Response.json({ error:"Không có dữ liệu" })
    }

    /* ======================
    LẤY class_id CHUẨN (🔥 FIX LỚN)
    ====================== */

    const { data: userData, error: userErr } = await supabase
      .from("users")
      .select("class_id")
      .eq("id", student_id)
      .single()

    if(userErr || !userData?.class_id){
      return Response.json({ error:"Không tìm thấy class_id" })
    }

    const realClassId = userData.class_id

    /* ======================
    SINH ĐỀ (GIỮ NGUYÊN PROMPT)
    ====================== */

    const base = teacherExercise || code

    const promptExercise = `
Tạo một bài lập trình mới với độ khó tương đương nhưng khác hoàn toàn.

QUY TẮC BẮT BUỘC:
1. Chỉ viết theo đúng cấu trúc dưới đây.
2. Không được lặp lại nội dung.
3. Không dùng ký hiệu LaTeX như A_{i-1}.
4. Chỉ dùng dạng chỉ số mảng như: A[i], A[i-1], A[i+1].
5. Nội dung ngắn gọn, dễ hiểu cho học sinh.
6. Không viết lại cùng một dòng hai lần.
7. Trước khi trả lời hãy kiểm tra và loại bỏ mọi nội dung bị lặp.
8. Khi ra bài tập phải tuân thủ các điều kiện sau:
- Chỉ nên ra bài cơ bản khống quá khó và sinh test dễ và bám sát sách giáo khoa tin học 10, 11 kết nối tri thức với cuộc sống;
- Không được ra với số lượng N (số phần tử) quá lớn, càng nhỏ càng tốt; nếu là dãy số thì số lượng phần tử và tối đa N<= 100, N<=200, N<=500 hoặc nhỏ hơn nữa.
9. Sau chữ "Input" dữ liệu phải xuống dong, Sau "Output" cũng phải xuống dòng
10. Không được đưa ra lời giải hay gợi ý.
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

${base}
`

    const res1 = await ai.models.generateContent({
      model:"gemini-2.5-flash",
      contents:promptExercise
    })

    const exercise =
      res1.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

    /* ======================
    SINH TEST
    ====================== */

    const promptTest = `
Tạo đúng 10 test case chính xác tuyệt đối cho bài sau:

${exercise}

⚠️ CHỈ trả JSON ARRAY, KHÔNG markdown, KHÔNG text

[
 {"input":"1","output":"1"}
]
`

    const res2 = await ai.models.generateContent({
      model:"gemini-2.5-flash",
      contents:promptTest
    })

    let tests:any[] = []

    try{

      let raw = res2.candidates?.[0]?.content?.parts?.[0]?.text || ""

      raw = raw
        .replace(/```json/g,"")
        .replace(/```/g,"")
        .trim()

      const match = raw.match(/\[[\s\S]*\]/)

      if(match){
        tests = JSON.parse(match[0])
      }

    }catch(e){
      console.log("❌ Parse test lỗi:", e)
    }
    /* ======================
    FALLBACK
    ====================== */

    if(!tests || tests.length === 0){
      tests = [
        {input:"1", output:"1"},
        {input:"2", output:"3"},
        {input:"5", output:"15"},
        {input:"10", output:"55"}
      ]
    }

    /* ======================
    FORMAT + HIDDEN
    ====================== */

    tests = tests.map((t:any,i:number)=>({
      input: (t.input ?? "").toString(),
      output: (t.output ?? "").toString(),
      hidden: i >= 2
    }))

    /* ======================
    🔥 TRÁNH TẠO TRÙNG BÀI
    ====================== */

    const { data: exist } = await supabase
      .from("submissions")
      .select("id")
      .eq("student_id", student_id)
      .eq("class_id", realClassId)
      .eq("type", "practice")
      .eq("status", "pending")
      .maybeSingle()

    let submission_id = null

    if(exist){
      // 👉 update nếu đã có
      await supabase
        .from("submissions")
        .update({
          exercise_text: exercise,
          test_cases: tests,
          created_at: new Date().toISOString()
        })
        .eq("id", exist.id)

      submission_id = exist.id

    }else{
        await supabase
        .from("submissions")
        .delete()
        .eq("student_id", student_id)
        .eq("type", "practice")
        .eq("status", "pending")
      // 👉 insert mới
      const { data, error } = await supabase
        .from("submissions")
        .insert([
          {
            student_id,
            class_id: realClassId,
            exercise_text: exercise,
            test_cases: tests,
            status: "pending",
            type: "practice",
            code: "",
            ai_score: null,
            teacher_score: null
          }
        ])
        .select()
        .single()

      if(error){
        return Response.json({ error:error.message })
      }

      submission_id = data.id
    }

    /* ======================
    RETURN
    ====================== */

    return Response.json({
      success:true,
      submission_id,
      exercise,
      tests
    })

  }catch(err){

    console.log(err)

    return Response.json({
      error:"AI lỗi"
    })

  }
}
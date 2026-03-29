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
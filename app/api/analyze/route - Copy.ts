import { ai } from "@/lib/ai";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {

  try {

    const { code, language, student_id } = await req.json();

    const prompt = `
Bạn là giáo viên Tin học THPT.

Phân tích code ${language} ngắn gọn:

1. lỗi cú pháp
2. lỗi logic
3. gợi ý sửa
4. Big-O
5. điểm (0-10)

Trả lời tối đa 6 dòng.

Code:
${code}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text || "Không có kết quả";

    // lưu lịch sử
    await supabase.from("code_history").insert([
      {
        student_id,
        code,
        language,
        ai_feedback: text
      }
    ]);

    return Response.json({
      result: text
    });

  } catch (error) {

    console.error("Analyze error:", error);

    return Response.json({
      result: "Lỗi khi phân tích AI"
    });

  }

}
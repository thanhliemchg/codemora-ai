import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { code } = await req.json();

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Bạn là giáo viên Tin học THPT.
Phân tích code sau:
1. Lỗi cú pháp
2. Lỗi logic
3. Gợi ý 3 mức
4. Ước lượng Big-O
Không đưa đáp án hoàn chỉnh.

${code}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return Response.json({ result: response.text() });
}
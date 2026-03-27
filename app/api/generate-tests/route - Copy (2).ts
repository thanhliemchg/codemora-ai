import { ai } from "@/lib/ai"

export async function POST(req: Request){

  try{

    const { exercise } = await req.json()

    if(!exercise){
      return Response.json({ error:"Thiếu đề bài" })
    }

    const prompt = `
Bạn là hệ thống sinh test cho thi lập trình.

Hãy tạo test CHUẨN THI cho bài sau:

${exercise}

YÊU CẦU:

1. Tạo 10 test
2. Bao gồm:
   - test cơ bản
   - test trung bình
   - test lớn (stress)
   - test biên (edge cases)

3. KHÔNG giải thích
4. KHÔNG markdown
5. CHỈ trả JSON

FORMAT:

[
  {"input":"...","output":"..."},
  {"input":"...","output":"..."}
]
`

    const res = await ai.models.generateContent({
      model:"gemini-2.5-flash",
      contents:prompt
    })

    let tests:any[] = []

    try{
      const raw = res.candidates?.[0]?.content?.parts?.[0]?.text || "[]"

      const clean = raw
        .replace(/```json/g,"")
        .replace(/```/g,"")
        .trim()

      tests = JSON.parse(clean)

    }catch{
      return Response.json({ error:"Parse test lỗi" })
    }

    /* 🔥 NÂNG CẤP LEVEL PRO */

    tests = tests.map((t:any,i:number)=>({
      ...t,

      // 🔥 hidden test
      hidden: i >= 5
    }))

    return Response.json({ tests })

  }catch(err){
    return Response.json({ error:"AI lỗi" })
  }

}
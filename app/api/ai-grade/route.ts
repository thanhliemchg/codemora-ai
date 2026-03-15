import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
})

export async function POST(req: Request){

const { exercise, code } = await req.json()

const prompt = `
Bạn là giáo viên Tin học.

Đề bài:
${exercise}

Code học sinh:
${code}

Hãy:
1. Nhận xét code
2. Cho điểm từ 0 đến 10

Trả về JSON dạng:

{
"score": number,
"feedback": "..."
}
`

const response = await ai.models.generateContent({
model: "gemini-2.5-flash",
contents: prompt
})

const text = response.text

let result

try{
result = JSON.parse(text)
}catch{
result = {
score: 0,
feedback: text
}
}

return NextResponse.json(result)

}
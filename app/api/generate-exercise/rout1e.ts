import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Thiếu prompt" })
    }

    const fullPrompt = `
Tạo bài toán lập trình cơ bản cho học sinh THPT.

Trả về JSON với nội dung phù hợp chủ đề: ${prompt}
`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }]
            }
          ],

          // 🔥 QUAN TRỌNG NHẤT
          generationConfig: {
            response_mime_type: "application/json",
            response_schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
                input_format: {
                  type: "array",
                  items: { type: "string" }
                },
                output_format: { type: "string" },
                sample_input: {
                  type: "array",
                  items: { type: "string" }
                },
                sample_output: {
                  type: "array",
                  items: { type: "string" }
                },
                constraints: { type: "string" }
              },
              required: [
                "title",
                "content",
                "input_format",
                "output_format",
                "sample_input",
                "sample_output",
                "constraints"
              ]
            }
          }
        })
      }
    )

    const data = await res.json()

    console.log("RAW:", data)

    const problem =
      data?.candidates?.[0]?.content?.parts?.[0]

    if (!problem) {
      return NextResponse.json({
        error: "Không lấy được dữ liệu từ AI",
        raw: data
      })
    }

    /* ================= FORMAT ================= */
    const markdown = `
## BÀI TOÁN: ${problem.title}

${problem.content}

## Yêu cầu:
${problem.output_format}

## Dữ liệu vào:
${problem.input_format.join("\n")}

## Kết quả:
${problem.output_format}

## Ví dụ:
Input:
${problem.sample_input.join("\n")}

Output:
${problem.sample_output.join("\n")}

## Ràng buộc:
${problem.constraints}
`

    return NextResponse.json({
      success: true,
      problem,
      markdown
    })

  } catch (err: any) {
    console.error("❌ ERROR:", err)

    return NextResponse.json({
      error: err.message
    })
  }
}
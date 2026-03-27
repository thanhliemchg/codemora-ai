import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { id } = await req.json()

    if (!id) {
      return Response.json({ error: "Thiếu id" })
    }

    const { error } = await supabase
      .from("submissions")
      .update({
        code: null,
        ai_feedback: null,
        teacher_feedback: null,
        ai_score: null,
        teacher_score: null,
        status: "pending"
      })
      .eq("id", id)

    if (error) {
      console.log("Supabase error:", error)
      return Response.json({ error: error.message })
    }

    return Response.json({ success: true })

  } catch (err) {
    return Response.json({ error: "Server lỗi" })
  }
}
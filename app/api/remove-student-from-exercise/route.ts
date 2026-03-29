import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { exerciseId, studentId } = await req.json()

    if (!exerciseId || !studentId) {
      return NextResponse.json({ error: "Thiếu dữ liệu" })
    }

    const { error } = await supabase
      .from("submissions")
      .delete()
      .eq("exercise_id", exerciseId)
      .eq("student_id", studentId)

    if (error) {
      return NextResponse.json({ error: error.message })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}
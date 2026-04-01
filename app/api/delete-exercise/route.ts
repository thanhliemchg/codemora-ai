import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { exerciseId } = await req.json()

    if (!exerciseId) {
      return NextResponse.json({ error: "Thiếu exerciseId" })
    }

    // ❗ xoá tất cả bài đã giao cho học sinh
      await supabase
      .from("submissions")
      .delete()
      .eq("exercise_id", exerciseId)
    
      const { error } = await supabase
      .from("generated_exercises")
      .delete()
      .eq("id", exerciseId)
    if (error) {
      return NextResponse.json({ error: error.message })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}
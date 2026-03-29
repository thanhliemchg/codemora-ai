import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { exerciseId } = await req.json()

    if (!exerciseId) {
      return NextResponse.json({ error: "Thiếu exerciseId" })
    }

    // 1. lấy submissions
    const { data: subs, error } = await supabase
      .from("submissions")
      .select("student_id")
      .eq("exercise_id", exerciseId)

    if (error) {
      console.log("ERR1:", error)
      return NextResponse.json({ error: error.message })
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json({ success: true, students: [] })
    }

    // ✅ loại trùng + loại null
    const ids = [...new Set(subs.map(s => s.student_id).filter(Boolean))]

    console.log("IDS:", ids)

    if (ids.length === 0) {
      return NextResponse.json({ success: true, students: [] })
    }

    // 2. lấy users
    const { data: users, error: err2 } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", ids)

    if (err2) {
      console.log("ERR2:", err2)
      return NextResponse.json({ error: err2.message })
    }

    // ✅ đảm bảo luôn trả mảng
    const students = users || []

    return NextResponse.json({
      success: true,
      students
    })

  } catch (err: any) {
    console.log("CATCH:", err)
    return NextResponse.json({ error: err.message })
  }
}
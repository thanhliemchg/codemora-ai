import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)
  const class_id = searchParams.get("class_id")

  if (!class_id) {
    return NextResponse.json({ error: "missing class" })
  }

  // 🔥 1. LẤY DANH SÁCH BÀI
  const { data: exercises, error } = await supabase
    .from("generated_exercises")
    .select("*")
    .eq("class_id", class_id)
    .eq("source", "teacher")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error })
  }

  // 🔥 2. LẤY submissions (CHỈ LẤY CÁI CÓ exercise_id)
  const { data: subs } = await supabase
    .from("submissions")
    .select("exercise_id, student_id, status")
    .not("exercise_id", "is", null)

  // 🔥 3. MAP COUNT
  const result = exercises.map((e: any) => {

    const related = subs?.filter(s => s.exercise_id === e.id) || []

    // 👇 số học sinh được giao (distinct)
    const student_count = new Set(
      related.map(s => s.student_id)
    ).size

    // 👇 số đã nộp
    const submitted_count = new Set(
      related
        .filter(s => s.status === "submitted")
        .map(s => s.student_id)
    ).size

    return {
      ...e,
      student_count,
      submitted_count
    }
  })

  return NextResponse.json(result)
}
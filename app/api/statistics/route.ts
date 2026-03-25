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
    return NextResponse.json({ error: "missing class_id" })
  }

  // ===== DATA =====
  const { data: exercises = [] } = await supabase
    .from("generated_exercises")
    .select("*")
    .eq("class_id", class_id)

  const { data: submissions = [] } = await supabase
    .from("submissions")
    .select("*")
    .eq("class_id", class_id)

  const { data: students = [] } = await supabase
    .from("student_accounts")
    .select("*")
    .eq("class_id", class_id)

  // =============================
  // 📘 TEACHER (CHỈ LẤY BÀI GV GIAO)
  // =============================
  const teacherSubs = submissions.filter(
    s => s.type === "teacher"
  )

  const teacherStats = {
    totalExercises: exercises.length,

    totalStudents: students.length,

    totalSubmittedStudents: new Set(
      teacherSubs.map(s => s.student_id)
    ).size,

    totalSubmissions: teacherSubs.length,

    teacherGraded: teacherSubs.filter(s => s.teacher_score !== null).length,

    aiGraded: teacherSubs.filter(s => s.ai_score !== null).length,

    pending: teacherSubs.filter(s => s.teacher_score === null).length
  }

  // =============================
  // 🧠 PRACTICE
  // =============================
  const practiceSubs = submissions.filter(
    s => s.type === "practice"
  )

  const practiceStats = {
    total: practiceSubs.length,

    students: new Set(
      practiceSubs.map(s => s.student_id)
    ).size,

    graded: practiceSubs.filter(s => s.ai_score !== null).length,

    pending: practiceSubs.filter(s => s.ai_score === null).length
  }

  // =============================
  // 👨‍🎓 STUDENTS
  // =============================
  const studentStats = students.map(st => {

    const subs = teacherSubs.filter(s => s.student_id === st.id)

    const scores = subs
      .map(s => s.teacher_score)
      .filter(s => s !== null)

    const avg = scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null

    let level = "Chưa học"

    if (avg !== null) {
      if (avg >= 8) level = "Giỏi"
      else if (avg >= 5) level = "Trung bình"
      else level = "Yếu"
    }

    return {
      id: st.id,
      name: st.name,
      avg,
      level
    }
  })

  // =============================
  // 📊 THEO BÀI 
  // =============================
  const exerciseStats = exercises.map(ex => {

    // 🔥 lọc đúng bài + đúng loại
    const subs = teacherSubs.filter(
      s => s.exercise_id === ex.id
    )

    // 🔥 loại duplicate student
    const uniqueStudentIds = Array.from(
      new Set(subs.map(s => s.student_id))
      )

    const submittedRaw = uniqueStudentIds.length
    const total = students.length

    // 🔥 CHỐNG LỖI >100%
    const submitted = Math.min(submittedRaw, total)

    const rate = total
      ? Math.round((submitted / total) * 100)
      : 0

    return {
      id: ex.id,
      title: ex.exercise_text?.split("\n")[0] || "Bài tập",
      total,
      submitted,
      rate
    }
  })

  // =============================
  // 📊 KPI
  // =============================
  return NextResponse.json({
    total: exercises.length,

    submitted: teacherSubs.length,

    graded: teacherSubs.filter(s => s.teacher_score !== null).length,

    teacher: teacherStats,
    practice: practiceStats,

    students: studentStats,
    exercises: exerciseStats
  })
}

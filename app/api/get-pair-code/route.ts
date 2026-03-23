import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {

    const body = await req.json()
    const { a_id, b_id, exercise_id } = body

    if (!a_id || !b_id || !exercise_id) {
      return NextResponse.json({
        error: "Thiếu dữ liệu"
      })
    }

    /* ===== LẤY SUBMISSIONS ===== */

    const { data: subs, error } = await supabase
      .from("submissions")
      .select("student_id, code, language, created_at")
      .in("student_id", [a_id, b_id])
      .eq("exercise_id", exercise_id)
      .eq("status", "submitted")
      .order("created_at", { ascending: false }) // 🔥 lấy bài mới nhất

    if (error) {
      console.error("❌ SUB QUERY ERROR:", error)
      return NextResponse.json([])
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json([])
    }

    /* ===== LẤY BÀI MỚI NHẤT MỖI HỌC SINH ===== */

    const latestMap: any = {}

    for (const s of subs) {
      if (!latestMap[s.student_id]) {
        latestMap[s.student_id] = s
      }
    }

    const latestSubs = Object.values(latestMap)

    if (latestSubs.length < 2) {
      return NextResponse.json([])
    }

    /* ===== CHẶN KHÁC NGÔN NGỮ (QUAN TRỌNG) ===== */

    const langA = latestSubs[0].language
    const langB = latestSubs[1].language

    if (!langA || !langB || langA !== langB) {
      return NextResponse.json([]) // ❗ KHÔNG TRẢ CODE
    }

    /* ===== LẤY USER ===== */

    const { data: users } = await supabase
      .from("users")
      .select("id, name")
      .in("id", [a_id, b_id])

    const map: any = {}
    users?.forEach(u => {
      map[u.id] = u.name || "Unknown"
    })

    /* ===== FORMAT ===== */

    const result = latestSubs.map((s: any) => ({
      id: s.student_id,
      name: map[s.student_id],
      code: s.code || "",
      language: s.language
    }))

    return NextResponse.json(result)

  } catch (err: any) {

    console.error("❌ GET PAIR CODE ERROR:", err)

    return NextResponse.json({
      error: err.message
    })
  }
}
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {

    const body = await req.json()
    const { a_id, b_id } = body

    if (!a_id || !b_id) {
      return NextResponse.json({
        error: "Thiếu student_id"
      })
    }

    /* ===== lấy code ===== */

    const { data: subs } = await supabase
      .from("submissions")
      .select("student_id, code")
      .in("student_id", [a_id, b_id])

    if (!subs || subs.length === 0) {
      return NextResponse.json([])
    }

    /* ===== lấy tên ===== */

    const { data: users } = await supabase
      .from("users")
      .select("id, name")
      .in("id", [a_id, b_id])

    const map: any = {}
    users?.forEach(u => {
      map[u.id] = u.name || "Unknown"
    })

    /* ===== format ===== */

    const result = subs.map(s => ({
      id: s.student_id,
      name: map[s.student_id],
      code: s.code || ""
    }))

    return NextResponse.json(result)

  } catch (err: any) {

    console.error("❌ GET PAIR CODE ERROR:", err)

    return NextResponse.json({
      error: err.message
    })
  }
}
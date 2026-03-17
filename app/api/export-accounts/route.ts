import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { class_id } = body

    console.log("📦 EXPORT CLASS:", class_id)

    // ❌ thiếu class_id
    if (!class_id) {
      return NextResponse.json({
        success: false,
        error: "Thiếu class_id"
      })
    }

    // ✅ query DB
    const { data, error } = await supabase
      .from("student_accounts")
      .select("name, email, password, class_id")
      .eq("class_id", class_id)

    if (error) {
      console.error("❌ DB ERROR:", error.message)
      return NextResponse.json({
        success: false,
        error: error.message
      })
    }

    // ❌ không có dữ liệu
    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Không có học sinh nào để xuất"
      })
    }

    console.log("✅ EXPORT OK:", data.length, "accounts")

    // ✅ format lại cho Excel đẹp
    const formatted = data.map((s: any, index: number) => ({
      STT: index + 1,
      "Tên học sinh": s.name,
      Email: s.email,
      "Mật khẩu": s.password
    }))

    return NextResponse.json({
      success: true,
      data: formatted
    })

  } catch (err: any) {
    console.error("🔥 SERVER ERROR:", err)

    return NextResponse.json({
      success: false,
      error: "Lỗi server"
    })
  }
}
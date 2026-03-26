import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {

    const { id, name, email, class_id } = await req.json()

    // ===== VALIDATE =====
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Thiếu id" },
        { status: 400 }
      )
    }

    // ===== UPDATE =====
    const { error } = await supabase
      .from("users")
      .update({
        name,
        email,
        class_id: class_id || null
      })
      .eq("id", id)
      .eq("role", "student") // 🔥 chỉ update học sinh

    if (error) {
      console.error(error)
      return NextResponse.json(
        { success: false, message: "Lỗi cập nhật" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })

  } catch (err:any) {
    console.error(err)
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    )
  }
}
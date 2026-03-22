import { NextResponse, NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {

  try {

    const body = await req.json()
    const email = body.email
    const password = body.password

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()
// 🔥 CHẶN TÀI KHOẢN CHƯA KÍCH HOẠT
    if (user.status === "pending") {
      return NextResponse.json({
        error: "⏳ Tài khoản đang chờ kích hoạt"
      }, { status: 403 })
    }

    // 🔥 CHẶN TÀI KHOẢN BỊ KHÓA
    if (user.status === "blocked") {
      return NextResponse.json({
        error: "🚫 Tài khoản đã bị khóa"
      }, { status: 403 })
    }
    // ❌ EMAIL KHÔNG TỒN TẠI
    if (error || !user) {
      return NextResponse.json({
        error: "Email không tồn tại"
      })
    }

    // ❌ SAI MẬT KHẨU
    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      return NextResponse.json({
        error: "Sai mật khẩu"
      })
    }

    

    // ❌ TRẠNG THÁI KHÁC (PHÒNG HỜ)
    if (user.status !== "active") {
      return NextResponse.json({
        error: "Tài khoản không hợp lệ"
      }, { status: 403 })
    }

    // ✅ LOGIN OK
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    })

  } catch (err) {

    console.log(err)

    return NextResponse.json({
      error: "Lỗi server"
    }, { status: 500 })

  }
}
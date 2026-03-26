import { NextResponse, NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {

  try {

    let { email, password } = await req.json()

    // ===== NORMALIZE EMAIL =====
    email = email?.trim().toLowerCase()

    if(!email || !password){
      return NextResponse.json({
        success:false,
        message:"Thiếu email hoặc mật khẩu"
      })
    }

    // ===== LẤY USER (KHÔNG PHÂN BIỆT HOA THƯỜNG) =====
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .ilike("email", email) // 🔥 FIX QUAN TRỌNG
      .maybeSingle()

    // ❌ EMAIL KHÔNG TỒN TẠI
    if (error || !user) {
      return NextResponse.json({
        success:false,
        message:"Email không tồn tại"
      })
    }

    // 🔥 CHẶN TRẠNG THÁI
    if (user.status === "pending") {
      return NextResponse.json({
        success:false,
        message:"⏳ Tài khoản đang chờ kích hoạt"
      }, { status: 403 })
    }

    if (user.status === "blocked") {
      return NextResponse.json({
        success:false,
        message:"🚫 Tài khoản đã bị khóa"
      }, { status: 403 })
    }

    // ❌ SAI MẬT KHẨU
    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      return NextResponse.json({
        success:false,
        message:"Sai mật khẩu"
      })
    }

    // ❌ PHÒNG HỜ
    if (user.status !== "active") {
      return NextResponse.json({
        success:false,
        message:"Tài khoản không hợp lệ"
      }, { status: 403 })
    }

    // ✅ LOGIN OK
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        must_change_password: user.must_change_password || false
      }
    })

  } catch (err) {

    console.log(err)

    return NextResponse.json({
      success:false,
      message:"Lỗi server"
    }, { status: 500 })

  }
}
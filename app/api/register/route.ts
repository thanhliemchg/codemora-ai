import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

// ===== VALIDATE EMAIL =====
function isValidEmail(email: string){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request){

  try{

    let { name, email, password, role, class_id } = await req.json()

    // ===== CLEAN DATA =====
    name = name?.trim()
    email = email?.trim().toLowerCase()

    // ===== VALIDATE =====
    if(!name || !email || !password){
      return NextResponse.json({
        success:false,
        message:"Thiếu thông tin"
      })
    }

    if(!isValidEmail(email)){
      return NextResponse.json({
        success:false,
        message:"Email không hợp lệ"
      })
    }

    if(password.length < 6){
      return NextResponse.json({
        success:false,
        message:"Mật khẩu phải >= 6 ký tự"
      })
    }

    // ===== CHECK TRÙNG (UX TỐT) =====
    const { data: exist } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if(exist){
      return NextResponse.json({
        success:false,
        message:"Email đã tồn tại"
      })
    }

    // ===== HASH PASSWORD =====
    const hashed = await bcrypt.hash(password,10)

    // ===== INSERT =====
  const { error } = await supabase
  .from("users")
  .insert([
    {
      name,
      email,
      password: hashed,
      role,
      class_id,
      status:"pending"
    }
  ])

if(error){

  console.log("REGISTER ERROR:", error)

  const msg = error.message || ""

  // 🔥 FIX CHÍNH Ở ĐÂY
  if(
    error.code === "23505" ||
    msg.includes("duplicate")
  ){
    return NextResponse.json({
      success:false,
      message:"Email đã tồn tại"
    })
  }

  return NextResponse.json({
    success:false,
    message:"Đăng ký thất bại"
  })
}

    return NextResponse.json({
      success:true,
      message:"Đăng ký thành công"
    })

  }catch(err){

    console.log("SERVER ERROR:", err)

    return NextResponse.json({
      success:false,
      message:"Lỗi server"
    }, { status: 500 })

  }
}
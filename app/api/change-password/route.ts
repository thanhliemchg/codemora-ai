import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request){

try{

const { user_id, old_password, new_password } = await req.json()

// lấy user
const { data:user, error } = await supabase
.from("users")
.select("password")
.eq("id",user_id)
.single()

if(error || !user){
return NextResponse.json({
success:false,
message:"Không tìm thấy user"
})
}

// kiểm tra mật khẩu cũ
const ok = await bcrypt.compare(old_password,user.password)

if(!ok){
return NextResponse.json({
success:false,
message:"Sai mật khẩu cũ"
})
}

// hash password mới
const hash = await bcrypt.hash(new_password,10)

// update
await supabase
.from("users")
.update({password:hash})
.eq("id",user_id)

return NextResponse.json({
success:true
})

}catch(e){

return NextResponse.json({
success:false,
message:"Server error"
})

}

}
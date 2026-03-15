import { NextResponse, NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {

const body = await req.json()
const email = body.email
const password = body.password

const { data: user, error } = await supabase
.from("users")
.select("*")
.eq("email", email)
.single()

if(error || !user){
return NextResponse.json({
error: "Email không tồn tại"
})
}

const valid = await bcrypt.compare(password, user.password)

if(!valid){
return NextResponse.json({
error: "Sai mật khẩu"
})
}

return NextResponse.json({
success: true,
user:{
id: user.id,
name: user.name,
role: user.role
}
})

}
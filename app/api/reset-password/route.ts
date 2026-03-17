import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generatePassword(){
return Math.random().toString(36).slice(-8)
}

export async function POST(req:Request){

const {ids} = await req.json()

const accounts:any[] = []

for(const id of ids){

const plain = generatePassword()
const hash = await bcrypt.hash(plain,10)

// 👉 update users
await supabase.from("users")
.update({password:hash})
.eq("id",id)

// 👉 lấy info user
const { data:user } = await supabase.from("users")
.select("*")
.eq("id",id)
.single()

// 👉 update bảng account (nếu có)
await supabase.from("student_accounts")
.update({password:plain})
.eq("email",user.email)

// 👉 trả về excel
accounts.push({
name:user.name,
email:user.email,
password:plain
})
}

return Response.json({
success:true,
count:accounts.length,
accounts
})

}
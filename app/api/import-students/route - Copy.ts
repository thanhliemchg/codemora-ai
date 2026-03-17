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

const {students,class_id} = await req.json()

const accounts:any[] = []

for(const s of students){

const success = []
const errors = []

let index = 1

for(const s of students){

const name = s.name || s["Tên học sinh"]
const email = s.email || s["Email"]

// ❌ thiếu dữ liệu
if(!name || !email){
errors.push({
row: index,
error: "Thiếu tên hoặc email"
})
index++
continue
}

const plainPassword = generatePassword()
const hash = await bcrypt.hash(plainPassword,10)

// 👉 insert users
const { error: err1 } = await supabase.from("users").insert({
name,
email,
password: hash,
role: "student",
class_id
})

if(err1){
errors.push({
row: index,
error: err1.message
})
index++
continue
}

// 👉 insert accounts
await supabase.from("student_accounts").insert({
name,
email,
password: plainPassword,
class_id
})

// ✔ thành công
success.push({
name,
email,
password: plainPassword,
status:"OK"
})

index++
}

return Response.json({
success:true,
total: students.length,
created: success.length,
failed: errors.length,
errors,
accounts: success
})

}

return Response.json({
success:true,
accounts
})

}
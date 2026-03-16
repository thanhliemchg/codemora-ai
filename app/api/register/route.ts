import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(req:Request){

const { name,email,password,role,class_id } = await req.json()

const hashed = await bcrypt.hash(password,10)

const { data:exist } = await supabase
.from("users")
.select("id")
.eq("email",email)
.single()

if(exist){
return NextResponse.json({
exists:true
})
}

const { data,error } = await supabase
.from("users")
.insert([
{
name,
email,
password: hashed,
role:role,
class_id,
status:"pending"
}
])

if(error){
return NextResponse.json(error)
}

return NextResponse.json({success:true})

}
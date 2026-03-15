import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"
const hashed = await bcrypt.hash(password, 10)
export async function POST(req:Request){

const { name,email,password,role,class_id } = await req.json()
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
password,
role:"student",
class_id,
status:"pending"
}
])

if(error){
return Response.json({error})
}

return Response.json({success:true})

}
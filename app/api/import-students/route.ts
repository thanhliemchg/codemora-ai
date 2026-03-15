import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

function generatePassword(){
return Math.random().toString(36).slice(-8)
}

export async function POST(req:Request){

const { students,class_id } = await req.json()

for(const s of students){

const password = generatePassword()

await supabase.from("users").insert({
name:s.name,
email:s.email,
password:password,
role:"student",
status:"pending",
class_id:class_id
})

}

return NextResponse.json({
success:true
})

}
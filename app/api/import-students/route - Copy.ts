import { supabase } from "@/lib/supabase"

export async function POST(req:Request){

const { students,class_id } = await req.json()

const rows = students.map((s:any)=>({

name:s.name,
email:s.email,
password:"123456",
role:"student",
class_id,
status:"pending"

}))

const { error } = await supabase
.from("users")
.insert(rows)

if(error) return Response.json({error})

return Response.json({success:true})

}
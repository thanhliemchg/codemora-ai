import { supabase } from "@/lib/supabase"

export async function POST(req:Request){

const body = await req.json()

const {name,teacher_id} = body

if(!name || name.trim()===""){

return Response.json({
error:"Tên lớp không được để trống"
},{status:400})

}

const {error} = await supabase
.from("classes")
.insert([
{
name:name.trim(),
teacher_id
}
])

if(error){

console.log(error)

return Response.json({error:error.message},{status:500})

}

return Response.json({success:true})

}
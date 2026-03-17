import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req:Request){

const {class_id} = await req.json()

// 👉 lấy danh sách pending
const { data:students } = await supabase
.from("users")
.select("*")
.eq("class_id",class_id)
.eq("status","pending")

if(!students){
return Response.json({success:false})
}

// 👉 update tất cả
const { error } = await supabase
.from("users")
.update({status:"active"})
.eq("class_id",class_id)
.eq("status","pending")

if(error){
return Response.json({success:false})
}

return Response.json({
success:true,
count:students.length
})
}
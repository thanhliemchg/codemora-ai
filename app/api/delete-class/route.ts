import { supabase } from "@/lib/supabase"

export async function POST(req:Request){

const { class_id } = await req.json()

if(!class_id){
return Response.json({success:false})
}

const { error } = await supabase
.from("classes")
.delete()
.eq("id",class_id)

if(error){
console.log(error)
return Response.json({success:false})
}

return Response.json({success:true})

}
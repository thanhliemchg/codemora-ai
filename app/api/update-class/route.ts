import { supabase } from "@/lib/supabase"

export async function POST(req:Request){

const { class_id,name } = await req.json()

if(!class_id || !name){
return Response.json({success:false})
}

const { error } = await supabase
.from("classes")
.update({name})
.eq("id",class_id)

if(error){
console.log(error)
return Response.json({success:false})
}

return Response.json({success:true})

}
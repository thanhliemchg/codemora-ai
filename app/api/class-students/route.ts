import { supabase } from "@/lib/supabase"

export async function GET(req:Request){

const {searchParams} = new URL(req.url)

const class_id = searchParams.get("class_id")

if(!class_id){

return Response.json([])

}

const {data,error} = await supabase
.from("users")
.select("*")
.eq("class_id",class_id)
.eq("status","active")
.eq("role","student")

if(error){

console.log(error)

return Response.json({error:error.message},{status:500})

}

return Response.json(data)

}
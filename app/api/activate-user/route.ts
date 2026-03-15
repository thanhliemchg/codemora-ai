import { supabase } from "@/lib/supabase"
import { error } from "console"

export async function POST(req:Request){

const {id} = await req.json()

await supabase
.from("users")
.update({status:"active"})
.eq("id",id)

if (error) return Response.json({error})
return Response.json({success:true})

}
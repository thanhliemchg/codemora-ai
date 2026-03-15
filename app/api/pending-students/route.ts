import { supabase } from "@/lib/supabase"

export async function GET(req:Request){

const {searchParams} = new URL(req.url)

const class_id = searchParams.get("class_id")

const {data} = await supabase
.from("users")
.select("*")
.eq("class_id",class_id)
.eq("role","student")
.eq("status","pending")


return Response.json(data)

}
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req:Request){

const {searchParams} = new URL(req.url)
const class_id = searchParams.get("class_id")

if(!class_id){
return NextResponse.json({error:"missing class"})
}

const {data,error} = await supabase
.from("generated_exercises")
.select("*")
.eq("class_id",class_id)
.eq("source","teacher")
.order("created_at",{ascending:false})

if(error){
return NextResponse.json({error})
}

return NextResponse.json(data)

}
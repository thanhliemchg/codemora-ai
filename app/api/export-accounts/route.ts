import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request){

const { class_id } = await req.json()

const { data } = await supabase
.from("student_accounts")
.select("*")
.eq("class_id", class_id)

return NextResponse.json(data)

}
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req:Request){

  const { student_ids } = await req.json()

  if(!student_ids || student_ids.length===0){
    return NextResponse.json([])
  }

  const { data } = await supabase
    .from("submissions")
    .select("student_id,code")
    .in("student_id", student_ids)

  const { data:users } = await supabase
    .from("users")
    .select("id,name")

  const map:any = {}
  users?.forEach(u=>map[u.id]=u.name)

  const result = data?.map(s=>({
    name: map[s.student_id],
    code: s.code
  }))

  return NextResponse.json(result || [])
}
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request){

  const { searchParams } = new URL(req.url)
  const student_id = searchParams.get("student_id")

  if(!student_id){
    return NextResponse.json({ submission: null })
  }

  /* =========================
  LẤY BÀI TỰ SINH CHƯA NỘP
  ========================= */

  const { data:submission, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("student_id", student_id)
    .eq("type", "practice")
    .eq("status", "pending") // 🔥 CHỐT
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if(error){
    console.log("GET PRACTICE ERROR:", error)
    return NextResponse.json({ submission: null })
  }

  return NextResponse.json({
    submission: submission || null
  })
}
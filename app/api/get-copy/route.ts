import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req:Request){

  const { searchParams } = new URL(req.url)
  const class_id = searchParams.get("class_id")

  const { data } = await supabase
    .from("copy_groups")
    .select("*")
    .eq("class_id",class_id)
    .order("created_at",{ascending:false})

  return NextResponse.json(data || [])
}
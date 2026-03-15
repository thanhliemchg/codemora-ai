import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {

  const { id } = await req.json()

  const { error } = await supabase
    .from("users")
    .update({ status: "active" })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message })
  }

  return NextResponse.json({ success: true })
}
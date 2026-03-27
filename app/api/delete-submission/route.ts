import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { id } = await req.json()

    if (!id) {
      return Response.json({ error: "Thiếu id" })
    }

    const { error } = await supabase
      .from("submissions")
      .delete()
      .eq("id", id)

    if (error) {
      console.log("Delete error:", error)
      return Response.json({ error: error.message })
    }

    return Response.json({ success: true })

  } catch (err) {
    return Response.json({ error: "Server lỗi" })
  }
}
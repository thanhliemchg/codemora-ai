import { supabase } from "@/lib/supabase"
export async function POST(req: Request){
  try{
    const body = await req.json()
    console.log("BODY:", body)

    const { id } = body

    if(!id){
      return Response.json({ error: "Thiếu id" })
    }

    // 🔥 check submissions
    const { data: subs, error: subErr } = await supabase
      .from("submissions")
      .select("id")
      .eq("student_id", id)

    if(subErr){
      console.log("SUB ERROR:", subErr)
      return Response.json({ error: subErr.message })
    }

    if(subs && subs.length > 0){
      return Response.json({
        error: "Học sinh đã có bài. Hãy xoá bài trong menu CHẤM BÀI trước."
      })
    }

    // 🔥 delete student_accounts
    const { error: err1 } = await supabase
      .from("student_accounts")
      .delete()
      .eq("id", id)

    if(err1){
      console.log("DELETE student_accounts lỗi:", err1)
      return Response.json({ error: err1.message })
    }

    // 🔥 delete users (optional)
    const { error: err2 } = await supabase
      .from("users")
      .delete()
      .eq("id", id)

    if(err2){
      console.log("DELETE users lỗi:", err2)
    }

    return Response.json({ success: true })

  }catch (err:any){
    console.log("🔥 SERVER ERROR:", err)
    return Response.json({ error: err.message || "Server lỗi" })
  }
}
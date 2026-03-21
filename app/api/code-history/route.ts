import { supabase } from "@/lib/supabase"

export async function GET(req: Request){

  const { searchParams } = new URL(req.url)
  const class_id = searchParams.get("class_id")

  /* =========================
     🔥 BÀI TỰ SINH
  ========================= */
  const { data:practice } = await supabase
    .from("code_history")
    .select(`
      id,
      code,
      language,
      ai_feedback,
      created_at,
      users(name)
    `)
    .eq("class_id", class_id)


  /* =========================
     🔥 BÀI GV GIAO
  ========================= */
  const { data:teacher } = await supabase
    .from("submissions")
    .select(`
      id,
      code,
      language,
      ai_feedback,
      created_at,
      users(name)
    `)
    .eq("class_id", class_id)
    .eq("type", "teacher")
    .not("code", "is", null) // chỉ lấy bài đã nộp


  /* =========================
     🔥 GỘP 2 NGUỒN
  ========================= */
  const all = [
    ...(practice || []).map(r => ({ ...r, source: "practice" })),
    ...(teacher || []).map(r => ({ ...r, source: "teacher" }))
  ]

  /* =========================
     🔥 SORT MỚI NHẤT
  ========================= */
  all.sort((a:any, b:any) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )


  /* =========================
     🔥 PARSE FEEDBACK
  ========================= */
  const result = all.map((r:any) => {

    let parsed:any = null

    try{
      parsed = r.ai_feedback ? JSON.parse(r.ai_feedback) : null
    }catch{}

    return {
      id: r.id,
      code: r.code,
      language: r.language,

      feedback: parsed?.feedback || r.ai_feedback || "",
      detail: parsed?.detail || [],

      student_name: r.users?.name,
      source: r.source // 🔥 thêm loại bài
    }
  })

  return Response.json(result)
}
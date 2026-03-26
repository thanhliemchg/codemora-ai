import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {

    // 1. lấy học sinh
    const { data: students, error: e1 } = await supabase
      .from("users")
      .select("id, name, email, status, class_id")
      .eq("role", "student")

    if (e1) throw e1

    // 2. lấy danh sách lớp
    const { data: classes, error: e2 } = await supabase
      .from("classes")
      .select("id, name")

    if (e2) throw e2

    // 3. tạo map id -> tên lớp
    const classMap: any = {}
    classes.forEach((c:any)=>{
      classMap[c.id] = c.name
    })

    // 4. gắn tên lớp vào học sinh
    const result = students.map((s:any)=>({
      ...s,
      class_name: classMap[s.class_id] || "Chưa có"
    }))

    return NextResponse.json(result)

  } catch (err:any) {
    console.error("API ERROR:", err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
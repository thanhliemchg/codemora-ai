import { supabase } from "@/lib/supabase"
export async function POST(req: Request){
  const { id, exercise, test_cases } = await req.json()

  const { data, error } = await supabase
    .from("generated_exercises")
    .update({
      exercise,
      test_cases
    })
    .eq("id", id)
    .select()

  console.log("UPDATE:", data, error)

  if(error){
    return Response.json({ error: error.message })
  }

  return Response.json({ success:true })
}
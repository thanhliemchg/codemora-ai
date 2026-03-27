import { Suspense } from "react"
import TeacherPage from "./TeacherPage"

export default function Page(){
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeacherPage/>
    </Suspense>
  )
}
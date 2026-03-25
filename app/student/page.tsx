import { Suspense } from "react"
import Student from "./Student"

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <Student />
    </Suspense>
  )
}
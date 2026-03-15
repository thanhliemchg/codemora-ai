"use client"

import Editor from "@monaco-editor/react"

export default function CodeEditor({ code, setCode, language }: any){

return(

<Editor
height="450px"
language={language}
theme="vs-dark"
value={code}
onChange={(v)=>setCode(v)}
options={{
fontSize:16,
minimap:{ enabled:false }
}}
/>

)

}
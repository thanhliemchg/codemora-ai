"use client"

import { useState,useEffect } from "react"
import { useRouter } from "next/navigation"
import { Mail,Lock,User,School,Eye,EyeOff } from "lucide-react"

export default function Register(){

const router = useRouter()

const [name,setName] = useState("")
const [email,setEmail] = useState("")
const [password,setPassword] = useState("")
const [confirmPassword,setConfirmPassword] = useState("")
const [showPassword,setShowPassword] = useState(false)

const [role,setRole] = useState("student")

const [classes,setClasses] = useState([])
const [class_id,setClassId] = useState("")

useEffect(()=>{

fetch("/api/classes")
.then(res=>res.json())
.then(data=>setClasses(data))

},[])

async function register(){

if(!name || !email || !password){
alert("Vui lòng nhập đầy đủ thông tin")
return
}

if(password !== confirmPassword){
alert("Mật khẩu nhập lại không đúng")
return
}

if(role==="student" && !class_id){
alert("Học sinh phải chọn lớp")
return
}

const res = await fetch("/api/register",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

name,
email,
password,
role,
class_id: role==="student" ? class_id : null

})

})

const data = await res.json()

if(data.exists){
alert("Email đã tồn tại")
return
}

if(data.success){

alert("Đăng ký thành công")

router.push("/login")

}else{

alert("Đăng ký thất bại")

}

}

return(

<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600">

<div className="backdrop-blur-lg bg-white/10 border border-white/20 p-10 rounded-2xl shadow-xl w-[420px]">

<h1 className="text-white text-3xl font-bold text-center mb-6">
CodeMora AI
</h1>

<p className="text-gray-200 text-center mb-8">
Tạo tài khoản mới
</p>

{/* NAME */}

<div className="relative mb-4">

<User className="absolute left-3 top-3 text-gray-300" size={18}/>

<input
placeholder="Họ tên"
className="w-full pl-10 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
onChange={e=>setName(e.target.value)}
/>

</div>

{/* EMAIL */}

<div className="relative mb-4">

<Mail className="absolute left-3 top-3 text-gray-300" size={18}/>

<input
type="email"
placeholder="Email"
className="w-full pl-10 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
onChange={e=>setEmail(e.target.value)}
/>

</div>

{/* PASSWORD */}

<div className="relative mb-4">

<Lock className="absolute left-3 top-3 text-gray-300" size={18}/>

<input
type={showPassword ? "text" : "password"}
placeholder="Mật khẩu"
className="w-full pl-10 pr-10 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
onChange={e=>setPassword(e.target.value)}
/>

<div
onClick={()=>setShowPassword(!showPassword)}
className="absolute right-3 top-3 cursor-pointer text-gray-300"
>
{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
</div>

</div>

{/* CONFIRM PASSWORD */}

<div className="relative mb-4">

<Lock className="absolute left-3 top-3 text-gray-300" size={18}/>

<input
type={showPassword ? "text" : "password"}
placeholder="Nhập lại mật khẩu"
className="w-full pl-10 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
onChange={e=>setConfirmPassword(e.target.value)}
/>

</div>

{/* ROLE */}

<select
className="w-full p-3 rounded-lg bg-white/20 text-white mb-4"
onChange={(e)=>setRole(e.target.value)}
>

<option value="student" className="text-black">Học sinh</option>

<option value="teacher" className="text-black">Giáo viên</option>

</select>

{/* CLASS SELECT */}

{role==="student" && (

<div className="relative mb-4">

<School className="absolute left-3 top-3 text-gray-300" size={18}/>

<select
className="w-full pl-10 p-3 rounded-lg bg-white/20 text-white"
onChange={(e)=>setClassId(e.target.value)}
>

<option value="" className="text-black">
Chọn lớp
</option>

{classes.map((c:any)=>(

<option key={c.id} value={c.id} className="text-black">
{c.name}
</option>

))}

</select>

</div>

)}

<button
onClick={register}
className="bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white w-full py-3 rounded-lg font-semibold"
>
Đăng ký
</button>

<div className="flex justify-between mt-4">

<button
onClick={()=>router.push("/login")}
className="text-gray-200 text-sm"
>
Đã có tài khoản?
</button>

<button
onClick={()=>router.push("/")}
className="text-gray-200 text-sm"
>
Trang chủ
</button>

</div>

</div>

</div>

)

}

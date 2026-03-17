"use client"

import { useState } from "react"

export default function ChangePassword(){

const [oldPassword,setOldPassword] = useState("")
const [newPassword,setNewPassword] = useState("")
const [confirmPassword,setConfirmPassword] = useState("")

async function changePassword(){

if(newPassword !== confirmPassword){
alert("Mật khẩu mới nhập không khớp")
return
}

const user = JSON.parse(localStorage.getItem("user") || "{}")

const res = await fetch("/api/change-password",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
user_id:user.id,
old_password:oldPassword,
new_password:newPassword
})
})

const data = await res.json()

if(data.success){

alert("Đổi mật khẩu thành công")

setOldPassword("")
setNewPassword("")
setConfirmPassword("")

}else{

alert(data.message || "Đổi mật khẩu thất bại")

}

}

return(

<div className="w-full [320px]">

<h2 className="text-lg font-bold mb-4 text-center text-black">
Đổi mật khẩu
</h2>

<input
type="password"
placeholder="Mật khẩu cũ"
value={oldPassword}
onChange={(e)=>setOldPassword(e.target.value)}
className="border p-2 w-full mb-3 rounded text-black"
/>

<input
type="password"
placeholder="Mật khẩu mới"
value={newPassword}
onChange={(e)=>setNewPassword(e.target.value)}
className="border p-2 w-full mb-3 rounded text-black"
/>

<input
type="password"
placeholder="Nhập lại mật khẩu mới"
value={confirmPassword}
onChange={(e)=>setConfirmPassword(e.target.value)}
className="border p-2 w-full mb-4 rounded text-black"
/>

<button
onClick={changePassword}
className="bg-indigo-600 text-white px-4 py-2 rounded w-full hover:bg-indigo-700"
>
Đổi mật khẩu
</button>

</div>

)

}
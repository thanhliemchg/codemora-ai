async function deleteStudent(id:string){

if(!confirm("Xoá học sinh này?")) return

const res = await fetch("/api/delete-student",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({id})
})

const result = await res.json()

if(!result.success){
alert("Lỗi ❌")
return
}

alert("Đã xoá")

loadStudents(selectedClass,selectedClassName)
}
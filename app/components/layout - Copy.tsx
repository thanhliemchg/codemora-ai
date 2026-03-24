"use client"

import Sidebar from "./sidebar"
import Header from "./header"

export default function Layout({ user, tab, changeTab, children }: any) {

return (

<div className="flex h-screen bg-gray-100">

{/* Sidebar */}
<Sidebar tab={tab} changeTab={changeTab} />

{/* Main */}
<div className="flex-1 flex flex-col">

<Header user={user} />

<div className="flex-1 overflow-auto p-8">

<div className="max-w-6xl mx-auto">

{children}

</div>

</div>

</div>

</div>

)

}
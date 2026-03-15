"use client"

import { BarChart,Bar,XAxis,YAxis,Tooltip } from "recharts"

const data = [
{ name:"Syntax", value:12 },
{ name:"Logic", value:9 },
{ name:"Loop", value:6 }
]

export default function ChartPanel(){

return(

<BarChart width={400} height={300} data={data}>

<XAxis dataKey="name"/>
<YAxis/>
<Tooltip/>
<Bar dataKey="value" fill="#6366f1"/>

</BarChart>

)

}
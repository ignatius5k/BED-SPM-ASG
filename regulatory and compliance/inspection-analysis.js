const inspections=[
{
stall:"Ben's Chicken Rice",
inspector:"Carol Teo",
score:95,
grade:"A",
date:"12 Jul"
},
{
stall:"Nasi Lemak Corner",
inspector:"John Lim",
score:88,
grade:"B",
date:"13 Jul"
},
{
stall:"Fish Soup Uncle",
inspector:"Sarah Tan",
score:91,
grade:"A",
date:"14 Jul"
},
{
stall:"Wanton Noodles",
inspector:"Daniel Ong",
score:77,
grade:"C",
date:"15 Jul"
},
{
stall:"Satay House",
inspector:"Emily Lee",
score:83,
grade:"B",
date:"16 Jul"
}
];

document.getElementById("totalInspection").innerHTML=inspections.length;

let total=0;
let gradeA=0;

inspections.forEach(i=>{

total+=i.score;

if(i.grade=="A")
gradeA++;

});

document.getElementById("averageScore").innerHTML=(total/inspections.length).toFixed(1);

document.getElementById("gradeA").innerHTML=gradeA;

document.getElementById("openIssues").innerHTML=2;

const tbody=document.getElementById("inspectionTable");

inspections.forEach(i=>{

tbody.innerHTML+=`
<tr>
<td>${i.stall}</td>
<td>${i.inspector}</td>
<td>${i.score}</td>
<td>${i.grade}</td>
<td>${i.date}</td>
</tr>
`;

});

new Chart(document.getElementById("scoreChart"),{

type:"line",

data:{

labels:inspections.map(x=>x.date),

datasets:[{

label:"Inspection Score",

data:inspections.map(x=>x.score),

fill:false,

borderWidth:3,

tension:.3

}]

}

});

new Chart(document.getElementById("gradeChart"),{

type:"pie",

data:{

labels:["A","B","C","D"],

datasets:[{

data:[2,2,1,0]

}]

}

});
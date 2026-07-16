const inspections=[
{
date:"12 Jul 2026",
centre:"Maxwell Food Centre",
stall:"Ben's Chicken Rice",
grade:"A",
status:"Passed",
food:"Pass",
cleanliness:"Pass",
pest:"Pass",
waste:"Pass",
comments:"Excellent hygiene standards."
},
{
date:"10 Jul 2026",
centre:"Tekka Centre",
stall:"Rojak Sisters",
grade:"B",
status:"Passed",
food:"Pass",
cleanliness:"Pass",
pest:"Pass",
waste:"Pass",
comments:"Minor cleaning improvements needed."
},
{
date:"8 Jul 2026",
centre:"Chomp Chomp",
stall:"SG Satay House",
grade:"C",
status:"Warning",
food:"Pass",
cleanliness:"Fail",
pest:"Pass",
waste:"Pass",
comments:"Dirty preparation area."
}
];

const tbody=document.querySelector("tbody");
const popup=document.getElementById("popup");
const popupBody=document.getElementById("popupBody");

function loadTable(data){

tbody.innerHTML="";

data.forEach(item=>{

tbody.innerHTML+=`
<tr>

<td>${item.date}</td>

<td>${item.centre}</td>

<td>${item.stall}</td>

<td>${item.grade}</td>

<td>${item.status}</td>

<td>
<button class="view-btn" onclick='viewInspection(${JSON.stringify(item)})'>
View
</button>
</td>

</tr>
`;

});

}

loadTable(inspections);

function viewInspection(item){

popup.style.display="block";

popupBody.innerHTML=`

<p><strong>Date:</strong> ${item.date}</p>

<p><strong>Hawker Centre:</strong> ${item.centre}</p>

<p><strong>Stall:</strong> ${item.stall}</p>

<p><strong>Food Handling:</strong> ${item.food}</p>

<p><strong>Cleanliness:</strong> ${item.cleanliness}</p>

<p><strong>Pest Control:</strong> ${item.pest}</p>

<p><strong>Waste Management:</strong> ${item.waste}</p>

<p><strong>Overall Grade:</strong> ${item.grade}</p>

<p><strong>Status:</strong> ${item.status}</p>

<p><strong>Comments:</strong><br>${item.comments}</p>

`;

}

document.getElementById("closePopup").onclick=()=>popup.style.display="none";

window.onclick=function(e){

if(e.target==popup){

popup.style.display="none";

}

}

document.getElementById("searchInput").addEventListener("keyup",function(){

const keyword=this.value.toLowerCase();

const filtered=inspections.filter(i=>

i.stall.toLowerCase().includes(keyword)||

i.centre.toLowerCase().includes(keyword)

);

loadTable(filtered);

});

document.getElementById("statusFilter").addEventListener("change",function(){

const status=this.value;

if(status==="all"){

loadTable(inspections);

return;

}

loadTable(inspections.filter(i=>i.status===status));

});
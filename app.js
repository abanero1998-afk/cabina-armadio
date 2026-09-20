const CATS=["Tutti","Camicie","Maglie","Pantaloni","Gonne","Abiti","Giacche","Cappotti","Scarpe","Borse","Accessori"];
const KEY="cabina.v1";
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{items:[],looks:[]}}catch{return{items:[],looks:[]}}}
function save(db){localStorage.setItem(KEY,JSON.stringify(db))}
let db=load();
const FEATURED=[
  {id:"nb1000",name:"New Balance 1000 nere",cat:"Scarpe",note:"M1000A black/grey · 3D 360°",model:"nb1000",fav:true},
  {id:"nb-cargo",name:"Twill Cargo Jogger",cat:"Pantaloni",note:"STONEWARE · MP41579 · XS",fav:true},
  {id:"nb-ls",name:"Athletics Premium LS",cat:"Maglie",note:"PERMAFROST · MT51931 · XS",fav:true},
  {id:"cam-fiori",name:"Camicia fiori celeste slim",cat:"Camicie",note:"taglia 37",fav:false},
  {id:"pant-blu",name:"Pantaloni classici blu",cat:"Pantaloni",note:"taglia 44",fav:false}
];
FEATURED.forEach(f=>{if(!db.items.some(i=>i.id===f.id))db.items.unshift({...f,photo:"",created:Date.now()})});
save(db);
let filter="Tutti",pickSlot=null,lookDraft={top:null,bottom:null,shoes:null,bag:null},closet3d=null;
const uid=()=>Math.random().toString(36).slice(2,10);
function enhanceAndCutout(file){return new Promise((resolve,reject)=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{const max=900;let w=img.width,h=img.height;if(w>max||h>max){const r=Math.min(max/w,max/h);w=Math.round(w*r);h=Math.round(h*r)}const c=document.createElement("canvas");c.width=w;c.height=h;const ctx=c.getContext("2d");ctx.drawImage(img,0,0,w,h);URL.revokeObjectURL(url);resolve(c.toDataURL("image/jpeg",0.8))};img.onerror=reject;img.src=url})}
function stats(){$("#nItems").textContent=db.items.length;$("#nFav").textContent=db.items.filter(i=>i.fav).length;$("#nOut").textContent=db.looks.length}
function cardHTML(item){const is3d=item.model==="nb1000"||item.id==="nb1000";return `<article class="card" data-id="${item.id}"><button class="fav" data-fav="${item.id}">${item.fav?"★":"☆"}</button><div class="ph">${item.photo?`<img src="${item.photo}" alt="">`:is3d?"3D 360°":""}</div><div class="meta"><h3>${item.name}</h3><p>${item.cat}${item.note?" · "+item.note:""}</p></div></article>`}
function visibleItems(){const q=($("#q")?.value||"").toLowerCase();return db.items.filter(i=>(filter==="Tutti"||i.cat===filter)&&(!q||(i.name+" "+i.cat+" "+(i.note||"")).toLowerCase().includes(q)))}
function renderLooks(){$$(".slot").forEach(s=>{const item=db.items.find(i=>i.id===lookDraft[s.dataset.slot]);s.innerHTML=item?item.name:s.dataset.slot});const box=$("#looks");if(!box)return;box.innerHTML=db.looks.map(l=>`<article class="card" data-look="${l.id}"><div class="ph"></div><div class="meta"><h3>${l.name}</h3></div></article>`).join("")||""}
function renderArmadio(){const chips=$("#chips");if(chips)chips.innerHTML=CATS.map(c=>`<button class="chip ${c===filter?"active":""}" data-cat="${c}">${c}</button>`).join("");const list=visibleItems();const grid=$("#grid");if(grid)grid.innerHTML=list.length?list.map(cardHTML).join(""):`<div class="empty">Nessun capo</div>`;const recent=$("#recentGrid");if(recent)recent.innerHTML=db.items.slice(0,8).map(cardHTML).join("");renderLooks();stats();if(closet3d)closet3d.refresh()}
function showView(name){["home","armadio","avatar","look","info"].forEach(v=>{const el=$("#view-"+v);if(el)el.hidden=v!==name});$$(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===name))}
function openItem(item){$("#itemId").value=item?.id||"";$("#dlgTitle").textContent=item?"Modifica":"Nuovo capo";$("#name").value=item?.name||"";$("#cat").value=item?.cat||"Camicie";$("#note").value=item?.note||"";$("#preview").src=item?.photo||"";$("#delItem").hidden=!item;$("#dlgItem").showModal()}
$("#photo").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;$("#preview").src=await enhanceAndCutout(f)});
$("#formItem").addEventListener("submit",e=>{e.preventDefault();const id=$("#itemId").value||uid();const existing=db.items.find(i=>i.id===id);const item={id,name:$("#name").value.trim(),cat:$("#cat").value,note:$("#note").value.trim(),photo:$("#preview").src.startsWith("data:")?$("#preview").src:(existing?.photo||""),fav:existing?.fav||false,created:existing?.created||Date.now(),model:existing?.model};if(existing)Object.assign(existing,item);else db.items.push(item);save(db);$("#dlgItem").close();renderArmadio()});
$("#cancelItem").onclick=()=>$("#dlgItem").close();
$("#delItem").onclick=()=>{const id=$("#itemId").value;db.items=db.items.filter(i=>i.id!==id);save(db);$("#dlgItem").close();renderArmadio()};
document.addEventListener("click",e=>{
  const fav=e.target.closest("[data-fav]");if(fav){const it=db.items.find(i=>i.id===fav.dataset.fav);if(it){it.fav=!it.fav;save(db);renderArmadio()}return}
  const card=e.target.closest(".card[data-id]");if(card&&!e.target.closest("#pickGrid")){const it=db.items.find(i=>i.id===card.dataset.id);if(it&&(it.id==="nb1000"||it.model==="nb1000")){window.__open360&&window.__open360();return}if(it)openItem(it)}
});
document.addEventListener("click",e=>{const b=e.target.closest("#chips [data-cat]");if(!b)return;filter=b.dataset.cat;renderArmadio()});
$$(".zone").forEach(z=>z.onclick=()=>{filter=z.dataset.cat;showView("armadio");renderArmadio()});
$("#q")?.addEventListener("input",renderArmadio);
$("#btnAdd").onclick=$("#btnAdd2").onclick=()=>openItem(null);
$$(".tab").forEach(t=>t.onclick=()=>showView(t.dataset.view));
$$(".slot").forEach(s=>s.onclick=()=>{pickSlot=s.dataset.slot;const map={top:["Camicie","Maglie","Giacche","Cappotti"],bottom:["Pantaloni","Gonne","Abiti"],shoes:["Scarpe"],bag:["Borse","Accessori"]};const list=db.items.filter(i=>(map[pickSlot]||CATS).includes(i.cat));$("#pickGrid").innerHTML=list.map(cardHTML).join("")||"Niente";$("#dlgPick").showModal()});
$("#pickGrid").addEventListener("click",e=>{const card=e.target.closest("[data-id]");if(!card||!pickSlot)return;lookDraft[pickSlot]=card.dataset.id;$("#dlgPick").close();renderLooks()});
$("#closePick").onclick=()=>$("#dlgPick").close();
$("#saveLook").onclick=()=>{const name=prompt("Nome look","Look");if(!name)return;db.looks.unshift({id:uid(),name,...lookDraft});save(db);renderArmadio()};
$("#clearLook").onclick=()=>{lookDraft={top:null,bottom:null,shoes:null,bag:null};renderLooks()};
$("#wipe").onclick=()=>{if(confirm("Cancellare?")){db={items:[],looks:[]};save(db);location.reload()}};
$("#btnMotion")?.addEventListener("click",()=>{if(!closet3d)return;closet3d.setMotion(!closet3d.isMoving())});
window.__cabinaItems=()=>db.items;window.__cabinaReady=api=>{closet3d=api};
renderArmadio();

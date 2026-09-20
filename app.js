const CATS = ["Tutti","Camicie","Maglie","Pantaloni","Gonne","Abiti","Giacche","Cappotti","Scarpe","Borse","Accessori"];
const KEY = "cabina.v1";
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { items: [], looks: [] }; }
  catch { return { items: [], looks: [] }; }
}
function save(db) { localStorage.setItem(KEY, JSON.stringify(db)); }
let db = load();
let filter = "Tutti";
let pickSlot = null;
let lookDraft = { top:null, bottom:null, shoes:null, bag:null };
let closet3d = null;
function uid() { return Math.random().toString(36).slice(2,10); }
function enhanceAndCutout(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 900;
      let w = img.width, h = img.height;
      if (w > max || h > max) { const r = Math.min(max/w, max/h); w = Math.round(w*r); h = Math.round(h*r); }
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const data = ctx.getImageData(0, 0, w, h); const p = data.data;
      const corners = [0, (w-1)*4, (h-1)*w*4, ((h-1)*w+(w-1))*4];
      const avg = [0,0,0];
      corners.forEach(i => { avg[0]+=p[i]; avg[1]+=p[i+1]; avg[2]+=p[i+2]; });
      avg[0]/=4; avg[1]/=4; avg[2]/=4;
      const bgBright = (avg[0]+avg[1]+avg[2])/3;
      for (let i=0;i<p.length;i+=4) {
        let r=p[i], g=p[i+1], b=p[i+2];
        const bright=(r+g+b)/3;
        const dist=Math.hypot(r-avg[0], g-avg[1], b-avg[2]);
        if (bgBright>200 && dist<48 && bright>185) p[i+3]=0;
        else if (bgBright>160 && dist<28 && bright>210) p[i+3]=0;
        else {
          p[i]=Math.min(255,(r-128)*1.12+128);
          p[i+1]=Math.min(255,(g-128)*1.12+128);
          p[i+2]=Math.min(255,(b-128)*1.12+128);
        }
      }
      ctx.putImageData(data,0,0);
      let minX=w,minY=h,maxX=0,maxY=0;
      for (let y=0;y<h;y++) for (let x=0;x<w;x++) if (p[(y*w+x)*4+3]>12) {
        if (x<minX) minX=x; if (y<minY) minY=y; if (x>maxX) maxX=x; if (y>maxY) maxY=y;
      }
      if (maxX>minX && maxY>minY) {
        const pad=12;
        minX=Math.max(0,minX-pad); minY=Math.max(0,minY-pad);
        maxX=Math.min(w-1,maxX+pad); maxY=Math.min(h-1,maxY+pad);
        const cw=maxX-minX+1, ch=maxY-minY+1;
        const out=document.createElement("canvas"); out.width=cw; out.height=ch;
        out.getContext("2d").drawImage(c,minX,minY,cw,ch,0,0,cw,ch);
        resolve(out.toDataURL("image/png"));
      } else resolve(c.toDataURL("image/jpeg",0.82));
    };
    img.onerror=reject; img.src=url;
  });
}
function stats() {
  $("#nItems").textContent = db.items.length;
  $("#nFav").textContent = db.items.filter(i=>i.fav).length;
  $("#nOut").textContent = db.looks.length;
}
function cardHTML(item) {
  return `<article class="card" data-id="${item.id}"><button class="fav" data-fav="${item.id}">${item.fav?"★":"☆"}</button><div class="ph">${item.photo?`<img src="${item.photo}" alt="${item.name}">`:"Nessuna foto"}</div><div class="meta"><h3>${item.name}</h3><p>${item.cat}${item.note?" · "+item.note:""}</p></div></article>`;
}
function visibleItems() {
  const q = ($("#q")?.value || "").toLowerCase();
  return db.items.filter(i => {
    const okCat = filter==="Tutti" || i.cat===filter;
    const okQ = !q || (i.name+" "+i.cat+" "+(i.note||"")).toLowerCase().includes(q);
    return okCat && okQ;
  });
}
function renderArmadio() {
  const chips=$("#chips");
  if (chips) chips.innerHTML = CATS.map(c=>`<button class="chip ${c===filter?"active":""}" data-cat="${c}">${c}</button>`).join("");
  const list=visibleItems();
  const grid=$("#grid");
  if (grid) grid.innerHTML = list.length ? list.map(cardHTML).join("") : `<div class="empty" style="grid-column:1/-1"><h3>Nessun capo qui</h3><p>Aggiungi le foto dei tuoi vestiti.</p></div>`;
  const recent=$("#recentGrid");
  if (recent) {
    const last=[...db.items].slice(-8).reverse();
    recent.innerHTML = last.length ? last.map(cardHTML).join("") : `<div class="empty" style="grid-column:1/-1"><h3>Ancora nessun capo</h3><p>Carica una foto: viene pulita e appesa in 3D.</p></div>`;
  }
  renderLooks(); stats();
  if (closet3d) closet3d.refresh();
}
function renderLooks() {
  $$(".slot").forEach(s => {
    const id=lookDraft[s.dataset.slot];
    const item=db.items.find(i=>i.id===id);
    if (item?.photo) s.innerHTML=`<img src="${item.photo}" alt=""><div class="lab">${item.name}</div>`;
    else {
      const labels={top:"Sopra",bottom:"Sotto / Abito",shoes:"Scarpe",bag:"Borsa / Accessorio"};
      s.innerHTML=`<div class="lab">${labels[s.dataset.slot]||s.dataset.slot}</div>`;
    }
  });
  const box=$("#looks"); if (!box) return;
  if (!db.looks.length) { box.innerHTML=`<div class="empty" style="grid-column:1/-1"><h3>Nessun look ancora</h3><p>Compila gli slot e salva.</p></div>`; return; }
  box.innerHTML = db.looks.map(l => {
    const parts=["top","bottom","shoes","bag"].map(k=>db.items.find(i=>i.id===l[k])).filter(Boolean);
    const img=parts[0]?.photo||"";
    return `<article class="card" data-look="${l.id}"><div class="ph">${img?`<img src="${img}" alt="">`:""}</div><div class="meta"><h3>${l.name}</h3><p>${parts.map(p=>p.cat).join(" · ")}</p></div></article>`;
  }).join("");
}
function showView(name) {
  ["home","armadio","look","info"].forEach(v => { const el=$("#view-"+v); if (el) el.hidden = v!==name; });
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.view===name));
}
function openItem(item) {
  $("#itemId").value=item?.id||"";
  $("#dlgTitle").textContent=item?"Modifica capo":"Nuovo capo 3D";
  $("#name").value=item?.name||""; $("#cat").value=item?.cat||"Camicie"; $("#note").value=item?.note||"";
  $("#preview").src=item?.photo||""; $("#preview").style.display=item?.photo?"block":"none";
  $("#delItem").hidden=!item;
  const st=$("#statusFoto"); if (st) st.textContent="";
  $("#dlgItem").showModal();
}
$("#photo").addEventListener("change", async (e) => {
  const f=e.target.files[0]; if (!f) return;
  const st=$("#statusFoto"); if (st) st.textContent="Sto pulendo la foto per il 3D…";
  try {
    const data=await enhanceAndCutout(f);
    $("#preview").src=data; $("#preview").style.display="block";
    if (st) st.textContent="Pronto: sfondo pulito, contrasto alzato, ritaglio automatico.";
  } catch { if (st) st.textContent="Non sono riuscito a elaborare questa foto."; }
});
$("#formItem").addEventListener("submit", (e) => {
  e.preventDefault();
  const id=$("#itemId").value||uid();
  const existing=db.items.find(i=>i.id===id);
  const item={ id, name:$("#name").value.trim(), cat:$("#cat").value, note:$("#note").value.trim(), photo:$("#preview").src.startsWith("data:")?$("#preview").src:(existing?.photo||""), fav:existing?.fav||false, created:existing?.created||Date.now() };
  if (existing) Object.assign(existing,item); else db.items.push(item);
  save(db); $("#dlgItem").close(); renderArmadio(); showView("home");
});
$("#cancelItem").onclick=()=>$("#dlgItem").close();
$("#delItem").onclick=()=>{
  const id=$("#itemId").value;
  db.items=db.items.filter(i=>i.id!==id);
  db.looks=db.looks.filter(l=>![l.top,l.bottom,l.shoes,l.bag].includes(id));
  save(db); $("#dlgItem").close(); renderArmadio();
};
document.addEventListener("click", (e) => {
  const fav=e.target.closest("[data-fav]");
  if (fav) { e.stopPropagation(); const it=db.items.find(i=>i.id===fav.dataset.fav); if (it){ it.fav=!it.fav; save(db); renderArmadio(); } return; }
  const card=e.target.closest(".card[data-id]");
  if (card && !e.target.closest("#pickGrid")) { const it=db.items.find(i=>i.id===card.dataset.id); if (it) openItem(it); return; }
  const look=e.target.closest("[data-look]");
  if (look && confirm("Eliminare questo look?")) { db.looks=db.looks.filter(l=>l.id!==look.dataset.look); save(db); renderArmadio(); }
});
document.addEventListener("click", (e) => {
  const b=e.target.closest("#chips [data-cat]"); if (!b) return; filter=b.dataset.cat; renderArmadio();
});
$$(".zone").forEach(z => z.onclick=()=>{ filter=z.dataset.cat; showView("armadio"); renderArmadio(); });
$("#q")?.addEventListener("input", renderArmadio);
$("#btnAdd").onclick=$("#btnAdd2").onclick=()=>openItem(null);
$$(".tab").forEach(t => t.onclick=()=>showView(t.dataset.view));
$$(".slot").forEach(s => s.onclick=()=>{
  pickSlot=s.dataset.slot;
  const map={ top:["Camicie","Maglie","Giacche","Cappotti"], bottom:["Pantaloni","Gonne","Abiti"], shoes:["Scarpe"], bag:["Borse","Accessori"] };
  const list=db.items.filter(i=>(map[pickSlot]||CATS).includes(i.cat));
  $("#pickGrid").innerHTML=list.length?list.map(cardHTML).join(""):`<div class="empty" style="grid-column:1/-1"><h3>Nessun capo adatto</h3></div>`;
  $("#dlgPick").showModal();
});
$("#pickGrid").addEventListener("click", (e) => {
  const card=e.target.closest("[data-id]"); if (!card||!pickSlot) return;
  lookDraft[pickSlot]=card.dataset.id; $("#dlgPick").close(); renderLooks();
});
$("#closePick").onclick=()=>$("#dlgPick").close();
$("#saveLook").onclick=()=>{
  if (!lookDraft.top && !lookDraft.bottom) return alert("Scegli almeno un capo principale.");
  const name=prompt("Nome del look", "Look "+(db.looks.length+1)); if (!name) return;
  db.looks.unshift({ id:uid(), name, ...lookDraft, created:Date.now() }); save(db); renderArmadio();
};
$("#clearLook").onclick=()=>{ lookDraft={top:null,bottom:null,shoes:null,bag:null}; renderLooks(); };
$("#wipe").onclick=()=>{ if (!confirm("Cancellare vestiti e look salvati su questo dispositivo?")) return; db={items:[],looks:[]}; save(db); renderArmadio(); };
$("#btnMotion")?.addEventListener("click", () => {
  if (!closet3d) return;
  const on=!closet3d.isMoving();
  closet3d.setMotion(on);
  $("#btnMotion").textContent = on ? "Pausa movimento" : "Riprendi movimento";
});
window.__cabinaItems = () => db.items;
window.__cabinaReady = (api) => { closet3d = api; };
renderArmadio();

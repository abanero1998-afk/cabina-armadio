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

function uid() { return Math.random().toString(36).slice(2,10); }

function compress(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 900;
      let { width:w, height:h } = img;
      if (w > max || h > max) {
        const r = Math.min(max/w, max/h);
        w = Math.round(w*r); h = Math.round(h*r);
      }
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function stats() {
  $("#nItems").textContent = db.items.length;
  $("#nFav").textContent = db.items.filter(i => i.fav).length;
  $("#nOut").textContent = db.looks.length;
}

function cardHTML(item) {
  return `<article class="card" data-id="${item.id}">
    <button class="fav" data-fav="${item.id}">${item.fav ? "★" : "☆"}</button>
    <div class="ph">${item.photo ? `<img src="${item.photo}" alt="${item.name}">` : "Nessuna foto"}</div>
    <div class="meta"><h3>${item.name}</h3><p>${item.cat}${item.note ? " · " + item.note : ""}</p></div>
  </article>`;
}

function visibleItems() {
  const q = ($("#q")?.value || "").toLowerCase();
  return db.items.filter(i => {
    const okCat = filter === "Tutti" || i.cat === filter;
    const okQ = !q || (i.name+" "+i.cat+" "+(i.note||"")).toLowerCase().includes(q);
    return okCat && okQ;
  });
}

function renderArmadio() {
  const chips = $("#chips");
  if (chips) {
    chips.innerHTML = CATS.map(c => `<button class="chip ${c===filter?"active":""}" data-cat="${c}">${c}</button>`).join("");
  }
  const list = visibleItems();
  const grid = $("#grid");
  if (grid) {
    grid.innerHTML = list.length ? list.map(cardHTML).join("") : `<div class="empty" style="grid-column:1/-1"><h3>Nessun capo qui</h3><p>Aggiungi le foto dei tuoi vestiti per riempire la cabina.</p></div>`;
  }
  const recent = $("#recentGrid");
  if (recent) {
    const last = [...db.items].slice(-8).reverse();
    recent.innerHTML = last.length ? last.map(cardHTML).join("") : `<div class="empty" style="grid-column:1/-1"><h3>La cabina è vuota</h3><p>Inizia scattando la foto di una camicia, un paio di scarpe o una borsa.</p></div>`;
  }
  renderLooks();
  stats();
}

function renderLooks() {
  $$(".slot").forEach(s => {
    const id = lookDraft[s.dataset.slot];
    const item = db.items.find(i => i.id === id);
    if (item?.photo) s.innerHTML = `<img src="${item.photo}" alt=""><div class="lab">${item.name}</div>`;
    else {
      const labels = { top:"Sopra", bottom:"Sotto / Abito", shoes:"Scarpe", bag:"Borsa / Accessorio" };
      s.innerHTML = `<div class="lab">${labels[s.dataset.slot]||s.dataset.slot}</div>`;
    }
  });
  const box = $("#looks");
  if (!box) return;
  if (!db.looks.length) {
    box.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Nessun look ancora</h3><p>Compila i quattro slot e salva.</p></div>`;
    return;
  }
  box.innerHTML = db.looks.map(l => {
    const parts = ["top","bottom","shoes","bag"].map(k => db.items.find(i => i.id === l[k])).filter(Boolean);
    const img = parts[0]?.photo || "";
    return `<article class="card" data-look="${l.id}">
      <div class="ph">${img ? `<img src="${img}" alt="">` : ""}</div>
      <div class="meta"><h3>${l.name}</h3><p>${parts.map(p=>p.cat).join(" · ")}</p></div>
    </article>`;
  }).join("");
}

function showView(name) {
  ["home","armadio","look","info"].forEach(v => {
    const el = $("#view-"+v);
    if (el) el.hidden = v !== name;
  });
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === name));
}

function openItem(item) {
  $("#itemId").value = item?.id || "";
  $("#dlgTitle").textContent = item ? "Modifica capo" : "Nuovo capo";
  $("#name").value = item?.name || "";
  $("#cat").value = item?.cat || "Camicie";
  $("#note").value = item?.note || "";
  $("#preview").src = item?.photo || "";
  $("#preview").style.display = item?.photo ? "block" : "none";
  $("#delItem").hidden = !item;
  $("#dlgItem").showModal();
}

$("#photo").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const data = await compress(f);
  $("#preview").src = data;
  $("#preview").style.display = "block";
});

$("#formItem").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = $("#itemId").value || uid();
  const existing = db.items.find(i => i.id === id);
  const item = {
    id,
    name: $("#name").value.trim(),
    cat: $("#cat").value,
    note: $("#note").value.trim(),
    photo: $("#preview").src.startsWith("data:") ? $("#preview").src : (existing?.photo || ""),
    fav: existing?.fav || false,
    created: existing?.created || Date.now()
  };
  if (existing) Object.assign(existing, item);
  else db.items.push(item);
  save(db);
  $("#dlgItem").close();
  renderArmadio();
});

$("#cancelItem").onclick = () => $("#dlgItem").close();
$("#delItem").onclick = () => {
  const id = $("#itemId").value;
  db.items = db.items.filter(i => i.id !== id);
  db.looks = db.looks.filter(l => ![l.top,l.bottom,l.shoes,l.bag].includes(id));
  save(db);
  $("#dlgItem").close();
  renderArmadio();
};

document.addEventListener("click", (e) => {
  const fav = e.target.closest("[data-fav]");
  if (fav) {
    e.stopPropagation();
    const it = db.items.find(i => i.id === fav.dataset.fav);
    if (it) { it.fav = !it.fav; save(db); renderArmadio(); }
    return;
  }
  const card = e.target.closest(".card[data-id]");
  if (card) {
    const it = db.items.find(i => i.id === card.dataset.id);
    if (it) openItem(it);
    return;
  }
  const look = e.target.closest("[data-look]");
  if (look) {
    if (confirm("Eliminare questo look?")) {
      db.looks = db.looks.filter(l => l.id !== look.dataset.look);
      save(db); renderArmadio();
    }
  }
});

document.addEventListener("click", (e) => {
  const b = e.target.closest("#chips [data-cat]");
  if (!b) return;
  filter = b.dataset.cat;
  renderArmadio();
});

$$(".zone").forEach(z => z.onclick = () => {
  filter = z.dataset.cat;
  showView("armadio");
  renderArmadio();
});

$("#q")?.addEventListener("input", renderArmadio);
$("#btnAdd").onclick = $("#btnAdd2").onclick = () => openItem(null);

$$(".tab").forEach(t => t.onclick = () => showView(t.dataset.view));

$$(".slot").forEach(s => s.onclick = () => {
  pickSlot = s.dataset.slot;
  const map = { top:["Camicie","Maglie","Giacche","Cappotti"], bottom:["Pantaloni","Gonne","Abiti"], shoes:["Scarpe"], bag:["Borse","Accessori"] };
  const allowed = map[pickSlot] || CATS;
  const list = db.items.filter(i => allowed.includes(i.cat));
  $("#pickGrid").innerHTML = list.length ? list.map(cardHTML).join("") : `<div class="empty" style="grid-column:1/-1"><h3>Nessun capo adatto</h3><p>Aggiungi prima qualcosa in questa categoria.</p></div>`;
  $("#dlgPick").showModal();
});

$("#pickGrid").addEventListener("click", (e) => {
  const card = e.target.closest("[data-id]");
  if (!card || !pickSlot) return;
  lookDraft[pickSlot] = card.dataset.id;
  $("#dlgPick").close();
  renderLooks();
});
$("#closePick").onclick = () => $("#dlgPick").close();

$("#saveLook").onclick = () => {
  if (!lookDraft.top && !lookDraft.bottom) return alert("Scegli almeno un capo principale.");
  const name = prompt("Nome del look", "Look " + (db.looks.length+1));
  if (!name) return;
  db.looks.unshift({ id: uid(), name, ...lookDraft, created: Date.now() });
  save(db); renderArmadio();
};
$("#clearLook").onclick = () => { lookDraft = { top:null, bottom:null, shoes:null, bag:null }; renderLooks(); };

$("#wipe").onclick = () => {
  if (!confirm("Cancellare vestiti e look salvati su questo dispositivo?")) return;
  db = { items: [], looks: [] };
  save(db); renderArmadio();
};

$("#btnDemo").onclick = () => {
  if (db.items.length && !confirm("Aggiungere alcuni capi esempio? I tuoi restano.")) return;
  const demo = [
    { name:"Camicia bianca", cat:"Camicie", note:"base, tutto l'anno" },
    { name:"Maglione beige", cat:"Maglie", note:"inverno" },
    { name:"Jeans scuri", cat:"Pantaloni", note:"casual" },
    { name:"Pantalone nero", cat:"Pantaloni", note:"sera" },
    { name:"Trench camel", cat:"Cappotti", note:"mezza stagione" },
    { name:"Abito nero", cat:"Abiti", note:"cerimonia" },
    { name:"Sneakers bianche", cat:"Scarpe", note:"tutti i giorni" },
    { name:"Décolleté nude", cat:"Scarpe", note:"elegante" },
    { name:"Borsa tote beige", cat:"Borse", note:"giorno" },
    { name:"Clutch nera", cat:"Borse", note:"sera" }
  ].map(x => ({ ...x, id: uid(), photo:"", fav:false, created: Date.now() }));
  db.items.push(...demo);
  save(db); renderArmadio();
};

renderArmadio();


js/app.js (() => { const app = document.getElementById("app"); const navButtons = Array.from(document.querySelectorAll(".tabbar button"));

const state = { route: "home", current: null, // huidig dossier in bewerking };

function setRoute(route, params = {}) { state.route = route; render(route, params); navButtons.forEach(b => b.classList.toggle("active", b.dataset.route === route)); }

// Views function viewHome() { return


      <section class="card">         <h2>Welkom</h2>         <p>Kies een actie. De app werkt offline, slaat inspecties lokaal op en genereert een gecombineerd PDF‑rapport.</p>         <div class="actions">           <button class="primary" data-nav="new">Nieuwe WPI</button>           <button class="ghost" data-nav="list">Dossiers</button>         </div>       </section>       <section class="card">         <h3>Snelkoppelingen</h3>         <div class="row cols-2">           <button class="ghost" data-start="engineers">WPI Engineers</button>           <button class="ghost" data-start="seveso">WPI Magazijn Seveso</button>           <button class="ghost" data-start="gebouw">WPI Gebouw & Brandveiligheid</button>           <button class="ghost" data-nav="about">Over</button>         </div>       </section>    
; }

function viewNew() { return


      <section class="card">         <h2>Start nieuwe inspectie</h2>         <label class="label">Type WPI</label>         <select id="sel-type" class="input">           <option value="engineers">WPI Engineers</option>           <option value="seveso">WPI Magazijn Seveso</option>           <option value="gebouw">WPI Gebouw & Brandveiligheid</option>         </select>         <div class="row cols-2">           <button id="btn-start" class="primary">Start</button>           <button class="ghost" data-nav="home">Annuleer</button>         </div>       </section>    
; }

function viewList(items) { if (!items.length) { return <section class="card"><h2>Dossiers</h2><p>Geen dossiers gevonden.</p></section>; } const lis = items.map(i =>


      <div class="card">         <div class="row">           <div><b>${i.code}</b></div>           <div class="label">${i.typeLabel} · ${new Date(i.createdAt).toLocaleString()}</div>           <div class="actions">             <button class="primary" data-open="${i.id}">Open</button>             <button class="ghost" data-export="${i.id}">Export PDF</button>             <button class="ghost" data-del="${i.id}">Verwijder</button>           </div>         </div>       </div>    
).join(""); return <section><h2 style="padding:0 8px">Dossiers</h2>${lis}</section>; }

function viewAbout() { return


      <section class="card">         <h2>Over deze app</h2>         <p>PWA voor WPI-inspecties. Werkt offline, ondersteunt foto’s en handtekening, en exporteert één gecombineerd PDF-rapport per inspectie.</p>       </section>    
; }

async function render(route) { if (route === "home") app.innerHTML = viewHome(); if (route === "new") app.innerHTML = viewNew(); if (route === "list") { const items = await DB.list(); app.innerHTML = viewList(items); } if (route === "about") app.innerHTML = viewAbout(); if (route === "form") { app.innerHTML = Forms.render(state.current); Forms.bind(state.current, onSave, onExport, onBack); } bindEvents(); }

function bindEvents() { // bottom nav + interne nav app.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", () => setRoute(b.dataset.nav))); document.querySelectorAll(".tabbar button").forEach(b => b.addEventListener("click", () => setRoute(b.dataset.route)));



// start wizard
const startBtn = document.getElementById("btn-start");
if (startBtn) {
  startBtn.addEventListener("click", async () => {
    const type = document.getElementById("sel-type").value;
    const dossier = Forms.newDossier(type);
    await DB.save(dossier);
    state.current = dossier;
    setRoute("form");
  });
}
// snelkoppelingen home
app.querySelectorAll("[data-start]").forEach(b => {
  b.addEventListener("click", async () => {
    const dossier = Forms.newDossier(b.dataset.start);
    await DB.save(dossier);
    state.current = dossier;
    setRoute("form");
  });
});
// Dossier acties
app.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", async () => {
  const id = b.dataset.open;
  state.current = await DB.get(id);
  setRoute("form");
}));
app.querySelectorAll("[data-export]").forEach(b => b.addEventListener("click", async () => {
  const id = b.dataset.export;
  const dossier = await DB.get(id);
  await PDF.export(dossier);
}));
app.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", async () => {
  const id = b.dataset.del;
  if (confirm("Dit dossier verwijderen?")) {
    await DB.remove(id);
    setRoute("list");
  }
}));
}

async function onSave(dossier) { await DB.save(dossier); alert("Opgeslagen."); }

async function onExport(dossier) { await DB.save(dossier); await PDF.export(dossier); }

function onBack() { setRoute("home"); }

// Init setRoute("home"); })();

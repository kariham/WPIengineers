
Onderdeel 4 — js/db.js

Pad: js/db.js
Doel: IndexedDB-opslag voor dossiers.
Inhoud: const DB = (() => { const STORE = "wpi"; let _db;

function open() { return new Promise((resolve,reject)=>{ const req = indexedDB.open("wpi-db",1); req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(STORE)) { db.createObjectStore(STORE,{ keyPath:"id" }); } }; req.onsuccess = () => { _db = req.result; resolve(); }; req.onerror = () => reject(req.error); }); }

async function tx(mode="readonly"){ if(!_db) await open(); return _db.transaction(STORE,mode).objectStore(STORE); }

async function save(doc){ const store = await tx("readwrite"); doc.updatedAt = new Date().toISOString(); return new Promise((res,rej)=>{ const r = store.put(doc); r.onsuccess=()=>res(doc); r.onerror=()=>rej(r.error); }); }

async function get(id){ const store = await tx(); return new Promise((res,rej)=>{ const r = store.get(id); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }

async function list(){ const store = await tx(); return new Promise((res,rej)=>{ const out=[]; const r = store.openCursor(); r.onsuccess=()=>{ const c=r.result; if(c){ out.push(c.value); c.continue(); } else { out.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)); res(out);} }; r.onerror=()=>rej(r.error); }); }

async function remove(id){ const store = await tx("readwrite"); return new Promise((res,rej)=>{ const r=store.delete(id); r.onsuccess=()=>res(true); r.onerror=()=>rej(r.error); }); }

return { save, get, list, remove }; })();

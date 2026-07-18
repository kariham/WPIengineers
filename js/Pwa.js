
Pad: js/pwa.js
Doel: install-knop en service worker registratie.
Plak dit in js/pwa.js:

(() => { // SW-registratie if ("serviceWorker" in navigator) { window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(()=>{}); }); }

// Install prompt let deferred; window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; const btn = document.getElementById("btn-install"); if (btn) btn.style.display = "inline-block"; btn?.addEventListener("click", async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; btn.style.display = "none"; }); }); })();

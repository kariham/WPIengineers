
Onderdeel 7 — js/pdf.js

Pad: js/pdf.js
Doel: gecombineerd PDF-rapport per WPI (basisgegevens, bevindingen, foto’s, handtekening).
Plak dit in js/pdf.js:

const PDF = (() => { async function ensureJsPDF() { if (!window.jspdf) { await importJs("
cdnjs.cloudflare.com
"); } return window.jspdf.jsPDF; }

async function exportPdf(dossier) { const jsPDF = await ensureJsPDF(); const doc = new jsPDF({ unit: "pt", format: "a4" }); // 595x842 pt const margin = 40; const width = 595 - margin * 2; let y = margin;



const setFont = (bold = false, size = 11) => {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(0, 0, 0);
};
const addLine = (text, size = 11, bold = false) => {
  setFont(bold, size);
  const lines = doc.splitTextToSize(text, width);
  const h = lines.length * size * 1.2;
  if (y + h > 842 - margin) newPage();
  doc.text(lines, margin, y);
  y += h;
};
const spacer = (h = 10) => { if (y + h > 842 - margin) newPage(); y += h; };
const hr = () => { if (y + 8 > 842 - margin) newPage(); doc.setDrawColor(229,231,235); doc.setLineWidth(1); doc.line(margin, y, margin + width, y); y += 8; };
const title = (t, s = 18) => { doc.setTextColor(11,108,255); addLine(t, s, true); doc.setTextColor(0,0,0); };
const newPage = () => { doc.addPage(); y = margin; footer(); };
const footer = () => { /* simple page numbers handled at the end */ };
// Titel
title(`${dossier.typeLabel} — Rapport`);
addLine(`Code: ${dossier.code}`);
addLine(`Datum/tijd: ${new Date(dossier.createdAt).toLocaleString()}`);
addLine(`Locatie: ${dossier.basis.locatie || "-"}`);
addLine(`Project: ${dossier.basis.project || "-"}`);
addLine(`Uitvoerder(s): ${dossier.basis.uitvoerders || "-"}`);
addLine(`Contact: ${dossier.basis.contact || "-"}`);
addLine(`Weersomstandigheden: ${dossier.basis.weersomstandigheden || "-"}`);
spacer(6); hr(); spacer(6);
// Overzichtstabel (vragen + status)
title("Overzicht bevindingen", 14);
drawTable(
  [["Onderdeel", "Vraag", "Status", "Opmerking"]],
  dossier.items.map(it => {
    const status = it.value || "";
    const note = (it.note || "").trim();
    const onderdeel = it.key.split(".")[0] === "basis" ? "Basis" : guessSection(it.key);
    return [onderdeel, it.label, status.toUpperCase(), note];
  }),
  [0.18, 0.42, 0.12, 0.28]
);
spacer(8); hr(); spacer(8);
// Detail met foto’s
title("Detail en foto’s", 14);
for (const it of dossier.items) {
  const hasNote = (it.note || "").trim().length > 0;
  const hasPhotos = it.photos && it.photos.length;
  if (!hasNote && !hasPhotos && it.value !== "nee") continue; // toon alleen opvallende items
  addLine(it.label, 12, true);
  if (it.value) addLine(`Status: ${it.value}`);
  if (hasNote) addLine(`Opmerking: ${it.note}`);
  if (hasPhotos) {
    for (const p of it.photos) {
      await placeImage(p, 160); // max hoogte per foto
      spacer(6);
    }
  }
  spacer(6); hr(); spacer(6);
}
// Handtekeningblok
title("QHSE handtekening", 14);
addLine(`Naam: ${dossier.signature?.name || "-"}`);
if (dossier.signature?.dataUrl) {
  await placeImage(dossier.signature.dataUrl, 120, 300); // iets groter
} else {
  spacer(40);
  addLine("(geen handtekening vastgelegd)");
}
// Paginanummers
const pageCount = doc.getNumberOfPages();
for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);
  setFont(false, 9);
  doc.setTextColor(107,114,128);
  doc.text(`Pagina ${i} / ${pageCount}`, 595 - margin, 842 - 12, { align: "right" });
}
// Download
const filename = `${dossier.code}.pdf`;
doc.save(filename);
}

function guessSection(key) { if (!key) return ""; if (key.includes("werk") || key.includes("tra") || key.includes("vca") || key.includes("atex")) return "Toelatingen/Docs"; if (key.includes("clp") || key.includes("sds") || key.includes("verpakking")) return "Producten/ADR"; if (key.includes("pomp") || key.includes("elek") || key.includes("aarding") || key.includes("noodstop")) return "Materieel"; if (key.includes("pbm") || key.includes("oogdouche") || key.includes("absorptie")) return "PBM/Hygiëne"; if (key.includes("afzetting") || key.includes("struikel") || key.includes("hulpdiensten")) return "Werkplek"; if (key.includes("afvoeren") || key.includes("spill") || key.includes("opvang")) return "Milieu/Nood"; if (key.includes("inventaris") || key.includes("indeling") || key.includes("max_")) return "Seveso/Organisatie"; if (key.includes("lekbak") || key.includes("stelling") || key.includes("temp_vent")) return "Opslag"; if (key.includes("borden") || key.includes("blus") || key.includes("absorptie") || key.includes("nooddouche")) return "ADR/Nooduitrusting"; if (key.includes("sds_") || key.includes("fifo") || key.includes("traceer") || key.includes("afval_")) return "Processen/Docs"; if (key.includes("vlucht") || key.includes("gangpaden") || key.includes("5s")) return "Orde/Toegang"; if (key.includes("atex_") || key.includes("aarding_ibc")) return "Elektrisch/ATEX"; if (key.includes("brand")) return "Brandveiligheid"; if (key.includes("nooduitgang") || key.includes("noodverlichting") || key.includes("signalisatie")) return "Vluchtwegen"; if (key.includes("elek_borden") || key.includes("hvac") || key.includes("sprinkler") || key.includes("liften")) return "Techniek/Onderhoud"; return "Inspectie"; }

async function placeImage(src, maxH = 160, preferW = null) { const img = await loadImage(src); const scale = Math.min(1, (preferW || (595 - 80)) / img.width, maxH / img.height); const w = img.width * scale; const h = img.height * scale;



const jsPDF = window.jspdf.jsPDF;
const doc = jsPDF && jsPDF.getGlobal ? jsPDF.getGlobal().activeDocument : null;
// Fallback: gebruik de laatste gemaakte doc uit window.jspdf.umd context
const current = window.jspdf?.API?.events?.length ? window.jspdf.API.events[0]?.doc : null;
// We hebben vanuit exportPdf toegang tot doc via closure; daarom doen we dit anders:
// return de functie als factory in exportPdf. Simpeler: we implementeren dit als helper met directe toegang.
}

// Eenvoudiger: we houden een tijdelijke context binnen exportPdf in plaats van globale state // Daarom herschrijven we placeImage als binnenfunctie daarboven. Maar om buitenaanroep te houden: // We implementeren hier een generieke inline helper die een canvas omzet naar DataURL en direct tekent. // Beter: maak een utility die een Image in jsPDF plaatst met gegeven maxH.

// In plaats van de complexe referentie boven, leveren we een injectie via closure: // We exporteren alleen export(dossier), en implementeren helpers daarbinnen.

async function importJs(src) { return new Promise((resolve, reject) => { const s = document.createElement("script"); s.src = src; s.onload = resolve; s.onerror = reject; document.head.appendChild(s); }); }

// Publieke API return { export: exportPdf }; })();

Belangrijk: in de helper placeImage moeten we direct op de actieve jsPDF “doc” tekenen. Dat lossen we het eenvoudigst op door placeImage als binnenfunctie in exportPdf te definiëren. Als je wilt, kan ik meteen een compacte, werkende versie sturen waarin placeImage binnen exportPdf staat. Zeg “maak intern” en ik geef de vereenvoudigde pdf.js met de inline placeImage.

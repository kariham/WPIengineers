
const PDF = (() => { async function ensureJsPDF() { if (!window.jspdf) { await importJs("
cdnjs.cloudflare.com
"); } return window.jspdf.jsPDF; }

async function exportPdf(dossier) { const jsPDF = await ensureJsPDF(); const doc = new jsPDF({ unit: "pt", format: "a4" }); // 595×842 pt const margin = 40; const pageW = 595, pageH = 842; const width = pageW - margin * 2; let y = margin;



const setFont = (bold = false, size = 11) => {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(0, 0, 0);
};
const addLine = (text, size = 11, bold = false) => {
  setFont(bold, size);
  const lines = doc.splitTextToSize(text, width);
  const h = lines.length * size * 1.2;
  if (y + h > pageH - margin) newPage();
  doc.text(lines, margin, y);
  y += h;
};
const spacer = (h = 10) => { if (y + h > pageH - margin) newPage(); y += h; };
const hr = () => { if (y + 8 > pageH - margin) newPage(); doc.setDrawColor(229,231,235); doc.setLineWidth(1); doc.line(margin, y, margin + width, y); y += 8; };
const title = (t, s = 18) => { doc.setTextColor(11,108,255); addLine(t, s, true); doc.setTextColor(0,0,0); };
const newPage = () => { doc.addPage(); y = margin; };
// Inline: afbeelding plaatsen op max hoogte, auto-breken naar nieuwe pagina indien nodig
async function placeImage(src, maxH = 160, preferW = width) {
  const img = await loadImage(src);
  const scale = Math.min(1, preferW / img.width, maxH / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  if (y + h > pageH - margin) newPage();
  const dataUrl = await imageToDataUrl(img, "image/jpeg", 0.92);
  doc.addImage(dataUrl, "JPEG", margin, y, w, h, undefined, "FAST");
  y += h;
}
// Titel + basis
title(`${dossier.typeLabel} — Rapport`);
addLine(`Code: ${dossier.code}`);
addLine(`Datum/tijd: ${new Date(dossier.createdAt).toLocaleString()}`);
addLine(`Locatie: ${dossier.basis.locatie || "-"}`);
addLine(`Project: ${dossier.basis.project || "-"}`);
addLine(`Uitvoerder(s): ${dossier.basis.uitvoerders || "-"}`);
addLine(`Contact: ${dossier.basis.contact || "-"}`);
addLine(`Weersomstandigheden: ${dossier.basis.weersomstandigheden || "-"}`);
spacer(6); hr(); spacer(6);
// Overzicht bevindingen (compacte tabel: 4 kolommen)
title("Overzicht bevindingen", 14);
drawTable(
  doc, margin, width, () => y, (ny) => y = ny,
  ["Onderdeel", "Vraag", "Status", "Opmerking"],
  dossier.items.map(it => {
    const status = (it.value || "").toUpperCase();
    const note = (it.note || "").trim();
    const onderdeel = guessSection(it.key);
    return [onderdeel, it.label, status, note];
  }),
  [0.18, 0.42, 0.12, 0.28],
  pageH, margin
);
spacer(8); hr(); spacer(8);
// Detail met foto’s
title("Detail en foto’s", 14);
for (const it of dossier.items) {
  const hasNote = (it.note || "").trim().length > 0;
  const hasPhotos = it.photos && it.photos.length;
  if (!hasNote && !hasPhotos && it.value !== "nee") continue; // focus op afwijkingen/aandacht
  addLine(it.label, 12, true);
  if (it.value) addLine(`Status: ${it.value}`);
  if (hasNote) addLine(`Opmerking: ${it.note}`);
  if (hasPhotos) {
    for (const p of it.photos) { await placeImage(p, 160); spacer(6); }
  }
  spacer(6); hr(); spacer(6);
}
// Handtekening
title("QHSE handtekening", 14);
addLine(`Naam: ${dossier.signature?.name || "-"}`);
if (dossier.signature?.dataUrl) {
  await placeImage(dossier.signature.dataUrl, 120, 300);
} else {
  spacer(36);
  addLine("(geen handtekening vastgelegd)");
}
// Paginanummers
const pageCount = doc.getNumberOfPages();
for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);
  setFont(false, 9);
  doc.setTextColor(107,114,128);
  doc.text(`Pagina ${i} / ${pageCount}`, pageW - margin, pageH - 12, { align: "right" });
}
doc.save(`${dossier.code}.pdf`);
}

// Hulpen function guessSection(key = "") { if (key.startsWith("basis")) return "Basis"; if (key.includes("werk") || key.includes("tra") || key.includes("vca") || key.includes("atex")) return "Toelatingen/Docs"; if (key.includes("clp") || key.includes("sds") || key.includes("verpakking")) return "Producten/ADR"; if (key.includes("pomp") || key.includes("elek") || key.includes("aarding") || key.includes("noodstop")) return "Materieel"; if (key.includes("pbm") || key.includes("oogdouche") || key.includes("absorptie")) return "PBM/Hygiëne"; if (key.includes("afzetting") || key.includes("struikel") || key.includes("hulpdiensten")) return "Werkplek"; if (key.includes("afvoeren") || key.includes("spill") || key.includes("opvang")) return "Milieu/Nood"; if (key.includes("inventaris") || key.includes("indeling") || key.includes("max_")) return "Seveso/Organisatie"; if (key.includes("lekbak") || key.includes("stelling") || key.includes("temp_vent")) return "Opslag"; if (key.includes("borden") || key.includes("blus") || key.includes("absorptie") || key.includes("nooddouche")) return "ADR/Nooduitrusting"; if (key.includes("sds_") || key.includes("fifo") || key.includes("traceer") || key.includes("afval_")) return "Processen/Docs"; if (key.includes("vlucht") || key.includes("gangpaden") || key.includes("5s")) return "Orde/Toegang"; if (key.includes("atex_") || key.includes("aarding_ibc")) return "Elektrisch/ATEX"; if (key.includes("brand")) return "Brandveiligheid"; if (key.includes("nooduitgang") || key.includes("noodverlichting") || key.includes("signalisatie")) return "Vluchtwegen"; if (key.includes("elek_borden") || key.includes("hvac") || key.includes("sprinkler") || key.includes("liften")) return "Techniek/Onderhoud"; return "Inspectie"; }

function drawTable(doc, margin, width, getY, setY, headers, rows, colFractions, pageH, pageMargin) { const colX = []; let x = margin; const total = colFractions.reduce((a,b)=>a+b,0); const colW = colFractions.map(f => (f/total)*width); for (let i=0;i<colW.length;i++){ colX[i]= i===0? x : (colX[i-1]+colW[i-1]); }



const cellPad = 6;
const lineH = 12*1.2;
const drawRow = (vals, bold=false, band=false) => {
  const y = getY();
  // bereken rijhoogte
  let rh = 0;
  for (let i=0;i<vals.length;i++){
    const text = String(vals[i] ?? "");
    const lines = doc.splitTextToSize(text, colW[i]-cellPad*2);
    rh = Math.max(rh, lines.length*lineH);
  }
  if (y + rh + cellPad*2 > pageH - pageMargin) {
    doc.addPage(); setY(pageMargin);
  }
  // achtergrond band voor header
  if (band) {
    doc.setFillColor(245,247,250);
    doc.rect(margin, getY(), width, rh + cellPad*2, "F");
  }
  // cellen
  doc.setDrawColor(229,231,235);
  for (let i=0;i<vals.length;i++){
    const cx = colX[i], cw = colW[i];
    doc.rect(cx, getY(), cw, rh + cellPad*2);
    const text = String(vals[i] ?? "");
    const lines = doc.splitTextToSize(text, cw - cellPad*2);
    doc.setFont("helvetica", bold?"bold":"normal"); doc.setFontSize(11); doc.setTextColor(0,0,0);
    doc.text(lines, cx + cellPad, getY() + cellPad + 11);
  }
  setY(getY() + rh + cellPad*2);
};
drawRow(headers, true, true);
rows.forEach(r => drawRow(r, false, false));
}

async function loadImage(src) { return new Promise((resolve, reject) => { const img = new Image(); img.crossOrigin = "anonymous"; img.onload = () => resolve(img); img.onerror = reject; img.src = src; }); } async function imageToDataUrl(img, type="image/jpeg", quality=0.92) { const cv = document.createElement("canvas"); cv.width = img.naturalWidth; cv.height = img.naturalHeight; const cx = cv.getContext("2d"); cx.drawImage(img,0,0); return cv.toDataURL(type, quality); }

async function importJs(src) { return new Promise((resolve, reject) => { const s = document.createElement("script"); s.src = src; s.onload = resolve; s.onerror = reject; document.head.appendChild(s); }); }

return { export: exportPdf }; })();

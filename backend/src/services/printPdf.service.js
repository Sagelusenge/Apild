const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const logoPath = path.resolve(__dirname, '../../../frontend/public/images/logo-apild.png');
const colors = { green: '#075A48', ink: '#193047', muted: '#5A6B7B', line: '#CBD9D5' };
const left = 48;
const width = 499;
const clean = (value, fallback = 'Non renseigné') => String(value ?? '').replace(/<br\s*\/?\s*>/gi, '\n')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').trim() || fallback;
const date = (value) => value ? new Intl.DateTimeFormat('fr-CD', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)) : 'Non renseignée';
const money = (amount, currency) => amount == null ? 'Non renseigné' : `${new Intl.NumberFormat('fr-CD', { maximumFractionDigits: 2 }).format(Number(amount))} ${currency || 'CDF'}`;

function drawHeader(doc, title, reference) {
  doc.save();
  doc.font('Helvetica').fontSize(8).fillColor(colors.muted).text(date(new Date()), left, 27, { width: 220 });
  doc.text(clean(reference, ''), 344, 27, { width: 203, align: 'right' });
  if (fs.existsSync(logoPath)) doc.image(logoPath, left, 44, { fit: [94, 94], align: 'center', valign: 'center' });
  doc.font('Helvetica-Bold').fontSize(20).fillColor(colors.green).text('APILD', 151, 63, { width: 190 });
  doc.font('Helvetica').fontSize(8.4).fillColor(colors.muted).text('Action pour la Promotion des Initiatives\nLocales de Développement', 152, 90, { width: 210, lineGap: 2 });
  doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.ink).text(title.toUpperCase(), 345, 67, { width: 202, align: 'right' });
  doc.moveTo(left, 150).lineTo(left + width, 150).lineWidth(2).strokeColor(colors.green).stroke();
  doc.restore();
  doc.y = 171;
}

function createDocument(title, reference) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 170, bottom: 32, left, right: left }, bufferPages: true });
  const chunks = [];
  const result = new Promise((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
  doc.y = 171;
  return { doc, result };
}

function ensureSpace(doc, height) {
  if (doc.y + height > 762) doc.addPage();
}

function section(doc, title) {
  ensureSpace(doc, 46);
  doc.moveDown(0.65);
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(colors.green).text(title.toUpperCase(), left, doc.y, { width });
  doc.moveDown(0.42);
}

function paragraph(doc, value) {
  doc.font('Helvetica').fontSize(10).fillColor(colors.ink).text(clean(value), left, doc.y, { width, lineGap: 4 });
}

function details(doc, rows) {
  doc.font('Helvetica').fontSize(9);
  const rowHeights = rows.map(([, value]) => Math.max(24, doc.heightOfString(clean(value), { width: width - 166 }) + 8));
  const height = rowHeights.reduce((sum, rowHeight) => sum + rowHeight, 18);
  ensureSpace(doc, height + 10);
  const top = doc.y;
  doc.roundedRect(left, top, width, height, 7).lineWidth(0.8).strokeColor(colors.line).stroke();
  let offset = 0;
  rows.forEach(([label, value], index) => {
    const y = top + 10 + offset;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.green).text(label, left + 13, y, { width: 139 });
    doc.font('Helvetica').fontSize(9).fillColor(colors.ink).text(clean(value), left + 153, y, { width: width - 166 });
    offset += rowHeights[index];
  });
  doc.y = top + height + 8;
}

function finish(doc, title, reference) {
  const pages = doc.bufferedPageRange();
  for (let index = 0; index < pages.count; index += 1) {
    doc.switchToPage(pages.start + index);
    drawHeader(doc, title, reference);
    doc.save();
    doc.moveTo(left, 782).lineTo(left + width, 782).lineWidth(0.5).strokeColor(colors.line).stroke();
    doc.font('Helvetica').fontSize(8).fillColor(colors.muted).text('APILD  -  Document généré depuis les données de la plateforme', left, 792, { width: 390 });
    doc.text(`Page ${index + 1} / ${pages.count}`, 445, 792, { width: 102, align: 'right' });
    doc.restore();
  }
  doc.end();
}

function createReportPdf(report) {
  const { doc, result } = createDocument('État de rapport', report.reference);
  details(doc, [
    ['Intitulé', report.title],
    ['Type', ({ activity: 'Activité', financial: 'Financier', narrative: 'Narratif', evaluation: 'Évaluation' })[report.report_type] || 'Autre'],
    ['Période', `${date(report.period_start)}  -  ${date(report.period_end)}`],
    ['Statut', ({ draft: 'Brouillon', submitted: 'Soumis', approved: 'Approuvé', rejected: 'Refusé', archived: 'Archivé' })[report.status] || report.status]
  ]);
  if (report.summary) { section(doc, '1. Synthèse'); paragraph(doc, report.summary); }
  if (report.content) { section(doc, '2. État détaillé'); paragraph(doc, report.content); }
  if (!report.summary && !report.content) { section(doc, 'Contenu'); paragraph(doc, 'Aucun contenu n’a encore été renseigné pour ce rapport.'); }
  finish(doc, 'État de rapport', report.reference);
  return result;
}

function createContractPdf(contract) {
  const { doc, result } = createDocument('Fiche contractuelle', contract.reference);
  details(doc, [
    ['Acteur', `${contract.first_name} ${contract.last_name}`],
    ['Adresse e-mail', contract.email],
    ['Téléphone', contract.phone],
    ['Fonction', contract.position_title]
  ]);
  section(doc, '1. Affectation et durée');
  details(doc, [
    ['Nature', ({ permanent: 'Durée indéterminée', fixed_term: 'Durée déterminée', consultant: 'Consultance' })[contract.contract_type] || contract.contract_type],
    ['Début', date(contract.starts_on)],
    ['Fin prévue', contract.ends_on ? date(contract.ends_on) : 'Sans date de fin renseignée'],
    ['Lieu de travail', contract.work_location]
  ]);
  section(doc, '2. Informations financières');
  details(doc, [
    ['Salaire mensuel', money(contract.monthly_salary, contract.salary_currency)],
    ['Devise', contract.salary_currency],
    ['Statut du dossier', ({ draft: 'Brouillon', active: 'Actif', ended: 'Terminé' })[contract.status] || contract.status],
    ['Date de signature', contract.signed_on ? date(contract.signed_on) : 'Non renseignée']
  ]);
  if (contract.responsibilities) { section(doc, '3. Missions et responsabilités'); paragraph(doc, contract.responsibilities); }
  section(doc, 'Note administrative');
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(colors.muted).text(
    'Cette fiche récapitule les informations enregistrées dans APILD. Elle ne remplace pas le contrat signé ni un bulletin de paie.',
    left, doc.y, { width, lineGap: 3 }
  );
  finish(doc, 'Fiche contractuelle', contract.reference);
  return result;
}

module.exports = { createReportPdf, createContractPdf };

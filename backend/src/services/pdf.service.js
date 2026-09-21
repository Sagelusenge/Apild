const PDFDocument = require('pdfkit');

function createReportPdf(report) {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
    document.fontSize(20).text('APILD', { align: 'center' });
    document.moveDown().fontSize(16).text(report.title, { align: 'center' });
    document.moveDown().fontSize(10).text(`Reference: ${report.reference}`);
    document.text(`Type: ${report.report_type}`);
    if (report.period_start || report.period_end) document.text(`Periode: ${report.period_start || '-'} au ${report.period_end || '-'}`);
    document.moveDown().fontSize(12).text(report.summary || 'Aucun resume disponible.');
    if (report.content) document.moveDown().fontSize(10).text(String(report.content).replace(/<[^>]+>/g, ' '));
    document.end();
  });
}

module.exports = { createReportPdf };

import { jsPDF } from 'jspdf';
import { formatCurrency } from '@/lib/format';

export async function generateInsuranceReport(collectibles, user, profile) {
  const doc = new jsPDF();
  const active = collectibles.filter((c) => !c.is_deleted);
  const totalValue = active.reduce((s, c) => s + (c.estimated_value || 0), 0);
  const totalCost = active.reduce((s, c) => s + (c.purchase_cost || 0), 0);
  const verifiedCount = active.filter((c) => c.value_type === 'verified_sold').length;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Collection Insurance Report', 14, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
  doc.text(`Collector: ${user?.full_name || user?.email || 'Unknown'}`, 14, 36);
  if (profile?.display_name) doc.text(`Display Name: ${profile.display_name}`, 14, 42);

  doc.setDrawColor(200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 48, 182, 40, 3, 3, 'FD');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 18, 58);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Items: ${active.length}`, 18, 66);
  doc.text(`Total Estimated Value: ${formatCurrency(totalValue)}`, 18, 72);
  doc.text(`Total Purchase Cost: ${formatCurrency(totalCost)}`, 18, 78);
  doc.text(`Verified Values: ${verifiedCount} / ${active.length}`, 18, 84);

  const byCategory = {};
  active.forEach((c) => {
    const cat = c.category_name || 'Unknown';
    if (!byCategory[cat]) byCategory[cat] = { count: 0, value: 0 };
    byCategory[cat].count++;
    byCategory[cat].value += c.estimated_value || 0;
  });

  let y = 100;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Category Breakdown', 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  Object.entries(byCategory).sort((a, b) => b[1].value - a[1].value).forEach(([cat, data]) => {
    if (y > 280) { doc.addPage(); y = 20; }
    doc.text(cat.substring(0, 40), 14, y);
    doc.text(`${data.count} items`, 120, y);
    doc.text(formatCurrency(data.value), 160, y);
    y += 5;
  });

  y += 8;
  if (y > 270) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Collection Details', 14, y);
  y += 6;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Item Name', 14, y);
  doc.text('Category', 80, y);
  doc.text('Grade', 120, y);
  doc.text('Est. Value', 150, y);
  doc.text('Purchase', 175, y);
  y += 4;
  doc.setFont('helvetica', 'normal');

  active.forEach((c) => {
    if (y > 282) { doc.addPage(); y = 20; }
    doc.text((c.item_name || '').substring(0, 40), 14, y);
    doc.text((c.category_name || '').substring(0, 20), 80, y);
    doc.text(c.grade ? `${c.grading_company || ''} ${c.grade}`.trim().substring(0, 15) : 'Raw', 120, y);
    doc.text(formatCurrency(c.estimated_value || 0), 150, y);
    doc.text(formatCurrency(c.purchase_cost || 0), 175, y);
    y += 5;
  });

  if (y > 265) { doc.addPage(); y = 20; }
  y += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('This report is for insurance reference purposes only. Values are estimates', 14, y);
  doc.text('based on market data and may not reflect actual replacement costs.', 14, y + 5);
  doc.text('For official appraisals, consult a professional appraiser.', 14, y + 10);

  doc.save(`collection-insurance-${new Date().toISOString().split('T')[0]}.pdf`);
}
import { jsPDF } from 'jspdf';

export interface AssignmentPdfData {
  id?: string;
  title: string;
  instructions: string;
  dueDate: string;
  subjectCode?: string;
  subjectName?: string;
  department?: string;
  semester?: number | string;
  teacherName?: string;
  createdAt?: string;
  pdfData?: string;
  pdfFileName?: string;
}

export function downloadAssignmentPdf(assignment: AssignmentPdfData) {
  // If a custom PDF file was uploaded as a data URI and is valid, download it directly
  if (assignment.pdfData && assignment.pdfData.startsWith('data:application/pdf')) {
    try {
      const link = document.createElement('a');
      link.href = assignment.pdfData;
      link.download = assignment.pdfFileName || `${assignment.subjectCode || 'Assignment'}_${assignment.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    } catch (e) {
      console.warn('Fallback to standard PDF generator', e);
    }
  }

  // Generate an official Academic Assignment Sheet PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  // Header Banner Top
  doc.setFillColor(19, 40, 74); // Navy #13284A
  doc.rect(0, 0, pageWidth, 8, 'F');

  // Institution Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(19, 40, 74);
  doc.text('CAMPUS ACADEMIC SYSTEM', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 112, 133);
  doc.text('Official Coursework & Assignment Problem Worksheet', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Decorative Divider line
  doc.setDrawColor(220, 227, 237);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Metadata Card / Grid (Grey filled box)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, contentWidth, 38, 2, 2, 'F');
  doc.setDrawColor(220, 227, 237);
  doc.roundedRect(margin, yPos, contentWidth, 38, 2, 2, 'D');

  const metaLeft = margin + 6;
  const metaRight = margin + contentWidth / 2 + 4;
  let metaY = yPos + 7;

  doc.setFontSize(9);

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(19, 40, 74);
  doc.text('Course Code / Name:', metaLeft, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`${assignment.subjectCode || 'N/A'} - ${assignment.subjectName || 'Coursework'}`, metaLeft + 36, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(19, 40, 74);
  doc.text('Due Date:', metaRight, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(185, 28, 28); // Red emphasis for deadline
  const formattedDueDate = assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) : 'TBD';
  doc.text(formattedDueDate, metaRight + 20, metaY);

  metaY += 9;

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(19, 40, 74);
  doc.text('Course Faculty:', metaLeft, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(assignment.teacherName || 'Faculty In-Charge', metaLeft + 36, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(19, 40, 74);
  doc.text('Issued Date:', metaRight, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const issuedDate = assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  doc.text(issuedDate, metaRight + 20, metaY);

  metaY += 9;

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(19, 40, 74);
  doc.text('Semester / Dept:', metaLeft, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Semester ${assignment.semester || 'N/A'} • ${assignment.department || 'Computer Science & Engineering'}`, metaLeft + 36, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(19, 40, 74);
  doc.text('Document ID:', metaRight, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(assignment.id || `ASG-${Date.now()}`, metaRight + 24, metaY);

  yPos += 46;

  // Assignment Title Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(19, 40, 74);
  doc.text(assignment.title, margin, yPos);
  yPos += 7;

  // Instructions Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(46, 111, 176); // Blue #2E6FB0
  doc.text('PROBLEM STATEMENT & INSTRUCTIONS:', margin, yPos);
  yPos += 6;

  // Instructions Body Text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const instructionsText = assignment.instructions || 'No detailed instructions provided.';
  const splitLines = doc.splitTextToSize(instructionsText, contentWidth);

  for (let i = 0; i < splitLines.length; i++) {
    if (yPos > pageHeight - 35) {
      doc.addPage();
      // Add top mini banner on subsequent pages
      doc.setFillColor(19, 40, 74);
      doc.rect(0, 0, pageWidth, 5, 'F');
      yPos = 20;
    }
    doc.text(splitLines[i], margin, yPos);
    yPos += 5.5;
  }

  yPos += 8;

  // Guidelines & Submission Policy
  if (yPos > pageHeight - 55) {
    doc.addPage();
    doc.setFillColor(19, 40, 74);
    doc.rect(0, 0, pageWidth, 5, 'F');
    yPos = 20;
  }

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, yPos, contentWidth, 26, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, yPos, contentWidth, 26, 2, 2, 'D');

  let guideY = yPos + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(19, 40, 74);
  doc.text('Submission & Academic Guidelines:', margin + 5, guideY);
  guideY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Submissions must be submitted to course faculty on or before the due date.', margin + 5, guideY);
  guideY += 4.5;
  doc.text('2. All work must be original; institutional plagiarism policies apply.', margin + 5, guideY);
  guideY += 4.5;
  doc.text('3. Faculty will record verification status in the Academic Terminal ledger.', margin + 5, guideY);

  yPos += 34;

  // Footer / Page numbers
  const totalPages = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 1;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Campus Academic Portal • Page ${p} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  const safeTitle = (assignment.title || 'Assignment').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeCode = (assignment.subjectCode || 'Course').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeCode}_${safeTitle}.pdf`;

  doc.save(filename);
}

import jsPDF from 'jspdf';
import { ReportCardData } from '../types/report-card';

// Helper function to convert image URL to base64
const loadImageAsBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
};

export const generateReportCardPDF = async (data: ReportCardData): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text
  const addText = (text: string, x: number, y: number, fontSize: number = 10, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(fontSize);
    doc.text(text, x, y, { align });
  };

  // Helper function to draw line
  const drawLine = (y: number) => {
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
  };

  // School Logo - Real Image Rendering
  if (data.schoolBranding.logo) {
    try {
      const logoBase64 = await loadImageAsBase64(data.schoolBranding.logo);
      const logoWidth = 30;
      const logoHeight = 30;
      const logoX = pageWidth / 2 - logoWidth / 2;
      doc.addImage(logoBase64, 'PNG', logoX, yPosition, logoWidth, logoHeight);
      yPosition += 35;
    } catch (error) {
      console.error('Failed to load logo:', error);
      // Fallback to placeholder box
      doc.setDrawColor(200, 200, 200);
      doc.rect(pageWidth / 2 - 15, yPosition, 30, 30);
      yPosition += 35;
    }
  }

  // School Name
  doc.setFont('helvetica', 'bold');
  addText(data.schoolBranding.name, pageWidth / 2, yPosition, 18, 'center');
  yPosition += 8;

  // School Motto
  doc.setFont('helvetica', 'italic');
  addText(`"${data.schoolBranding.motto}"`, pageWidth / 2, yPosition, 11, 'center');
  yPosition += 6;

  // School Address and Contact
  doc.setFont('helvetica', 'normal');
  addText(data.schoolBranding.address, pageWidth / 2, yPosition, 9, 'center');
  yPosition += 5;
  addText(`Tel: ${data.schoolBranding.phone}`, pageWidth / 2, yPosition, 9, 'center');
  yPosition += 10;

  // Academic Year and Term
  doc.setFont('helvetica', 'bold');
  addText(`Academic Year: ${data.schoolBranding.academicYear}`, pageWidth / 2, yPosition, 11, 'center');
  yPosition += 6;
  addText(`Term: ${data.schoolBranding.term}`, pageWidth / 2, yPosition, 11, 'center');
  yPosition += 10;

  // Title
  doc.setFontSize(14);
  addText('STUDENT REPORT CARD', pageWidth / 2, yPosition, 14, 'center');
  yPosition += 10;

  drawLine(yPosition);
  yPosition += 8;

  // Student Information Section
  doc.setFont('helvetica', 'bold');
  addText('STUDENT INFORMATION', margin, yPosition, 11);
  yPosition += 7;

  doc.setFont('helvetica', 'normal');
  addText(`Student Name: ${data.studentInfo.name}`, margin, yPosition, 10);
  yPosition += 6;
  addText(`Student Code: ${data.studentInfo.studentCode}`, margin, yPosition, 10);
  yPosition += 6;
  addText(`Class: ${data.studentInfo.class}`, margin, yPosition, 10);
  yPosition += 10;

  drawLine(yPosition);
  yPosition += 8;

  // Academic Performance Section
  doc.setFont('helvetica', 'bold');
  addText('ACADEMIC PERFORMANCE', margin, yPosition, 11);
  yPosition += 7;

  // Table Header
  const tableStartY = yPosition;
  const col1X = margin;
  const col2X = margin + 70;
  const col3X = margin + 110;
  const col4X = margin + 145;

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');

  doc.setFont('helvetica', 'bold');
  addText('Subject', col1X + 2, yPosition, 10);
  addText('Score', col2X, yPosition, 10);
  addText('Percentage', col3X, yPosition, 10);
  addText('Performance', col4X, yPosition, 10);
  yPosition += 8;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  data.subjects.forEach((subject, index) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 7, 'F');
    }

    addText(subject.subject, col1X + 2, yPosition, 9);
    addText(`${subject.score}/${subject.maxScore}`, col2X, yPosition, 9);
    addText(`${subject.percentage.toFixed(1)}%`, col3X, yPosition, 9);

    // Performance Bar
    const barWidth = 35;
    const barHeight = 4;
    const barX = col4X;
    const barY = yPosition - 3;
    const fillWidth = (subject.percentage / 100) * barWidth;

    // Bar background
    doc.setFillColor(230, 230, 230);
    doc.rect(barX, barY, barWidth, barHeight, 'F');

    // Bar fill based on percentage
    let barColor: [number, number, number] = [76, 175, 80]; // Green
    if (subject.percentage < 50) {
      barColor = [244, 67, 54]; // Red
    } else if (subject.percentage < 70) {
      barColor = [255, 152, 0]; // Orange
    }

    doc.setFillColor(...barColor);
    doc.rect(barX, barY, fillWidth, barHeight, 'F');

    yPosition += 7;
  });

  yPosition += 5;
  drawLine(yPosition);
  yPosition += 7;

  // Summary Statistics
  doc.setFont('helvetica', 'bold');
  addText(`Total Score: ${data.totalScore}/${data.maxTotalScore}`, margin, yPosition, 10);
  yPosition += 6;
  addText(`Average Score: ${data.averageScore.toFixed(1)}%`, margin, yPosition, 10);
  yPosition += 6;
  addText(`Class Rank: ${data.classRank} / ${data.totalStudents}`, margin, yPosition, 10);
  yPosition += 10;

  drawLine(yPosition);
  yPosition += 8;

  // Attendance Summary Section
  if (data.attendance) {
    doc.setFont('helvetica', 'bold');
    addText('ATTENDANCE SUMMARY', margin, yPosition, 11);
    yPosition += 7;

    doc.setFont('helvetica', 'normal');
    
    // Attendance stats in two columns
    const leftColX = margin;
    const rightColX = pageWidth / 2 + 10;
    
    addText(`Present Days: ${data.attendance.present}`, leftColX, yPosition, 10);
    addText(`Total Days: ${data.attendance.total}`, rightColX, yPosition, 10);
    yPosition += 6;
    
    addText(`Absent Days: ${data.attendance.absent}`, leftColX, yPosition, 10);
    addText(`Late Days: ${data.attendance.late}`, rightColX, yPosition, 10);
    yPosition += 6;
    
    // Attendance percentage with visual indicator
    doc.setFont('helvetica', 'bold');
    addText(`Attendance Rate: ${data.attendance.percentage.toFixed(1)}%`, leftColX, yPosition, 10);
    
    // Attendance bar
    const attBarWidth = 60;
    const attBarHeight = 6;
    const attBarX = leftColX + 80;
    const attBarY = yPosition - 4;
    const attFillWidth = (data.attendance.percentage / 100) * attBarWidth;
    
    // Bar background
    doc.setFillColor(230, 230, 230);
    doc.rect(attBarX, attBarY, attBarWidth, attBarHeight, 'F');
    
    // Bar fill based on attendance percentage
    let attBarColor: [number, number, number] = [76, 175, 80]; // Green
    if (data.attendance.percentage < 75) {
      attBarColor = [244, 67, 54]; // Red
    } else if (data.attendance.percentage < 85) {
      attBarColor = [255, 152, 0]; // Orange
    }
    
    doc.setFillColor(...attBarColor);
    doc.rect(attBarX, attBarY, attFillWidth, attBarHeight, 'F');
    
    yPosition += 10;
    
    drawLine(yPosition);
    yPosition += 8;
  }

  // Teacher Comment
  doc.setFont('helvetica', 'bold');
  addText('TEACHER COMMENT', margin, yPosition, 11);
  yPosition += 7;

  doc.setFont('helvetica', 'normal');
  const teacherCommentLines = doc.splitTextToSize(data.teacherComment, pageWidth - 2 * margin);
  teacherCommentLines.forEach((line: string) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }
    addText(line, margin, yPosition, 9);
    yPosition += 5;
  });

  yPosition += 5;

  // Director Comment
  doc.setFont('helvetica', 'bold');
  addText('DIRECTOR COMMENT', margin, yPosition, 11);
  yPosition += 7;

  doc.setFont('helvetica', 'normal');
  const directorCommentLines = doc.splitTextToSize(data.directorComment, pageWidth - 2 * margin);
  directorCommentLines.forEach((line: string) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }
    addText(line, margin, yPosition, 9);
    yPosition += 5;
  });

  yPosition += 10;

  // Decision
  doc.setFont('helvetica', 'bold');
  let decisionText = '';
  let decisionColor: [number, number, number] = [0, 0, 0];

  switch (data.decision) {
    case 'promoted':
      decisionText = 'DECISION: PROMOTED';
      decisionColor = [76, 175, 80];
      break;
    case 'repeat':
      decisionText = 'DECISION: REPEAT';
      decisionColor = [244, 67, 54];
      break;
    case 'conditional':
      decisionText = 'DECISION: CONDITIONAL PROMOTION';
      decisionColor = [255, 152, 0];
      break;
  }

  doc.setTextColor(...decisionColor);
  addText(decisionText, pageWidth / 2, yPosition, 12, 'center');
  doc.setTextColor(0, 0, 0);
  yPosition += 15;

  // Signature Section
  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = margin;
  }

  drawLine(yPosition);
  yPosition += 10;

  const signatureY = yPosition + 20;
  const signatureLineY = signatureY + 5;

  // Teacher Signature
  doc.setFont('helvetica', 'normal');
  addText('Class Teacher', margin + 20, signatureY, 9);
  doc.line(margin, signatureLineY, margin + 60, signatureLineY);
  addText('Signature & Date', margin + 10, signatureLineY + 5, 8);

  // Director Signature
  addText('Director', pageWidth - margin - 60, signatureY, 9);
  doc.line(pageWidth - margin - 60, signatureLineY, pageWidth - margin, signatureLineY);
  addText('Signature & Date', pageWidth - margin - 50, signatureLineY + 5, 8);

  yPosition = signatureLineY + 15;

  // Official Stamp Area
  doc.setDrawColor(200, 200, 200);
  doc.setLineDash([2, 2]);
  doc.circle(pageWidth / 2, yPosition + 15, 20, 'S');
  doc.setLineDash([]);
  addText('Official School Stamp', pageWidth / 2, yPosition + 35, 8, 'center');

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  addText(`Generated on: ${data.generatedDate}`, pageWidth / 2, pageHeight - 10, 8, 'center');

  return doc;
};

export const downloadReportCard = async (data: ReportCardData, filename?: string) => {
  const doc = await generateReportCardPDF(data);
  const studentName = data.studentInfo.name.replace(/\s+/g, '_');
  const term = data.schoolBranding.term.replace(/\s+/g, '_');
  const defaultFilename = `ReportCard_${studentName}_${term}.pdf`;
  doc.save(filename || defaultFilename);
};

export const previewReportCard = async (data: ReportCardData) => {
  const doc = await generateReportCardPDF(data);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};
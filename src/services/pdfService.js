const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { getSignedUrl, useS3 } = require('../config/s3');

class PDFService {
  constructor() {
    this.dir = './payslips';
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
  }

  async generatePayslip(employee, payslipData) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        layout: 'portrait'
      });
      
      const filename = `payslip_${employee.employeeId}_${payslipData.month}_${payslipData.year}.pdf`;
      const filePath = path.join(this.dir, filename);
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);
      
      // Header with gradient effect
      doc.rect(0, 0, doc.page.width, 100).fill('#3b82f6');
      doc.fillColor('white')
        .fontSize(24)
        .text('SALARY SLIP', 50, 40, { align: 'center' })
        .fontSize(12)
        .text('Employee Management System', 50, 70, { align: 'center' });
      
      // Company Details
      doc.fillColor('#333')
        .fontSize(10)
        .text('123 Business Park, Mumbai - 400001', 50, 110)
        .text('GST: 27AAACA1234A1Z', 50, 125)
        .text('Email: payroll@company.com', 50, 140);
      
      // Employee Details Box
      doc.rect(50, 160, 500, 120).stroke('#ddd');
      doc.fillColor('#3b82f6')
        .fontSize(14)
        .text('Employee Details', 60, 170);
      
      doc.fillColor('#333')
        .fontSize(10);
      
      const details = [
        { label: 'Name', value: employee.name },
        { label: 'Employee ID', value: employee.employeeId },
        { label: 'Position', value: employee.position || 'N/A' },
        { label: 'Department', value: employee.department || 'N/A' },
        { label: 'Month', value: `${payslipData.month}/${payslipData.year}` },
        { label: 'Joining Date', value: new Date(employee.joinDate).toLocaleDateString() }
      ];
      
      let yPos = 195;
      details.forEach((detail, index) => {
        const xPos = index < 3 ? 60 : 310;
        const yAdjust = index < 3 ? yPos + (index * 20) : yPos + ((index - 3) * 20);
        
        doc.text(`${detail.label}:`, xPos, yAdjust)
          .text(detail.value, xPos + 80, yAdjust);
      });
      
      // Attendance Summary
      doc.rect(50, 295, 500, 100).stroke('#ddd');
      doc.fillColor('#3b82f6')
        .fontSize(14)
        .text('Attendance Summary', 60, 305);
      
      doc.fillColor('#333')
        .fontSize(10);
      
      const attendance = [
        { label: 'Total Days', value: payslipData.totalDays },
        { label: 'Present Days', value: payslipData.presentDays },
        { label: 'Absent Days', value: payslipData.absentDays || 0 },
        { label: 'Late Days', value: payslipData.lateDays || 0 },
        { label: 'Half Days', value: payslipData.halfDays || 0 },
        { label: 'Attendance %', value: `${Math.round((payslipData.presentDays / payslipData.totalDays) * 100)}%` }
      ];
      
      yPos = 330;
      attendance.forEach((item, index) => {
        const xPos = 60 + (index * 85);
        doc.text(`${item.label}:`, xPos, yPos)
          .text(String(item.value), xPos + 50, yPos);
      });
      
      // Salary Breakdown
      doc.rect(50, 410, 240, 180).stroke('#ddd');
      doc.fillColor('#3b82f6')
        .fontSize(14)
        .text('Earnings', 60, 420);
      
      doc.fillColor('#333')
        .fontSize(10);
      
      const earnings = [
        { label: 'Basic Salary', value: payslipData.basicSalary },
        { label: 'HRA', value: payslipData.allowances?.hra || 0 },
        { label: 'DA', value: payslipData.allowances?.da || 0 },
        { label: 'TA', value: payslipData.allowances?.ta || 0 },
        { label: 'Medical Allowance', value: payslipData.allowances?.medical || 0 },
        { label: 'Bonuses', value: payslipData.bonuses || 0 },
        { label: 'Arrears', value: payslipData.arrears || 0 }
      ];
      
      yPos = 445;
      let totalEarnings = 0;
      earnings.forEach((earning) => {
        const value = typeof earning.value === 'number' ? earning.value : 0;
        totalEarnings += value;
        doc.text(`${earning.label}:`, 60, yPos)
          .text(`₹${value.toLocaleString()}`, 180, yPos);
        yPos += 20;
      });
      
      doc.strokeColor('#000').lineWidth(1)
        .moveTo(60, yPos + 5).lineTo(290, yPos + 5).stroke();
      
      doc.font('Helvetica-Bold')
        .text('Total Earnings:', 60, yPos + 15)
        .text(`₹${totalEarnings.toLocaleString()}`, 180, yPos + 15);
      
      // Deductions
      doc.rect(310, 410, 240, 180).stroke('#ddd');
      doc.fillColor('#ef4444')
        .fontSize(14)
        .text('Deductions', 320, 420);
      
      doc.fillColor('#333')
        .fontSize(10);
      
      const deductions = [
        { label: 'PF (12%)', value: payslipData.deductions?.pf || 0 },
        { label: 'Professional Tax', value: payslipData.deductions?.professionalTax || 0 },
        { label: 'Income Tax', value: payslipData.deductions?.incomeTax || 0 },
        { label: 'Insurance', value: payslipData.deductions?.insurance || 0 },
        { label: 'Loan Recovery', value: payslipData.deductions?.loan || 0 },
        { label: 'Other Deductions', value: payslipData.deductions?.other || 0 }
      ];
      
      yPos = 445;
      let totalDeductions = 0;
      deductions.forEach((deduction) => {
        const value = typeof deduction.value === 'number' ? deduction.value : 0;
        totalDeductions += value;
        doc.text(`${deduction.label}:`, 320, yPos)
          .text(`₹${value.toLocaleString()}`, 440, yPos);
        yPos += 20;
      });
      
      doc.strokeColor('#000').lineWidth(1)
        .moveTo(320, yPos + 5).lineTo(550, yPos + 5).stroke();
      
      doc.font('Helvetica-Bold')
        .text('Total Deductions:', 320, yPos + 15)
        .text(`₹${totalDeductions.toLocaleString()}`, 440, yPos + 15);
      
      // Net Salary
      const netSalary = totalEarnings - totalDeductions;
      doc.rect(50, 600, 500, 70).fill('#10b981');
      doc.fillColor('white')
        .fontSize(16)
        .text('NET SALARY', 230, 620)
        .fontSize(24)
        .text(`₹ ${netSalary.toLocaleString()}`, 210, 640);
      
      // Footer
      doc.fillColor('#666')
        .fontSize(8)
        .text('This is a computer generated document, no signature required.', 50, 700, { align: 'center' })
        .text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 715, { align: 'center' });
      
      doc.end();
      
      stream.on('finish', () => {
        resolve(filename);
      });
      
      stream.on('error', reject);
    });
  }

  async getPayslipUrl(filename) {
    if (useS3) {
      const key = `payslips/${filename}`;
      return await getSignedUrl(key, 86400); // 24 hours expiry
    } else {
      return `${process.env.BASE_URL || 'http://localhost:5000'}/payslips/${filename}`;
    }
  }
}

module.exports = new PDFService();
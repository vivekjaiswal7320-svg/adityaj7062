/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SheetData, CellData, ChartModel } from '../types/spreadsheet';
import { numberToWordsINR } from './formulaEngine';

/**
 * Creates an authentic, professional Indian Salary Slip (Payslip)
 * with working formulas for Gross, Deductions, and Net Pay.
 */
export function createSalarySlipTemplate(sheetId: string = 'sheet_salary_slip'): SheetData {
  const cells: Record<string, CellData> = {};

  // Row heights and col widths optimized for A4 print
  const colWidths: Record<number, number> = {
    0: 45,  // A: Margin/spacer
    1: 220, // B: Earnings Particulars
    2: 130, // C: Earnings Amount
    3: 35,  // D: Gap/Divider
    4: 220, // E: Deductions Particulars
    5: 130, // F: Deductions Amount
    6: 45,  // G: Spacer
  };

  const rowHeights: Record<number, number> = {
    0: 36, // Header 1
    1: 24, // Header 2
    2: 28, // Header 3
    3: 16, // Empty
    4: 26, // Emp Info Row 1
    5: 26, // Emp Info Row 2
    6: 26, // Emp Info Row 3
    7: 26, // Emp Info Row 4
    8: 16, // Empty
    9: 30, // Table Header
    10: 24, // Item 1
    11: 24, // Item 2
    12: 24, // Item 3
    13: 24, // Item 4
    14: 24, // Item 5
    15: 24, // Item 6
    16: 30, // Totals
    17: 16, // Empty
    18: 34, // Net Salary Highlight
    19: 28, // Amount in Words
    20: 20, // Empty
    21: 45, // Signatures
  };

  // 1. Company Header (Row 1-3)
  // Row 0 (A1:F1): Company Name
  cells['B1'] = {
    value: 'SHREE RAM ENTERPRISES PVT. LTD.',
    colSpan: 5,
    style: {
      bold: true,
      fontSize: 16,
      align: 'center',
      color: '#0f172a',
      backgroundColor: '#f8fafc',
    },
  };
  // mark merged child cells
  ['C1', 'D1', 'E1', 'F1'].forEach((k) => (cells[k] = { value: '', mergedInto: 'B1' }));

  // Row 1 (B2:F2): Address & Contact
  cells['B2'] = {
    value: 'Plot No. 42, Industrial Area, Sector 63, Noida, UP - 201301 | GSTIN: 07AAAAA0000A1Z5',
    colSpan: 5,
    style: {
      fontSize: 10,
      align: 'center',
      color: '#475569',
      backgroundColor: '#f8fafc',
    },
  };
  ['C2', 'D2', 'E2', 'F2'].forEach((k) => (cells[k] = { value: '', mergedInto: 'B2' }));

  // Row 2 (B3:F3): Slip Title
  cells['B3'] = {
    value: 'SALARY SLIP / वेतन पर्ची - OCTOBER 2026',
    colSpan: 5,
    style: {
      bold: true,
      fontSize: 12,
      align: 'center',
      color: '#1e3a8a',
      backgroundColor: '#e0e7ff',
      borders: {
        bottom: { style: 'medium', color: '#3b82f6' },
      },
    },
  };
  ['C3', 'D3', 'E3', 'F3'].forEach((k) => (cells[k] = { value: '', mergedInto: 'B3' }));

  // 2. Employee Details Block (Row 5 - 8)
  const setEmpRow = (
    row: number,
    label1: string,
    val1: string,
    label2: string,
    val2: string
  ) => {
    const r = row + 1;
    cells[`B${r}`] = {
      value: label1,
      style: { bold: true, fontSize: 10, color: '#334155', backgroundColor: '#f1f5f9' },
    };
    cells[`C${r}`] = {
      value: val1,
      style: { fontSize: 10, color: '#0f172a' },
    };
    cells[`D${r}`] = { value: '' };
    cells[`E${r}`] = {
      value: label2,
      style: { bold: true, fontSize: 10, color: '#334155', backgroundColor: '#f1f5f9' },
    };
    cells[`F${r}`] = {
      value: val2,
      style: { fontSize: 10, color: '#0f172a' },
    };
  };

  setEmpRow(4, 'Employee Name / कर्मचारी:', 'Vivek Kumar Jaiswal', 'Employee ID / कोड:', 'EMP-1042');
  setEmpRow(5, 'Designation / पद:', 'Senior Operations Manager', 'Department / विभाग:', 'Finance & Accounts');
  setEmpRow(6, 'Bank A/c No:', 'HDFC Bank - 501004829104', 'PF / UAN No:', '101492049182');
  setEmpRow(7, 'Days Worked / कार्य दिवस:', '31 Days', 'LOP / अनुपस्थित दिन:', '0 Days');

  // 3. Earnings & Deductions Table Header (Row 10)
  cells['B10'] = {
    value: 'EARNINGS / आय विवरण',
    style: {
      bold: true,
      fontSize: 11,
      align: 'left',
      color: '#ffffff',
      backgroundColor: '#059669',
      borders: { top: { style: 'medium' }, bottom: { style: 'medium' } },
    },
  };
  cells['C10'] = {
    value: 'AMOUNT (₹)',
    style: {
      bold: true,
      fontSize: 11,
      align: 'right',
      color: '#ffffff',
      backgroundColor: '#059669',
      borders: { top: { style: 'medium' }, bottom: { style: 'medium' } },
    },
  };
  cells['D10'] = { value: '' };
  cells['E10'] = {
    value: 'DEDUCTIONS / कटौती विवरण',
    style: {
      bold: true,
      fontSize: 11,
      align: 'left',
      color: '#ffffff',
      backgroundColor: '#dc2626',
      borders: { top: { style: 'medium' }, bottom: { style: 'medium' } },
    },
  };
  cells['F10'] = {
    value: 'AMOUNT (₹)',
    style: {
      bold: true,
      fontSize: 11,
      align: 'right',
      color: '#ffffff',
      backgroundColor: '#dc2626',
      borders: { top: { style: 'medium' }, bottom: { style: 'medium' } },
    },
  };

  // 4. Earnings and Deductions Rows (Row 11 to 16)
  const lineItems = [
    {
      earnLabel: 'Basic Salary / मूल वेतन',
      earnVal: '42000',
      dedLabel: 'Provident Fund (EPF / पीएफ)',
      dedVal: '1800',
    },
    {
      earnLabel: 'House Rent Allowance (HRA / मकान भत्ता)',
      earnVal: '18000',
      dedLabel: 'Professional Tax (PT)',
      dedVal: '200',
    },
    {
      earnLabel: 'Conveyance Allowance / वाहन भत्ता',
      earnVal: '3500',
      dedLabel: 'TDS / Income Tax (आयकर)',
      dedVal: '3500',
    },
    {
      earnLabel: 'Medical Allowance / चिकित्सा भत्ता',
      earnVal: '2500',
      dedLabel: 'Health Insurance (ESIC)',
      dedVal: '750',
    },
    {
      earnLabel: 'Special Allowance / विशेष भत्ता',
      earnVal: '9000',
      dedLabel: 'Loan / Advance Recovery',
      dedVal: '0',
    },
    {
      earnLabel: 'Performance Bonus / प्रोत्साहन राशि',
      earnVal: '5000',
      dedLabel: 'Other Deductions',
      dedVal: '0',
    },
  ];

  lineItems.forEach((item, idx) => {
    const r = 11 + idx;
    cells[`B${r}`] = {
      value: item.earnLabel,
      style: {
        fontSize: 10,
        borders: {
          bottom: { style: 'thin', color: '#e2e8f0' },
          left: { style: 'thin', color: '#cbd5e1' },
        },
      },
    };
    cells[`C${r}`] = {
      value: item.earnVal,
      style: {
        fontSize: 10,
        align: 'right',
        format: 'currency_inr',
        decimals: 2,
        borders: {
          bottom: { style: 'thin', color: '#e2e8f0' },
          right: { style: 'thin', color: '#cbd5e1' },
        },
      },
    };
    cells[`D${r}`] = { value: '' };
    cells[`E${r}`] = {
      value: item.dedLabel,
      style: {
        fontSize: 10,
        borders: {
          bottom: { style: 'thin', color: '#e2e8f0' },
          left: { style: 'thin', color: '#cbd5e1' },
        },
      },
    };
    cells[`F${r}`] = {
      value: item.dedVal,
      style: {
        fontSize: 10,
        align: 'right',
        format: 'currency_inr',
        decimals: 2,
        borders: {
          bottom: { style: 'thin', color: '#e2e8f0' },
          right: { style: 'thin', color: '#cbd5e1' },
        },
      },
    };
  });

  // 5. Total Row (Row 17)
  cells['B17'] = {
    value: 'GROSS EARNINGS / कुल आय:',
    style: {
      bold: true,
      fontSize: 11,
      backgroundColor: '#ecfdf5',
      color: '#065f46',
      borders: {
        top: { style: 'medium', color: '#059669' },
        bottom: { style: 'medium', color: '#059669' },
      },
    },
  };
  cells['C17'] = {
    value: '80000',
    formula: '=SUM(C11:C16)',
    style: {
      bold: true,
      fontSize: 11,
      align: 'right',
      format: 'currency_inr',
      backgroundColor: '#ecfdf5',
      color: '#065f46',
      borders: {
        top: { style: 'medium', color: '#059669' },
        bottom: { style: 'medium', color: '#059669' },
      },
    },
  };

  cells['D17'] = { value: '' };

  cells['E17'] = {
    value: 'TOTAL DEDUCTIONS / कुल कटौती:',
    style: {
      bold: true,
      fontSize: 11,
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      borders: {
        top: { style: 'medium', color: '#dc2626' },
        bottom: { style: 'medium', color: '#dc2626' },
      },
    },
  };
  cells['F17'] = {
    value: '6250',
    formula: '=SUM(F11:F16)',
    style: {
      bold: true,
      fontSize: 11,
      align: 'right',
      format: 'currency_inr',
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      borders: {
        top: { style: 'medium', color: '#dc2626' },
        bottom: { style: 'medium', color: '#dc2626' },
      },
    },
  };

  // 6. Net Salary Row (Row 19)
  cells['B19'] = {
    value: 'NET TAKE-HOME SALARY / शुद्ध वेतन भुगतान:',
    colSpan: 3,
    style: {
      bold: true,
      fontSize: 13,
      align: 'right',
      color: '#1e3a8a',
      backgroundColor: '#dbeafe',
      borders: {
        top: { style: 'medium', color: '#2563eb' },
        bottom: { style: 'double', color: '#2563eb' },
        left: { style: 'medium', color: '#2563eb' },
      },
    },
  };
  ['C19', 'D19'].forEach((k) => (cells[k] = { value: '', mergedInto: 'B19' }));

  cells['E19'] = {
    value: '73750',
    formula: '=C17-F17',
    colSpan: 2,
    style: {
      bold: true,
      fontSize: 15,
      align: 'center',
      color: '#1e40af',
      backgroundColor: '#dbeafe',
      format: 'currency_inr',
      borders: {
        top: { style: 'medium', color: '#2563eb' },
        bottom: { style: 'double', color: '#2563eb' },
        right: { style: 'medium', color: '#2563eb' },
      },
    },
  };
  cells['F19'] = { value: '', mergedInto: 'E19' };

  // 7. Amount in Words (Row 20)
  cells['B20'] = {
    value: `Amount in Words: ${numberToWordsINR(73750)}`,
    colSpan: 5,
    style: {
      bold: true,
      italic: true,
      fontSize: 10,
      align: 'center',
      color: '#1e293b',
      backgroundColor: '#f8fafc',
      borders: {
        bottom: { style: 'thin', color: '#cbd5e1' },
      },
    },
  };
  ['C20', 'D20', 'E20', 'F20'].forEach((k) => (cells[k] = { value: '', mergedInto: 'B20' }));

  // 8. Signature Area (Row 22)
  cells['B22'] = {
    value: "Employer's Signature / अधिकृत हस्ताक्षर",
    colSpan: 2,
    style: {
      bold: true,
      fontSize: 10,
      align: 'center',
      vAlign: 'bottom',
      color: '#475569',
      borders: { top: { style: 'dashed', color: '#94a3b8' } },
    },
  };
  cells['C22'] = { value: '', mergedInto: 'B22' };

  cells['E22'] = {
    value: "Employee's Signature / कर्मचारी हस्ताक्षर",
    colSpan: 2,
    style: {
      bold: true,
      fontSize: 10,
      align: 'center',
      vAlign: 'bottom',
      color: '#475569',
      borders: { top: { style: 'dashed', color: '#94a3b8' } },
    },
  };
  cells['F22'] = { value: '', mergedInto: 'E22' };

  // Attached Salary Breakdown Donut Chart
  const charts: ChartModel[] = [
    {
      id: 'chart_salary_earnings',
      title: 'Earnings Breakdown / आय विभाजन',
      type: 'donut',
      range: 'B11:C16',
      labelCol: 1, // Col B
      valueCols: [2], // Col C
      palette: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#047857'],
      showLegend: true,
      showValues: true,
      showGrid: false,
    },
  ];

  return {
    id: sheetId,
    name: 'Salary Slip (वेतन पर्ची)',
    cells,
    rowCount: 35,
    colCount: 12,
    rowHeights,
    colWidths,
    charts,
    showGridLines: true,
  };
}

/**
 * Creates Monthly Employee Payroll Register Sheet
 */
export function createPayrollRegisterTemplate(sheetId: string = 'sheet_payroll_register'): SheetData {
  const cells: Record<string, CellData> = {};

  const colWidths: Record<number, number> = {
    0: 70,  // A: Emp ID
    1: 170, // B: Name
    2: 130, // C: Department
    3: 110, // D: Basic
    4: 100, // E: HRA
    5: 100, // F: Allowances
    6: 120, // G: Gross Pay
    7: 90,  // H: PF
    8: 90,  // I: Tax
    9: 120, // J: Net Pay
  };

  // Header Title
  cells['A1'] = {
    value: 'EMPLOYEE MONTHLY PAYROLL REGISTER / मासिक पेरोल शीट',
    colSpan: 10,
    style: {
      bold: true,
      fontSize: 14,
      align: 'center',
      color: '#ffffff',
      backgroundColor: '#0f766e',
    },
  };
  for (let c = 1; c < 10; c++) {
    cells[`${String.fromCharCode(65 + c)}1`] = { value: '', mergedInto: 'A1' };
  }

  // Column Headers
  const headers = [
    'Emp ID',
    'Employee Name',
    'Department',
    'Basic Pay',
    'HRA',
    'Allowance',
    'Gross Pay',
    'EPF (PF)',
    'TDS / Tax',
    'Net Salary',
  ];

  headers.forEach((h, idx) => {
    const key = `${String.fromCharCode(65 + idx)}2`;
    cells[key] = {
      value: h,
      style: {
        bold: true,
        fontSize: 10,
        align: idx >= 3 ? 'right' : 'left',
        backgroundColor: '#115e59',
        color: '#ffffff',
        borders: { bottom: { style: 'medium' } },
      },
    };
  });

  const employees = [
    { id: 'ST-101', name: 'Vivek Jaiswal', dept: 'Engineering', basic: 50000, hra: 20000, allow: 8000, pf: 1800, tax: 4000 },
    { id: 'ST-102', name: 'Pooja Verma', dept: 'Design', basic: 42000, hra: 16800, allow: 6000, pf: 1800, tax: 3000 },
    { id: 'ST-103', name: 'Amit Sharma', dept: 'Marketing', basic: 38000, hra: 15200, allow: 5000, pf: 1800, tax: 2500 },
    { id: 'ST-104', name: 'Neha Gupta', dept: 'Operations', basic: 46000, hra: 18400, allow: 7500, pf: 1800, tax: 3800 },
    { id: 'ST-105', name: 'Rohan Mehta', dept: 'Engineering', basic: 55000, hra: 22000, allow: 9000, pf: 1800, tax: 5200 },
    { id: 'ST-106', name: 'Sneha Patel', dept: 'Finance', basic: 48000, hra: 19200, allow: 8000, pf: 1800, tax: 4200 },
    { id: 'ST-107', name: 'Arun Nair', dept: 'Sales', basic: 35000, hra: 14000, allow: 12000, pf: 1800, tax: 2800 },
    { id: 'ST-108', name: 'Deepika Rao', dept: 'HR', basic: 40000, hra: 16000, allow: 6000, pf: 1800, tax: 3000 },
  ];

  employees.forEach((emp, i) => {
    const row = 3 + i;
    cells[`A${row}`] = { value: emp.id, style: { fontSize: 10, align: 'center' } };
    cells[`B${row}`] = { value: emp.name, style: { fontSize: 10, bold: true } };
    cells[`C${row}`] = { value: emp.dept, style: { fontSize: 10 } };
    cells[`D${row}`] = { value: String(emp.basic), style: { fontSize: 10, align: 'right', format: 'currency_inr' } };
    cells[`E${row}`] = { value: String(emp.hra), style: { fontSize: 10, align: 'right', format: 'currency_inr' } };
    cells[`F${row}`] = { value: String(emp.allow), style: { fontSize: 10, align: 'right', format: 'currency_inr' } };
    cells[`G${row}`] = {
      value: String(emp.basic + emp.hra + emp.allow),
      formula: `=SUM(D${row}:F${row})`,
      style: { fontSize: 10, align: 'right', bold: true, format: 'currency_inr', backgroundColor: '#f0fdf4' },
    };
    cells[`H${row}`] = { value: String(emp.pf), style: { fontSize: 10, align: 'right', format: 'currency_inr' } };
    cells[`I${row}`] = { value: String(emp.tax), style: { fontSize: 10, align: 'right', format: 'currency_inr' } };
    cells[`J${row}`] = {
      value: String(emp.basic + emp.hra + emp.allow - emp.pf - emp.tax),
      formula: `=G${row}-H${row}-I${row}`,
      style: { fontSize: 10, align: 'right', bold: true, format: 'currency_inr', backgroundColor: '#e0f2fe', color: '#0369a1' },
    };
  });

  // Summary Row (Row 11)
  cells['A11'] = {
    value: 'TOTAL PAYROLL / कुल योग:',
    colSpan: 3,
    style: { bold: true, fontSize: 11, align: 'right', backgroundColor: '#ccfbf1', color: '#115e59' },
  };
  cells['B11'] = { value: '', mergedInto: 'A11' };
  cells['C11'] = { value: '', mergedInto: 'A11' };

  cells['D11'] = {
    value: '354000',
    formula: '=SUM(D3:D10)',
    style: { bold: true, fontSize: 11, align: 'right', format: 'currency_inr', backgroundColor: '#ccfbf1' },
  };
  cells['E11'] = {
    value: '141600',
    formula: '=SUM(E3:E10)',
    style: { bold: true, fontSize: 11, align: 'right', format: 'currency_inr', backgroundColor: '#ccfbf1' },
  };
  cells['F11'] = {
    value: '61500',
    formula: '=SUM(F3:F10)',
    style: { bold: true, fontSize: 11, align: 'right', format: 'currency_inr', backgroundColor: '#ccfbf1' },
  };
  cells['G11'] = {
    value: '557100',
    formula: '=SUM(G3:G10)',
    style: { bold: true, fontSize: 11, align: 'right', format: 'currency_inr', backgroundColor: '#ccfbf1', color: '#047857' },
  };
  cells['H11'] = {
    value: '14400',
    formula: '=SUM(H3:H10)',
    style: { bold: true, fontSize: 11, align: 'right', format: 'currency_inr', backgroundColor: '#ccfbf1' },
  };
  cells['I11'] = {
    value: '28700',
    formula: '=SUM(I3:I10)',
    style: { bold: true, fontSize: 11, align: 'right', format: 'currency_inr', backgroundColor: '#ccfbf1' },
  };
  cells['J11'] = {
    value: '514000',
    formula: '=SUM(J3:J10)',
    style: {
      bold: true,
      fontSize: 12,
      align: 'right',
      format: 'currency_inr',
      backgroundColor: '#ccfbf1',
      color: '#0e7490',
      borders: { bottom: { style: 'double' } },
    },
  };

  const charts: ChartModel[] = [
    {
      id: 'chart_net_salary_compare',
      title: 'Employee Net Salary Comparison (₹)',
      type: 'column',
      range: 'B3:J10',
      labelCol: 1, // Name
      valueCols: [9], // Net Salary (Col J)
      palette: ['#0d9488', '#0284c7', '#6366f1', '#8b5cf6'],
      showLegend: false,
      showValues: true,
      showGrid: true,
    },
  ];

  return {
    id: sheetId,
    name: 'Payroll Register (पेरोल शीट)',
    cells,
    rowCount: 35,
    colCount: 15,
    rowHeights: {},
    colWidths,
    charts,
    showGridLines: true,
  };
}

/**
 * Creates Sales & Revenue Expense Sheet with chart
 */
export function createSalesExpenseChartTemplate(sheetId: string = 'sheet_sales_tracker'): SheetData {
  const cells: Record<string, CellData> = {};

  const colWidths: Record<number, number> = {
    0: 120, // A: Month
    1: 130, // B: Revenue
    2: 130, // C: Expenses
    3: 130, // D: Net Profit
    4: 100, // E: Margin %
  };

  cells['A1'] = {
    value: 'MONTHLY BUSINESS REVENUE & EXPENSES / व्यापार आय-व्यय',
    colSpan: 5,
    style: {
      bold: true,
      fontSize: 13,
      align: 'center',
      color: '#ffffff',
      backgroundColor: '#1e3a8a',
    },
  };
  ['B1', 'C1', 'D1', 'E1'].forEach((k) => (cells[k] = { value: '', mergedInto: 'A1' }));

  cells['A2'] = { value: 'Month / महीना', style: { bold: true, backgroundColor: '#1e40af', color: '#ffffff' } };
  cells['B2'] = { value: 'Revenue / आय (₹)', style: { bold: true, align: 'right', backgroundColor: '#1e40af', color: '#ffffff' } };
  cells['C2'] = { value: 'Expenses / व्यय (₹)', style: { bold: true, align: 'right', backgroundColor: '#1e40af', color: '#ffffff' } };
  cells['D2'] = { value: 'Net Profit / लाभ (₹)', style: { bold: true, align: 'right', backgroundColor: '#1e40af', color: '#ffffff' } };
  cells['E2'] = { value: 'Margin (%)', style: { bold: true, align: 'right', backgroundColor: '#1e40af', color: '#ffffff' } };

  const data = [
    { m: 'January', rev: 180000, exp: 120000 },
    { m: 'February', rev: 210000, exp: 135000 },
    { m: 'March', rev: 250000, exp: 145000 },
    { m: 'April', rev: 230000, exp: 140000 },
    { m: 'May', rev: 290000, exp: 160000 },
    { m: 'June', rev: 340000, exp: 175000 },
  ];

  data.forEach((row, i) => {
    const r = 3 + i;
    cells[`A${r}`] = { value: row.m, style: { fontSize: 10 } };
    cells[`B${r}`] = { value: String(row.rev), style: { align: 'right', format: 'currency_inr' } };
    cells[`C${r}`] = { value: String(row.exp), style: { align: 'right', format: 'currency_inr' } };
    cells[`D${r}`] = {
      value: String(row.rev - row.exp),
      formula: `=B${r}-C${r}`,
      style: { align: 'right', bold: true, format: 'currency_inr', color: '#047857' },
    };
    cells[`E${r}`] = {
      value: String(((row.rev - row.exp) / row.rev).toFixed(3)),
      formula: `=D${r}/B${r}`,
      style: { align: 'right', format: 'percent', decimals: 1 },
    };
  });

  // Summary Row
  cells['A9'] = { value: 'TOTAL / कुल योग', style: { bold: true, backgroundColor: '#eff6ff' } };
  cells['B9'] = { value: '1500000', formula: '=SUM(B3:B8)', style: { bold: true, align: 'right', format: 'currency_inr', backgroundColor: '#eff6ff' } };
  cells['C9'] = { value: '875000', formula: '=SUM(C3:C8)', style: { bold: true, align: 'right', format: 'currency_inr', backgroundColor: '#eff6ff' } };
  cells['D9'] = { value: '625000', formula: '=SUM(D3:D8)', style: { bold: true, align: 'right', format: 'currency_inr', backgroundColor: '#eff6ff', color: '#047857', borders: { bottom: { style: 'double' } } } };
  cells['E9'] = { value: '0.417', formula: '=D9/B9', style: { bold: true, align: 'right', format: 'percent', decimals: 1, backgroundColor: '#eff6ff' } };

  const charts: ChartModel[] = [
    {
      id: 'chart_sales_trend',
      title: 'Revenue vs Expenses Trend (₹)',
      type: 'bar',
      range: 'A3:C8',
      labelCol: 0,
      valueCols: [1, 2],
      palette: ['#2563eb', '#ef4444'],
      showLegend: true,
      showValues: true,
      showGrid: true,
    },
  ];

  return {
    id: sheetId,
    name: 'Sales & Expenses (बिक्री व व्यय)',
    cells,
    rowCount: 35,
    colCount: 12,
    rowHeights: {},
    colWidths,
    charts,
    showGridLines: true,
  };
}

/**
 * Creates a clean blank worksheet
 */
export function createBlankSheet(id: string = 'sheet_blank', name: string = 'Sheet 1'): SheetData {
  return {
    id,
    name,
    cells: {},
    rowCount: 60,
    colCount: 26,
    rowHeights: {},
    colWidths: {},
    charts: [],
    showGridLines: true,
  };
}

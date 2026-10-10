/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SalarySlipFormData, SheetData, CellData } from '../types/spreadsheet';
import { numberToWordsINR } from '../utils/formulaEngine';
import { X, Check, Printer, FileSpreadsheet, Building2, User, CreditCard } from 'lucide-react';

interface SalarySlipGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToSheet: (newSheet: SheetData) => void;
  onDirectPrint?: (data: SalarySlipFormData) => void;
}

const DEFAULT_FORM: SalarySlipFormData = {
  companyName: 'SHREE RAM ENTERPRISES PVT. LTD.',
  companyAddress: 'Plot No. 42, Industrial Area, Sector 63, Noida, UP - 201301',
  companySubtext: 'GSTIN: 07AAAAA0000A1Z5 | CIN: U72200DL2021PTC123456',
  monthYear: 'OCTOBER 2026',
  employeeName: 'Vivek Kumar Jaiswal',
  employeeId: 'EMP-1042',
  designation: 'Senior Operations Manager',
  department: 'Finance & Accounts',
  dateOfJoining: '15-Mar-2022',
  bankAccount: 'HDFC Bank - 501004829104',
  panNo: 'ABCDE1234F',
  pfUan: '101492049182',
  workedDays: 31,
  lopDays: 0,
  // Earnings
  basicSalary: 42000,
  hra: 18000,
  conveyance: 3500,
  medicalAllowance: 2500,
  specialAllowance: 9000,
  overtimeOrBonus: 5000,
  // Deductions
  providentFund: 1800,
  professionalTax: 200,
  tdsIncomeTax: 3500,
  healthInsurance: 750,
  loanAdvance: 0,
};

export const SalarySlipGeneratorModal: React.FC<SalarySlipGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyToSheet,
  onDirectPrint,
}) => {
  if (!isOpen) return null;

  const [form, setForm] = useState<SalarySlipFormData>(DEFAULT_FORM);
  const [activeTab, setActiveTab] = useState<'company' | 'employee' | 'salary'>('company');

  const updateField = (field: keyof SalarySlipFormData, val: string | number) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  // Calculations
  const grossEarnings =
    Number(form.basicSalary) +
    Number(form.hra) +
    Number(form.conveyance) +
    Number(form.medicalAllowance) +
    Number(form.specialAllowance) +
    Number(form.overtimeOrBonus);

  const totalDeductions =
    Number(form.providentFund) +
    Number(form.professionalTax) +
    Number(form.tdsIncomeTax) +
    Number(form.healthInsurance) +
    Number(form.loanAdvance);

  const netPay = grossEarnings - totalDeductions;
  const netPayWords = numberToWordsINR(netPay);

  // Convert the form values into a SheetData structure
  const handleGenerateAndApply = () => {
    const cells: Record<string, CellData> = {};

    const colWidths: Record<number, number> = {
      0: 45,
      1: 220,
      2: 130,
      3: 35,
      4: 220,
      5: 130,
      6: 45,
    };

    const rowHeights: Record<number, number> = {
      0: 36,
      1: 24,
      2: 28,
      3: 16,
      4: 26,
      5: 26,
      6: 26,
      7: 26,
      8: 16,
      9: 30,
      10: 24,
      11: 24,
      12: 24,
      13: 24,
      14: 24,
      15: 24,
      16: 30,
      17: 16,
      18: 34,
      19: 28,
      20: 20,
      21: 45,
    };

    // Row 1: Company Name
    cells['B1'] = {
      value: form.companyName.toUpperCase(),
      colSpan: 5,
      style: {
        bold: true,
        fontSize: 16,
        align: 'center',
        color: '#0f172a',
        backgroundColor: '#f8fafc',
      },
    };
    ['C1', 'D1', 'E1', 'F1'].forEach((k) => (cells[k] = { value: '', mergedInto: 'B1' }));

    // Row 2: Address
    cells['B2'] = {
      value: `${form.companyAddress} | ${form.companySubtext}`,
      colSpan: 5,
      style: {
        fontSize: 10,
        align: 'center',
        color: '#475569',
        backgroundColor: '#f8fafc',
      },
    };
    ['C2', 'D2', 'E2', 'F2'].forEach((k) => (cells[k] = { value: '', mergedInto: 'B2' }));

    // Row 3: Month & Title
    cells['B3'] = {
      value: `SALARY SLIP / वेतन पर्ची - ${form.monthYear.toUpperCase()}`,
      colSpan: 5,
      style: {
        bold: true,
        fontSize: 12,
        align: 'center',
        color: '#1e3a8a',
        backgroundColor: '#e0e7ff',
        borders: { bottom: { style: 'medium', color: '#3b82f6' } },
      },
    };
    ['C3', 'D3', 'E3', 'F3'].forEach((k) => (cells[k] = { value: '', mergedInto: 'B3' }));

    // Employee Block
    const setEmp = (r: number, l1: string, v1: string, l2: string, v2: string) => {
      cells[`B${r}`] = { value: l1, style: { bold: true, fontSize: 10, backgroundColor: '#f1f5f9', color: '#334155' } };
      cells[`C${r}`] = { value: v1, style: { fontSize: 10, color: '#0f172a' } };
      cells[`D${r}`] = { value: '' };
      cells[`E${r}`] = { value: l2, style: { bold: true, fontSize: 10, backgroundColor: '#f1f5f9', color: '#334155' } };
      cells[`F${r}`] = { value: v2, style: { fontSize: 10, color: '#0f172a' } };
    };

    setEmp(5, 'Employee Name / कर्मचारी:', form.employeeName, 'Employee ID / कोड:', form.employeeId);
    setEmp(6, 'Designation / पद:', form.designation, 'Department / विभाग:', form.department);
    setEmp(7, 'Bank A/c / बैंक खाता:', form.bankAccount, 'UAN / PF No:', form.pfUan);
    setEmp(8, 'Days Worked / कार्य दिवस:', `${form.workedDays} Days`, 'LOP / अनुपस्थित दिन:', `${form.lopDays} Days`);

    // Table Header
    cells['B10'] = {
      value: 'EARNINGS / आय विवरण',
      style: { bold: true, fontSize: 11, align: 'left', color: '#ffffff', backgroundColor: '#059669', borders: { top: { style: 'medium' }, bottom: { style: 'medium' } } },
    };
    cells['C10'] = {
      value: 'AMOUNT (₹)',
      style: { bold: true, fontSize: 11, align: 'right', color: '#ffffff', backgroundColor: '#059669', borders: { top: { style: 'medium' }, bottom: { style: 'medium' } } },
    };
    cells['D10'] = { value: '' };
    cells['E10'] = {
      value: 'DEDUCTIONS / कटौती विवरण',
      style: { bold: true, fontSize: 11, align: 'left', color: '#ffffff', backgroundColor: '#dc2626', borders: { top: { style: 'medium' }, bottom: { style: 'medium' } } },
    };
    cells['F10'] = {
      value: 'AMOUNT (₹)',
      style: { bold: true, fontSize: 11, align: 'right', color: '#ffffff', backgroundColor: '#dc2626', borders: { top: { style: 'medium' }, bottom: { style: 'medium' } } },
    };

    const earningsItems = [
      { name: 'Basic Salary / मूल वेतन', val: form.basicSalary },
      { name: 'House Rent Allowance (HRA)', val: form.hra },
      { name: 'Conveyance Allowance', val: form.conveyance },
      { name: 'Medical Allowance', val: form.medicalAllowance },
      { name: 'Special Allowance', val: form.specialAllowance },
      { name: 'Performance Bonus / Overtime', val: form.overtimeOrBonus },
    ];

    const deductionItems = [
      { name: 'Provident Fund (EPF / पीएफ)', val: form.providentFund },
      { name: 'Professional Tax (PT)', val: form.professionalTax },
      { name: 'TDS / Income Tax (आयकर)', val: form.tdsIncomeTax },
      { name: 'Health Insurance (ESIC)', val: form.healthInsurance },
      { name: 'Loan / Advance Recovery', val: form.loanAdvance },
      { name: 'Other Deductions', val: 0 },
    ];

    earningsItems.forEach((item, idx) => {
      const r = 11 + idx;
      cells[`B${r}`] = { value: item.name, style: { fontSize: 10, borders: { bottom: { style: 'thin', color: '#e2e8f0' }, left: { style: 'thin', color: '#cbd5e1' } } } };
      cells[`C${r}`] = { value: String(item.val), style: { fontSize: 10, align: 'right', format: 'currency_inr', borders: { bottom: { style: 'thin', color: '#e2e8f0' }, right: { style: 'thin', color: '#cbd5e1' } } } };
      cells[`D${r}`] = { value: '' };
      cells[`E${r}`] = { value: deductionItems[idx].name, style: { fontSize: 10, borders: { bottom: { style: 'thin', color: '#e2e8f0' }, left: { style: 'thin', color: '#cbd5e1' } } } };
      cells[`F${r}`] = { value: String(deductionItems[idx].val), style: { fontSize: 10, align: 'right', format: 'currency_inr', borders: { bottom: { style: 'thin', color: '#e2e8f0' }, right: { style: 'thin', color: '#cbd5e1' } } } };
    });

    // Totals
    cells['B17'] = {
      value: 'GROSS EARNINGS / कुल आय:',
      style: { bold: true, fontSize: 11, backgroundColor: '#ecfdf5', color: '#065f46', borders: { top: { style: 'medium', color: '#059669' }, bottom: { style: 'medium', color: '#059669' } } },
    };
    cells['C17'] = {
      value: String(grossEarnings),
      formula: '=SUM(C11:C16)',
      style: { bold: true, fontSize: 11, align: 'right', format: 'currency_inr', backgroundColor: '#ecfdf5', color: '#065f46', borders: { top: { style: 'medium', color: '#059669' }, bottom: { style: 'medium', color: '#059669' } } },
    };
    cells['D17'] = { value: '' };
    cells['E17'] = {
      value: 'TOTAL DEDUCTIONS / कुल कटौती:',
      style: { bold: true, fontSize: 11, backgroundColor: '#fef2f2', color: '#991b1b', borders: { top: { style: 'medium', color: '#dc2626' }, bottom: { style: 'medium', color: '#dc2626' } } },
    };
    cells['F17'] = {
      value: String(totalDeductions),
      formula: '=SUM(F11:F16)',
      style: { bold: true, fontSize: 11, align: 'right', format: 'currency_inr', backgroundColor: '#fef2f2', color: '#991b1b', borders: { top: { style: 'medium', color: '#dc2626' }, bottom: { style: 'medium', color: '#dc2626' } } },
    };

    // Net Pay
    cells['B19'] = {
      value: 'NET TAKE-HOME SALARY / शुद्ध वेतन भुगतान:',
      colSpan: 3,
      style: { bold: true, fontSize: 13, align: 'right', color: '#1e3a8a', backgroundColor: '#dbeafe', borders: { top: { style: 'medium', color: '#2563eb' }, bottom: { style: 'double', color: '#2563eb' }, left: { style: 'medium', color: '#2563eb' } } },
    };
    ['C19', 'D19'].forEach((k) => (cells[k] = { value: '', mergedInto: 'B19' }));

    cells['E19'] = {
      value: String(netPay),
      formula: '=C17-F17',
      colSpan: 2,
      style: { bold: true, fontSize: 15, align: 'center', color: '#1e40af', backgroundColor: '#dbeafe', format: 'currency_inr', borders: { top: { style: 'medium', color: '#2563eb' }, bottom: { style: 'double', color: '#2563eb' }, right: { style: 'medium', color: '#2563eb' } } },
    };
    cells['F19'] = { value: '', mergedInto: 'E19' };

    // Amount in Words
    cells['B20'] = {
      value: `Amount in Words: ${netPayWords}`,
      colSpan: 5,
      style: { bold: true, italic: true, fontSize: 10, align: 'center', color: '#1e293b', backgroundColor: '#f8fafc', borders: { bottom: { style: 'thin', color: '#cbd5e1' } } },
    };
    ['C20', 'D20', 'E20', 'F20'].forEach((k) => (cells[k] = { value: '', mergedInto: 'B20' }));

    // Signatures
    cells['B22'] = {
      value: "Employer's Signature / अधिकृत हस्ताक्षर",
      colSpan: 2,
      style: { bold: true, fontSize: 10, align: 'center', vAlign: 'bottom', color: '#475569', borders: { top: { style: 'dashed', color: '#94a3b8' } } },
    };
    cells['C22'] = { value: '', mergedInto: 'B22' };

    cells['E22'] = {
      value: "Employee's Signature / कर्मचारी हस्ताक्षर",
      colSpan: 2,
      style: { bold: true, fontSize: 10, align: 'center', vAlign: 'bottom', color: '#475569', borders: { top: { style: 'dashed', color: '#94a3b8' } } },
    };
    cells['F22'] = { value: '', mergedInto: 'E22' };

    const newSheet: SheetData = {
      id: `salary_slip_${Date.now()}`,
      name: `Payslip - ${form.employeeName.split(' ')[0]}`,
      cells,
      rowCount: 35,
      colCount: 12,
      rowHeights,
      colWidths,
      charts: [
        {
          id: `chart_salary_${Date.now()}`,
          title: `${form.employeeName} - Salary Breakdown`,
          type: 'donut',
          range: 'B11:C16',
          labelCol: 1,
          valueCols: [2],
          palette: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#047857'],
          showLegend: true,
          showValues: true,
          showGrid: false,
        },
      ],
      showGridLines: true,
    };

    onApplyToSheet(newSheet);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Salary Slip Generator / वेतन पर्ची निर्माता</span>
            </h2>
            <p className="text-xs text-slate-500">
              Fill details to automatically generate a complete, formatted salary slip sheet with formulas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-white gap-2">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'company'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. Company Info / कंपनी विवरण</span>
          </button>
          <button
            onClick={() => setActiveTab('employee')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'employee'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>2. Employee Details / कर्मचारी जानकारी</span>
          </button>
          <button
            onClick={() => setActiveTab('salary')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'salary'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>3. Salary, Allowances & Deductions / वेतन व कटौती</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'company' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Acme Tech Solutions Pvt. Ltd."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Address / Office Location
                </label>
                <input
                  type="text"
                  value={form.companyAddress}
                  onChange={(e) => updateField('companyAddress', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Plot 42, Cyber City, Gurgaon, Haryana - 122002"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GSTIN / CIN / Registration No.
                </label>
                <input
                  type="text"
                  value={form.companySubtext}
                  onChange={(e) => updateField('companySubtext', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Salary Month & Year / वेतन माह
                </label>
                <input
                  type="text"
                  value={form.monthYear}
                  onChange={(e) => updateField('monthYear', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. OCTOBER 2026"
                />
              </div>
            </div>
          )}

          {activeTab === 'employee' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee Full Name / कर्मचारी का नाम *
                </label>
                <input
                  type="text"
                  value={form.employeeName}
                  onChange={(e) => updateField('employeeName', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee ID / कोड *
                </label>
                <input
                  type="text"
                  value={form.employeeId}
                  onChange={(e) => updateField('employeeId', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation / पद
                </label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => updateField('designation', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department / विभाग
                </label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => updateField('department', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Name & Account No.
                </label>
                <input
                  type="text"
                  value={form.bankAccount}
                  onChange={(e) => updateField('bankAccount', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  UAN / Provident Fund No.
                </label>
                <input
                  type="text"
                  value={form.pfUan}
                  onChange={(e) => updateField('pfUan', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Working Days in Month / कार्य दिवस
                </label>
                <input
                  type="number"
                  value={form.workedDays}
                  onChange={(e) => updateField('workedDays', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Leave Without Pay (LOP Days)
                </label>
                <input
                  type="number"
                  value={form.lopDays}
                  onChange={(e) => updateField('lopDays', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'salary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings Column */}
              <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <span className="font-bold text-emerald-900 text-sm">Earnings / आय (₹)</span>
                  <span className="text-xs font-semibold text-emerald-700 font-mono">
                    Gross: ₹{grossEarnings.toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Basic Salary / मूल वेतन</label>
                  <input
                    type="number"
                    value={form.basicSalary}
                    onChange={(e) => updateField('basicSalary', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">House Rent Allowance (HRA)</label>
                  <input
                    type="number"
                    value={form.hra}
                    onChange={(e) => updateField('hra', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Conveyance Allowance</label>
                  <input
                    type="number"
                    value={form.conveyance}
                    onChange={(e) => updateField('conveyance', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Medical Allowance</label>
                  <input
                    type="number"
                    value={form.medicalAllowance}
                    onChange={(e) => updateField('medicalAllowance', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Special Allowance</label>
                  <input
                    type="number"
                    value={form.specialAllowance}
                    onChange={(e) => updateField('specialAllowance', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Bonus / Overtime / Incentives</label>
                  <input
                    type="number"
                    value={form.overtimeOrBonus}
                    onChange={(e) => updateField('overtimeOrBonus', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>

              {/* Deductions Column */}
              <div className="bg-rose-50/50 p-4 rounded-lg border border-rose-200 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                  <span className="font-bold text-rose-900 text-sm">Deductions / कटौती (₹)</span>
                  <span className="text-xs font-semibold text-rose-700 font-mono">
                    Total: ₹{totalDeductions.toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Provident Fund (EPF / पीएफ)</label>
                  <input
                    type="number"
                    value={form.providentFund}
                    onChange={(e) => updateField('providentFund', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Professional Tax (PT)</label>
                  <input
                    type="number"
                    value={form.professionalTax}
                    onChange={(e) => updateField('professionalTax', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">TDS / Income Tax (आयकर)</label>
                  <input
                    type="number"
                    value={form.tdsIncomeTax}
                    onChange={(e) => updateField('tdsIncomeTax', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Health Insurance (ESIC)</label>
                  <input
                    type="number"
                    value={form.healthInsurance}
                    onChange={(e) => updateField('healthInsurance', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Loan / Advance Recovery</label>
                  <input
                    type="number"
                    value={form.loanAdvance}
                    onChange={(e) => updateField('loanAdvance', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Real-time Net Pay Strip */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-blue-900 block">
                Net Take-Home Pay / शुद्ध वेतन भुगतान
              </span>
              <span className="text-[11px] text-blue-700 italic">
                {netPayWords}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-blue-950 font-mono tabular-nums">
                ₹{netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500">
            Click Apply to create an editable spreadsheet sheet with live formulas.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
            >
              Cancel / रद्द करें
            </button>
            {onDirectPrint && (
              <button
                onClick={() => onDirectPrint(form)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Instant Print</span>
              </button>
            )}
            <button
              onClick={handleGenerateAndApply}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Apply to Sheet / शीट में जोड़ें</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

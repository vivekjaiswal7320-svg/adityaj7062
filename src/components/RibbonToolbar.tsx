/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  CellStyle,
  HorizontalAlign,
  NumberFormatType,
  BorderStyle,
} from '../types/spreadsheet';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Printer,
  FileSpreadsheet,
  BarChart3,
  PieChart,
  LineChart,
  Table as TableIcon,
  Plus,
  Trash2,
  Undo2,
  Redo2,
  Search,
  Sigma,
  DollarSign,
  Percent,
  Download,
  Upload,
  Layers,
  Sparkles,
  Grid,
  FileText,
  Copy,
  Scissors,
  Clipboard,
  Square,
  HelpCircle,
} from 'lucide-react';

interface RibbonToolbarProps {
  currentStyle: CellStyle;
  onApplyStyle: (partialStyle: Partial<CellStyle>) => void;
  onApplyBorders: (type: 'all' | 'outside' | 'bottom_double' | 'top_bottom' | 'none') => void;
  onMergeCells: () => void;
  onUnmergeCells: () => void;
  canMerge: boolean;
  isMerged: boolean;
  onInsertRow: () => void;
  onDeleteRow: () => void;
  onInsertCol: () => void;
  onDeleteCol: () => void;
  onAutoSum: () => void;
  onOpenSalarySlipWizard: () => void;
  onOpenChartModal: () => void;
  onOpenFindReplace: () => void;
  onOpenPrintPreview: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadTemplate: (type: 'salary' | 'payroll' | 'sales' | 'blank') => void;
  showGridLines: boolean;
  onToggleGridLines: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
}

const COLOR_PALETTE = [
  '#000000', '#334155', '#64748b', '#ffffff',
  '#059669', '#10b981', '#34d399', '#ecfdf5',
  '#2563eb', '#3b82f6', '#60a5fa', '#eff6ff',
  '#dc2626', '#ef4444', '#f87171', '#fef2f2',
  '#d97706', '#f59e0b', '#fbbf24', '#fffbeb',
  '#7c3aed', '#8b5cf6', '#a78bfa', '#f5f3ff',
];

const BG_COLOR_PALETTE = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0',
  '#ecfdf5', '#d1fae5', '#a7f3d0', '#059669',
  '#eff6ff', '#dbeafe', '#bfdbfe', '#2563eb',
  '#fef2f2', '#fee2e2', '#fecaca', '#dc2626',
  '#fffbeb', '#fef3c7', '#fde68a', '#d97706',
  '#f5f3ff', '#ede9fe', '#ddd6fe', '#7c3aed',
];

export const RibbonToolbar: React.FC<RibbonToolbarProps> = ({
  currentStyle,
  onApplyStyle,
  onApplyBorders,
  onMergeCells,
  onUnmergeCells,
  canMerge,
  isMerged,
  onInsertRow,
  onDeleteRow,
  onInsertCol,
  onDeleteCol,
  onAutoSum,
  onOpenSalarySlipWizard,
  onOpenChartModal,
  onOpenFindReplace,
  onOpenPrintPreview,
  onExportCSV,
  onExportJSON,
  onImportFile,
  onLoadTemplate,
  showGridLines,
  onToggleGridLines,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCopy,
  onCut,
  onPaste,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'salary' | 'charts' | 'page' | 'file'>('home');
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showBorderMenu, setShowBorderMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutside = () => {
      setShowTextColorPicker(false);
      setShowBgColorPicker(false);
      setShowBorderMenu(false);
      setShowTemplateMenu(false);
    };
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  return (
    <div className="bg-slate-50 border-b border-slate-200 select-none flex flex-col">
      {/* 1. Top Ribbon Tab Bar */}
      <div className="flex items-center justify-between px-3 pt-1.5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-1">
          {/* Quick Access Actions */}
          <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-100"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-100"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenPrintPreview}
              title="Quick Print (Ctrl+P)"
              className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ribbon Tabs */}
          {[
            { id: 'home', label: 'Home / होम' },
            { id: 'insert', label: 'Insert / इंसर्ट' },
            { id: 'salary', label: 'Salary Slip / वेतन पर्ची' },
            { id: 'charts', label: 'Charts / चार्ट' },
            { id: 'page', label: 'Page & Print / प्रिंट' },
            { id: 'file', label: 'Data & File / डेटा' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-100 text-emerald-800 border-t-2 border-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Brand Kicker / Status */}
        <div className="flex items-center gap-3 pr-2">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTemplateMenu(!showTemplateMenu);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Templates / टेम्पलेट</span>
              <ChevronDown className="w-3 h-3 text-emerald-700" />
            </button>

            {showTemplateMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-left"
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Ready-to-Use Templates
                </div>
                <button
                  onClick={() => {
                    onLoadTemplate('salary');
                    setShowTemplateMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-xs text-slate-800 font-medium flex flex-col"
                >
                  <span className="text-emerald-800 font-semibold">Salary Slip (वेतन पर्ची)</span>
                  <span className="text-[10px] text-slate-500">Official Indian Payslip format with EPF, HRA & formulas</span>
                </button>
                <button
                  onClick={() => {
                    onLoadTemplate('payroll');
                    setShowTemplateMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-xs text-slate-800 font-medium flex flex-col"
                >
                  <span className="text-emerald-800 font-semibold">Payroll Register (मासिक पेरोल)</span>
                  <span className="text-[10px] text-slate-500">Multiple employee salary ledger with Net Pay chart</span>
                </button>
                <button
                  onClick={() => {
                    onLoadTemplate('sales');
                    setShowTemplateMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-xs text-slate-800 font-medium flex flex-col"
                >
                  <span className="text-emerald-800 font-semibold">Sales & Expenses (व्यापार आय-व्यय)</span>
                  <span className="text-[10px] text-slate-500">Revenue, expense tracking with profit chart</span>
                </button>
                <button
                  onClick={() => {
                    onLoadTemplate('blank');
                    setShowTemplateMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs text-slate-600 font-medium border-t border-slate-100"
                >
                  Blank Sheet (कोरी शीट)
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onOpenSalarySlipWizard}
            className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Salary Slip</span>
          </button>
        </div>
      </div>

      {/* 2. Ribbon Content Strip */}
      <div className="px-3 py-1.5 flex items-center gap-4 overflow-x-auto min-h-[52px]">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <>
            {/* Clipboard Section */}
            <div className="flex items-center gap-1 pr-3 border-r border-slate-200">
              <button
                onClick={onCopy}
                title="Copy (Ctrl+C)"
                className="flex flex-col items-center justify-center px-2 py-1 text-[10px] text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
              <button
                onClick={onCut}
                title="Cut (Ctrl+X)"
                className="flex flex-col items-center justify-center px-2 py-1 text-[10px] text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Cut</span>
              </button>
              <button
                onClick={onPaste}
                title="Paste (Ctrl+V)"
                className="flex flex-col items-center justify-center px-2 py-1 text-[10px] text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
            </div>

            {/* Font & Text Styling */}
            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-200">
              {/* Font Size */}
              <select
                value={currentStyle.fontSize || 11}
                onChange={(e) => onApplyStyle({ fontSize: parseInt(e.target.value, 10) })}
                className="px-1.5 py-1 text-xs font-medium bg-white border border-slate-300 rounded hover:border-slate-400 focus:outline-none"
              >
                {[9, 10, 11, 12, 14, 16, 18, 20, 24].map((sz) => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>

              <button
                onClick={() => onApplyStyle({ bold: !currentStyle.bold })}
                title="Bold (Ctrl+B)"
                className={`p-1.5 rounded transition-colors ${
                  currentStyle.bold ? 'bg-slate-300 text-slate-900' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onApplyStyle({ italic: !currentStyle.italic })}
                title="Italic (Ctrl+I)"
                className={`p-1.5 rounded transition-colors ${
                  currentStyle.italic ? 'bg-slate-300 text-slate-900' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onApplyStyle({ underline: !currentStyle.underline })}
                title="Underline (Ctrl+U)"
                className={`p-1.5 rounded transition-colors ${
                  currentStyle.underline ? 'bg-slate-300 text-slate-900' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Underline className="w-3.5 h-3.5" />
              </button>

              {/* Text Color Picker */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTextColorPicker(!showTextColorPicker);
                    setShowBgColorPicker(false);
                  }}
                  title="Text Color / अक्षर रंग"
                  className="flex items-center gap-0.5 p-1 text-slate-600 hover:bg-slate-200 rounded"
                >
                  <span className="font-bold text-xs" style={{ color: currentStyle.color || '#000000' }}>A</span>
                  <div
                    className="w-3 h-1 rounded-xs"
                    style={{ backgroundColor: currentStyle.color || '#000000' }}
                  />
                  <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                </button>

                {showTextColorPicker && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-full mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-xl grid grid-cols-4 gap-1.5 z-50 w-36"
                  >
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          onApplyStyle({ color: c });
                          setShowTextColorPicker(false);
                        }}
                        className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Background Color Picker */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBgColorPicker(!showBgColorPicker);
                    setShowTextColorPicker(false);
                  }}
                  title="Fill Background Color / सेल रंग"
                  className="flex items-center gap-0.5 p-1 text-slate-600 hover:bg-slate-200 rounded"
                >
                  <div
                    className="w-3.5 h-3.5 rounded-xs border border-slate-400"
                    style={{ backgroundColor: currentStyle.backgroundColor || '#ffffff' }}
                  />
                  <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                </button>

                {showBgColorPicker && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-full mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-xl grid grid-cols-4 gap-1.5 z-50 w-36"
                  >
                    {BG_COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          onApplyStyle({ backgroundColor: c });
                          setShowBgColorPicker(false);
                        }}
                        className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Borders Dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBorderMenu(!showBorderMenu);
                  }}
                  title="Cell Borders / बॉर्डर"
                  className="flex items-center gap-0.5 p-1 text-slate-600 hover:bg-slate-200 rounded"
                >
                  <Square className="w-3.5 h-3.5" />
                  <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                </button>

                {showBorderMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-xs"
                  >
                    <button
                      onClick={() => {
                        onApplyBorders('all');
                        setShowBorderMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 flex items-center justify-between"
                    >
                      <span>All Borders / सभी बॉर्डर</span>
                      <span className="font-mono text-[10px]">田</span>
                    </button>
                    <button
                      onClick={() => {
                        onApplyBorders('outside');
                        setShowBorderMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 flex items-center justify-between"
                    >
                      <span>Box Border / बाहरी बॉर्डर</span>
                      <span className="font-mono text-[10px]">□</span>
                    </button>
                    <button
                      onClick={() => {
                        onApplyBorders('bottom_double');
                        setShowBorderMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 flex items-center justify-between"
                    >
                      <span>Bottom Double Border (Salary)</span>
                      <span className="font-mono text-[10px]">‗</span>
                    </button>
                    <button
                      onClick={() => {
                        onApplyBorders('top_bottom');
                        setShowBorderMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-emerald-50"
                    >
                      <span>Top and Bottom Border</span>
                    </button>
                    <button
                      onClick={() => {
                        onApplyBorders('none');
                        setShowBorderMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 border-t border-slate-100"
                    >
                      <span>No Border / हटाएं</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Alignment Section */}
            <div className="flex items-center gap-1 pr-3 border-r border-slate-200">
              <button
                onClick={() => onApplyStyle({ align: 'left' })}
                title="Align Left"
                className={`p-1.5 rounded transition-colors ${
                  currentStyle.align === 'left' ? 'bg-slate-300 text-slate-900' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onApplyStyle({ align: 'center' })}
                title="Align Center"
                className={`p-1.5 rounded transition-colors ${
                  currentStyle.align === 'center' ? 'bg-slate-300 text-slate-900' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onApplyStyle({ align: 'right' })}
                title="Align Right"
                className={`p-1.5 rounded transition-colors ${
                  currentStyle.align === 'right' ? 'bg-slate-300 text-slate-900' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>

              {/* Merge & Center */}
              {isMerged ? (
                <button
                  onClick={onUnmergeCells}
                  className="px-2 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded"
                >
                  Unmerge
                </button>
              ) : (
                <button
                  onClick={onMergeCells}
                  disabled={!canMerge}
                  title="Merge selected cells"
                  className="px-2 py-1 text-[11px] font-medium bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 border border-slate-300 rounded"
                >
                  Merge & Center
                </button>
              )}
            </div>

            {/* Number Formatting */}
            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-200">
              <select
                value={currentStyle.format || 'general'}
                onChange={(e) => onApplyStyle({ format: e.target.value as NumberFormatType })}
                className="px-2 py-1 text-xs font-medium bg-white border border-slate-300 rounded hover:border-slate-400 focus:outline-none"
              >
                <option value="general">General / सामान्य</option>
                <option value="currency_inr">₹ Indian Rupee (INR)</option>
                <option value="currency_usd">$ US Dollar (USD)</option>
                <option value="number">Number (1,234.00)</option>
                <option value="percent">Percentage (%)</option>
                <option value="date">Date (DD/MM/YYYY)</option>
                <option value="text">Plain Text</option>
              </select>

              <button
                onClick={() => onApplyStyle({ format: 'currency_inr' })}
                title="Format as Indian Rupee (₹)"
                className="px-1.5 py-1 text-xs font-bold font-mono text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
              >
                ₹
              </button>
              <button
                onClick={() => onApplyStyle({ format: 'percent' })}
                title="Format as Percent"
                className="p-1 text-slate-600 hover:bg-slate-200 rounded"
              >
                <Percent className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table / Grid Manipulation (Rows & Columns) */}
            <div className="flex items-center gap-1 pr-3 border-r border-slate-200">
              <button
                onClick={onInsertRow}
                title="Insert Row Above / नई पंक्ति"
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded"
              >
                <Plus className="w-3 h-3 text-emerald-600" />
                <span>+ Row</span>
              </button>
              <button
                onClick={onInsertCol}
                title="Insert Column / नया कॉलम"
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded"
              >
                <Plus className="w-3 h-3 text-emerald-600" />
                <span>+ Col</span>
              </button>
              <button
                onClick={onDeleteRow}
                title="Delete Selected Row / पंक्ति हटाएं"
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Editing Tools */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onAutoSum}
                title="AutoSum / कुल योग (Σ)"
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded"
              >
                <Sigma className="w-3.5 h-3.5" />
                <span>AutoSum</span>
              </button>

              <button
                onClick={onOpenFindReplace}
                title="Find & Replace (Ctrl+F)"
                className="p-1 text-slate-600 hover:bg-slate-200 rounded"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

        {/* TAB 2: INSERT */}
        {activeTab === 'insert' && (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenChartModal}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-300 rounded-lg shadow-2xs transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Insert Chart / नया चार्ट जोड़ें</span>
            </button>

            <button
              onClick={onOpenSalarySlipWizard}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-300 rounded-lg shadow-2xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Salary Slip Block / वेतन पर्ची टेबल</span>
            </button>

            <div className="h-5 w-px bg-slate-200" />

            <button
              onClick={() => onLoadTemplate('payroll')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded"
            >
              <TableIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Payroll Table</span>
            </button>

            <button
              onClick={() => onLoadTemplate('sales')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded"
            >
              <LineChart className="w-3.5 h-3.5 text-slate-500" />
              <span>Sales Tracker</span>
            </button>
          </div>
        )}

        {/* TAB 3: SALARY SLIP */}
        {activeTab === 'salary' && (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSalarySlipWizard}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Customize Salary Slip Wizard / वेतन पर्ची निर्माता</span>
            </button>

            <button
              onClick={() => onLoadTemplate('salary')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset to Standard Indian Payslip</span>
            </button>

            <button
              onClick={onOpenPrintPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg"
            >
              <Printer className="w-3.5 h-3.5 text-blue-700" />
              <span>Print A4 Payslip (A4 वेतन पर्ची प्रिंट)</span>
            </button>
          </div>
        )}

        {/* TAB 4: CHARTS */}
        {activeTab === 'charts' && (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenChartModal}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg"
            >
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              <span>Create Chart from Selected Data</span>
            </button>

            <div className="flex items-center gap-1 text-xs text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
              <span>Supported: Column, Bar, Line, Area, Pie, Donut charts</span>
            </div>
          </div>
        )}

        {/* TAB 5: PAGE & PRINT */}
        {activeTab === 'page' && (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenPrintPreview}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={showGridLines}
                onChange={onToggleGridLines}
                className="rounded text-emerald-600"
              />
              <Grid className="w-3.5 h-3.5 text-slate-500" />
              <span>Show Gridlines</span>
            </label>
          </div>
        )}

        {/* TAB 6: DATA & FILE */}
        {activeTab === 'file' && (
          <div className="flex items-center gap-3">
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export CSV (एक्सेल फाइल)</span>
            </button>

            <button
              onClick={onExportJSON}
              title="Save full workbook with formatting & formulas"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>Save Workbook (.json)</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-amber-700" />
              <span>Import File (.csv / .json)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={onImportFile}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

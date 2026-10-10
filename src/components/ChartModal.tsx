/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChartModel, ChartType, SheetData } from '../types/spreadsheet';
import { colToIndex, indexToCol } from '../utils/formulaEngine';
import { InteractiveChart } from './InteractiveChart';
import { X, BarChart3, PieChart, LineChart, Check } from 'lucide-react';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveChart: (chart: ChartModel) => void;
  initialChart?: ChartModel | null;
  selectedRangeStr?: string;
  sheet: SheetData;
}

const PALETTES = [
  { name: 'Emerald Forest', colors: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#047857'] },
  { name: 'Excel Blue', colors: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8'] },
  { name: 'Corporate Teal', colors: ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#0f766e'] },
  { name: 'Sunset Amber', colors: ['#f59e0b', '#fbbf24', '#f97316', '#fb923c', '#d97706'] },
  { name: 'Crimson Rose', colors: ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#b91c1c'] },
  { name: 'Royal Indigo', colors: ['#6366f1', '#818cf8', '#a5b4fc', '#4f46e5', '#4338ca'] },
];

export const ChartModal: React.FC<ChartModalProps> = ({
  isOpen,
  onClose,
  onSaveChart,
  initialChart,
  selectedRangeStr,
  sheet,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(initialChart?.title || 'Salary / Data Analysis Chart');
  const [type, setType] = useState<ChartType>(initialChart?.type || 'column');
  const [range, setRange] = useState(initialChart?.range || selectedRangeStr || 'B11:C16');
  const [labelColLetter, setLabelColLetter] = useState(
    initialChart ? indexToCol(initialChart.labelCol) : 'B'
  );
  const [valueColsStr, setValueColsStr] = useState(
    initialChart ? initialChart.valueCols.map(indexToCol).join(', ') : 'C'
  );
  const [palette, setPalette] = useState<string[]>(
    initialChart?.palette || PALETTES[0].colors
  );
  const [showLegend, setShowLegend] = useState(initialChart?.showLegend ?? true);
  const [showValues, setShowValues] = useState(initialChart?.showValues ?? true);
  const [showGrid, setShowGrid] = useState(initialChart?.showGrid ?? true);

  // Parse labelCol and valueCols
  const labelCol = colToIndex(labelColLetter.trim() || 'A');
  const valueCols = valueColsStr
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0)
    .map(colToIndex)
    .filter((idx) => !isNaN(idx) && idx >= 0);

  const previewChart: ChartModel = {
    id: initialChart?.id || `chart_${Date.now()}`,
    title,
    type,
    range,
    labelCol: isNaN(labelCol) || labelCol < 0 ? 0 : labelCol,
    valueCols: valueCols.length > 0 ? valueCols : [1],
    palette,
    showLegend,
    showValues,
    showGrid,
  };

  const handleSave = () => {
    onSaveChart(previewChart);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialChart ? 'Edit Chart / चार्ट संपादित करें' : 'Create Custom Chart / नया चार्ट बनाएं'}
            </h2>
            <p className="text-xs text-slate-500">
              Customize data ranges, chart types, colors, and labels to visualize spreadsheet data
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 overflow-y-auto flex-1">
          {/* Controls Column */}
          <div className="md:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chart Title / शीर्षक
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Salary Earnings Breakdown"
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chart Type / प्रकार
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'column', label: 'Column Bar', icon: BarChart3 },
                  { id: 'bar', label: 'Horizontal Bar', icon: BarChart3 },
                  { id: 'pie', label: 'Pie Chart', icon: PieChart },
                  { id: 'donut', label: 'Donut', icon: PieChart },
                  { id: 'line', label: 'Line Chart', icon: LineChart },
                  { id: 'area', label: 'Area Chart', icon: LineChart },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as ChartType)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all ${
                      type === item.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mb-1" />
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data Range / रेंज
                </label>
                <input
                  type="text"
                  value={range}
                  onChange={(e) => setRange(e.target.value.toUpperCase())}
                  placeholder="e.g. B11:C16"
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Label Col / नाम कॉलम
                </label>
                <input
                  type="text"
                  value={labelColLetter}
                  onChange={(e) => setLabelColLetter(e.target.value.toUpperCase())}
                  placeholder="e.g. B"
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Value Column(s) / मान कॉलम (comma separated)
              </label>
              <input
                type="text"
                value={valueColsStr}
                onChange={(e) => setValueColsStr(e.target.value.toUpperCase())}
                placeholder="e.g. C or C, F"
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Color Palette / रंग थीम
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PALETTES.map((p) => {
                  const isSelected = palette[0] === p.colors[0];
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setPalette(p.colors)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 border rounded-lg text-left text-xs ${
                        isSelected ? 'border-emerald-600 bg-emerald-50 font-medium' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex gap-1">
                        {p.colors.slice(0, 3).map((c, i) => (
                          <div
                            key={i}
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLegend}
                  onChange={(e) => setShowLegend(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Show Legend</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showValues}
                  onChange={(e) => setShowValues(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Show Values</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Show Grid</span>
              </label>
            </div>
          </div>

          {/* Real-time Live Preview */}
          <div className="md:col-span-7 flex flex-col">
            <span className="text-xs font-semibold text-slate-600 mb-2">Live Preview / पूर्वावलोकन</span>
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-center min-h-[300px]">
              <div className="w-full">
                <InteractiveChart
                  chart={previewChart}
                  sheet={sheet}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            Cancel / रद्द करें
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>{initialChart ? 'Save Changes' : 'Insert Chart / चार्ट जोड़ें'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

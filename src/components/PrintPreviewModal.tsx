/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { SheetData } from '../types/spreadsheet';
import { toCellKey, formatCellValue, evaluateFormula } from '../utils/formulaEngine';
import { X, Printer, Check, Eye } from 'lucide-react';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: SheetData;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  sheet,
}) => {
  if (!isOpen) return null;

  const [includeGridlines, setIncludeGridlines] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const handlePrint = () => {
    window.print();
  };

  // Find max row and col with data
  let maxRow = 0;
  let maxCol = 0;
  Object.keys(sheet.cells).forEach((k) => {
    const match = k.match(/^([A-Z]+)([0-9]+)$/);
    if (match) {
      const r = parseInt(match[2], 10) - 1;
      let c = 0;
      for (let i = 0; i < match[1].length; i++) {
        c = c * 26 + (match[1].charCodeAt(i) - 64);
      }
      c -= 1;
      if (r > maxRow) maxRow = r;
      if (c > maxCol) maxCol = c;
    }
  });

  const renderRows = Math.min(sheet.rowCount, Math.max(maxRow + 2, 22));
  const renderCols = Math.min(sheet.colCount, Math.max(maxCol + 1, 7));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-slate-100 rounded-xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Print Preview &amp; Export / प्रिंट पूर्वावलोकन
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">
                {sheet.name} · Standard A4
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600 font-medium">Orientation:</span>
              <button
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  orientation === 'portrait' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                Portrait (खड़ा)
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  orientation === 'landscape' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                Landscape (आड़ा)
              </button>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeGridlines}
                onChange={(e) => setIncludeGridlines(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Include Gridlines</span>
            </label>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document / प्रिंट करें</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas Preview */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-300">
          <div
            id="printable-area"
            className={`printable-sheet-area bg-white shadow-xl transition-all p-8 border border-slate-300 text-neutral-900 ${
              orientation === 'portrait' ? 'w-[794px] min-h-[1123px]' : 'w-[1123px] min-h-[794px]'
            }`}
          >
            <table className="w-full border-collapse text-xs">
              <tbody>
                {Array.from({ length: renderRows }).map((_, rIdx) => (
                  <tr
                    key={`p-row-${rIdx}`}
                    style={{
                      height: `${sheet.rowHeights[rIdx] || 24}px`,
                    }}
                  >
                    {Array.from({ length: renderCols }).map((_, cIdx) => {
                      const key = toCellKey(rIdx, cIdx);
                      const cell = sheet.cells[key];

                      if (cell?.mergedInto) {
                        return null; // Merged child cell
                      }

                      // Compute display value
                      let displayVal = cell?.value || '';
                      if (cell?.formula) {
                        try {
                          displayVal = evaluateFormula(cell.formula, sheet.cells);
                        } catch {
                          displayVal = '#ERR';
                        }
                      }
                      if (cell?.style?.format) {
                        displayVal = formatCellValue(displayVal, cell.style.format, cell.style.decimals ?? 2);
                      }

                      const st = cell?.style || {};
                      const borderClasses = [];
                      if (includeGridlines) {
                        borderClasses.push('border border-slate-200');
                      }

                      return (
                        <td
                          key={`p-col-${cIdx}`}
                          colSpan={cell?.colSpan || 1}
                          rowSpan={cell?.rowSpan || 1}
                          style={{
                            width: `${sheet.colWidths[cIdx] || 100}px`,
                            fontWeight: st.bold ? 700 : 400,
                            fontStyle: st.italic ? 'italic' : 'normal',
                            textDecoration: st.underline ? 'underline' : 'none',
                            color: st.color || '#0f172a',
                            backgroundColor: st.backgroundColor || 'transparent',
                            textAlign: st.align || 'left',
                            verticalAlign: st.vAlign || 'middle',
                            fontSize: `${st.fontSize || 10}px`,
                            fontFamily: st.fontFamily || 'inherit',
                            padding: '4px 8px',
                            borderTop: st.borders?.top ? `${st.borders.top.style === 'double' ? '3px double' : '1px solid'} ${st.borders.top.color || '#94a3b8'}` : undefined,
                            borderBottom: st.borders?.bottom ? `${st.borders.bottom.style === 'double' ? '3px double' : '1px solid'} ${st.borders.bottom.color || '#94a3b8'}` : undefined,
                            borderLeft: st.borders?.left ? `1px solid ${st.borders.left.color || '#94a3b8'}` : undefined,
                            borderRight: st.borders?.right ? `1px solid ${st.borders.right.color || '#94a3b8'}` : undefined,
                          }}
                          className={borderClasses.join(' ')}
                        >
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SheetData, CellRange } from '../types/spreadsheet';
import { toCellKey, formatCellValue, evaluateFormula } from '../utils/formulaEngine';
import { Plus, X, Edit2, Check } from 'lucide-react';

interface SheetTabsProps {
  sheets: SheetData[];
  activeSheetId: string;
  onSelectSheet: (id: string) => void;
  onAddSheet: () => void;
  onRenameSheet: (id: string, newName: string) => void;
  onDeleteSheet: (id: string) => void;
  selectionRange: CellRange;
  currentSheet: SheetData;
}

export const SheetTabs: React.FC<SheetTabsProps> = ({
  sheets,
  activeSheetId,
  onSelectSheet,
  onAddSheet,
  onRenameSheet,
  onDeleteSheet,
  selectionRange,
  currentSheet,
}) => {
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [sheetNameInput, setSheetNameInput] = useState<string>('');

  // Calculate live statistics of selected range for Excel status bar
  const stats = React.useMemo(() => {
    const minR = Math.min(selectionRange.startRow, selectionRange.endRow);
    const maxR = Math.max(selectionRange.startRow, selectionRange.endRow);
    const minC = Math.min(selectionRange.startCol, selectionRange.endCol);
    const maxC = Math.max(selectionRange.startCol, selectionRange.endCol);

    const cellCount = (maxR - minR + 1) * (maxC - minC + 1);
    let numCount = 0;
    let sum = 0;

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const k = toCellKey(r, c);
        const cell = currentSheet.cells[k];
        if (!cell) continue;

        let valStr = cell.value;
        if (cell.formula) {
          try {
            valStr = evaluateFormula(cell.formula, currentSheet.cells);
          } catch {
            valStr = '0';
          }
        }
        const num = parseFloat(String(valStr).replace(/,/g, ''));
        if (!isNaN(num) && isFinite(num)) {
          sum += num;
          numCount++;
        }
      }
    }

    const avg = numCount > 0 ? sum / numCount : 0;
    return { cellCount, numCount, sum, avg };
  }, [selectionRange, currentSheet.cells]);

  const handleStartRename = (sheet: SheetData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSheetId(sheet.id);
    setSheetNameInput(sheet.name);
  };

  const handleCommitRename = () => {
    if (editingSheetId && sheetNameInput.trim()) {
      onRenameSheet(editingSheetId, sheetNameInput.trim());
    }
    setEditingSheetId(null);
  };

  return (
    <div className="flex items-center justify-between px-2 bg-slate-100 border-t border-slate-300 text-xs select-none min-h-[34px]">
      {/* Left: Sheet Tabs List */}
      <div className="flex items-center gap-1 overflow-x-auto py-1">
        {sheets.map((s) => {
          const isActive = s.id === activeSheetId;
          const isEditing = editingSheetId === s.id;

          return (
            <div
              key={s.id}
              onClick={() => onSelectSheet(s.id)}
              className={`group flex items-center gap-1.5 px-3 py-1 rounded-t-sm border-t-2 text-xs font-medium cursor-pointer transition-colors ${
                isActive
                  ? 'bg-white text-emerald-800 border-emerald-600 shadow-2xs'
                  : 'bg-slate-200 text-slate-700 border-transparent hover:bg-slate-300/80'
              }`}
            >
              {isEditing ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={sheetNameInput}
                    onChange={(e) => setSheetNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitRename();
                      if (e.key === 'Escape') setEditingSheetId(null);
                    }}
                    autoFocus
                    className="px-1 py-0.5 text-xs bg-white border border-emerald-500 rounded outline-none w-28"
                  />
                  <button onClick={handleCommitRename} className="text-emerald-700 hover:text-emerald-900">
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <span onDoubleClick={(e) => handleStartRename(s, e)} className="truncate max-w-[150px]">
                    {s.name}
                  </span>
                  <button
                    onClick={(e) => handleStartRename(s, e)}
                    title="Rename Sheet"
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 transition-opacity"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                  {sheets.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSheet(s.id);
                      }}
                      title="Delete Sheet"
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Add New Sheet Button */}
        <button
          onClick={onAddSheet}
          title="New Sheet / नई शीट (+)"
          className="p-1 text-slate-600 hover:text-emerald-800 hover:bg-slate-200 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Excel Status Bar (Ready, Live Sum, Average, Count) */}
      <div className="flex items-center gap-4 text-[11px] text-slate-600 font-mono pr-3">
        <span className="text-slate-500 font-sans">Ready</span>
        {stats.cellCount > 1 && (
          <>
            <div className="h-3 w-px bg-slate-300" />
            <span>Count: <strong className="text-slate-800">{stats.cellCount}</strong></span>
            {stats.numCount > 0 && (
              <>
                <div className="h-3 w-px bg-slate-300" />
                <span>Average: <strong className="text-slate-800">{formatCellValue(stats.avg, 'number', 2)}</strong></span>
                <div className="h-3 w-px bg-slate-300" />
                <span>Sum: <strong className="text-slate-800">{formatCellValue(stats.sum, 'currency_inr', 2)}</strong></span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

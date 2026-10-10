/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SheetData,
  CellData,
  CellPosition,
  CellRange,
  CellStyle,
  ChartModel,
} from './types/spreadsheet';
import {
  toCellKey,
  indexToCol,
  parseCellKey,
  formatCellValue,
  evaluateFormula,
  numberToWordsINR,
} from './utils/formulaEngine';
import {
  createSalarySlipTemplate,
  createPayrollRegisterTemplate,
  createSalesExpenseChartTemplate,
  createBlankSheet,
} from './utils/templates';
import { RibbonToolbar } from './components/RibbonToolbar';
import { FormulaBar } from './components/FormulaBar';
import { SpreadsheetGrid } from './components/SpreadsheetGrid';
import { SheetTabs } from './components/SheetTabs';
import { ChartModal } from './components/ChartModal';
import { InteractiveChart } from './components/InteractiveChart';
import { SalarySlipGeneratorModal } from './components/SalarySlipGeneratorModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { FindReplaceModal } from './components/FindReplaceModal';
import {
  FileSpreadsheet,
  BarChart3,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

const STORAGE_KEY = 'excelsheet_studio_data_v1';

export default function App() {
  // Initialize sheets (from localStorage or default salary slip + payroll register)
  const [sheets, setSheets] = useState<SheetData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [
      createSalarySlipTemplate('sheet_salary_slip'),
      createPayrollRegisterTemplate('sheet_payroll_register'),
      createSalesExpenseChartTemplate('sheet_sales_tracker'),
    ];
  });

  const [activeSheetId, setActiveSheetId] = useState<string>(sheets[0]?.id || 'sheet_salary_slip');
  const [activeCell, setActiveCell] = useState<CellPosition>({ row: 10, col: 1 }); // B11
  const [selectionRange, setSelectionRange] = useState<CellRange>({
    startRow: 10,
    startCol: 1,
    endRow: 10,
    endCol: 1,
  });

  const [formulaBarValue, setFormulaBarValue] = useState<string>('');
  const [workbookTitle, setWorkbookTitle] = useState<string>('Salary_Slip_Payroll_2026.xlsx');

  // History for Undo/Redo
  const [history, setHistory] = useState<SheetData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Clipboard for copy/cut
  const [clipboard, setClipboard] = useState<{
    cells: Record<string, CellData>;
    range: CellRange;
    isCut?: boolean;
  } | null>(null);

  // Modals
  const [isSalarySlipModalOpen, setIsSalarySlipModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<ChartModel | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [findMatchCount, setFindMatchCount] = useState(0);

  // Chart drawer visibility
  const [isChartDrawerOpen, setIsChartDrawerOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Current active sheet
  const currentSheet = useMemo(() => {
    return sheets.find((s) => s.id === activeSheetId) || sheets[0];
  }, [sheets, activeSheetId]);

  // Current active cell data & style
  const activeKey = toCellKey(activeCell.row, activeCell.col);
  const activeCellData = currentSheet.cells[activeKey];
  const currentStyle: CellStyle = activeCellData?.style || {};

  // Sync formula bar value with active cell
  useEffect(() => {
    const rawVal = activeCellData?.formula || activeCellData?.value || '';
    setFormulaBarValue(rawVal);
  }, [activeCellData, activeKey]);

  // Auto-save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
    } catch {
      // storage quota or private mode
    }
  }, [sheets]);

  // Push state to Undo History
  const pushHistory = useCallback((newSheets: SheetData[]) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newSheets].slice(-30); // max 30 snapshots
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 29));
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevSheets = history[historyIndex - 1];
      setSheets(prevSheets);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextSheets = history[historyIndex + 1];
      setSheets(nextSheets);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Update cell value & formula
  const handleUpdateCell = useCallback((key: string, value: string, formula?: string) => {
    setSheets((prevSheets) => {
      const updated = prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;

        const updatedCells = { ...s.cells };
        const existing = updatedCells[key] || { value: '' };

        if (!value && !formula) {
          // If clearing value, retain formatting but clear contents
          updatedCells[key] = {
            ...existing,
            value: '',
            formula: undefined,
          };
        } else {
          updatedCells[key] = {
            ...existing,
            value,
            formula: formula || (value.startsWith('=') ? value : undefined),
          };
        }

        return { ...s, cells: updatedCells };
      });
      pushHistory(updated);
      return updated;
    });
  }, [activeSheetId, pushHistory]);

  // Apply styling to selected range
  const handleApplyStyle = (partialStyle: Partial<CellStyle>) => {
    const minR = Math.min(selectionRange.startRow, selectionRange.endRow);
    const maxR = Math.max(selectionRange.startRow, selectionRange.endRow);
    const minC = Math.min(selectionRange.startCol, selectionRange.endCol);
    const maxC = Math.max(selectionRange.startCol, selectionRange.endCol);

    setSheets((prevSheets) => {
      const updated = prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newCells = { ...s.cells };

        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const key = toCellKey(r, c);
            const current = newCells[key] || { value: '' };
            newCells[key] = {
              ...current,
              style: {
                ...(current.style || {}),
                ...partialStyle,
              },
            };
          }
        }
        return { ...s, cells: newCells };
      });
      pushHistory(updated);
      return updated;
    });
  };

  // Apply borders
  const handleApplyBorders = (type: 'all' | 'outside' | 'bottom_double' | 'top_bottom' | 'none') => {
    const minR = Math.min(selectionRange.startRow, selectionRange.endRow);
    const maxR = Math.max(selectionRange.startRow, selectionRange.endRow);
    const minC = Math.min(selectionRange.startCol, selectionRange.endCol);
    const maxC = Math.max(selectionRange.startCol, selectionRange.endCol);

    setSheets((prevSheets) => {
      const updated = prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newCells = { ...s.cells };

        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const key = toCellKey(r, c);
            const current = newCells[key] || { value: '' };
            const existingBorders = current.style?.borders || {};
            let newBorders = { ...existingBorders };

            if (type === 'none') {
              newBorders = {};
            } else if (type === 'all') {
              newBorders = {
                top: { style: 'thin', color: '#cbd5e1' },
                bottom: { style: 'thin', color: '#cbd5e1' },
                left: { style: 'thin', color: '#cbd5e1' },
                right: { style: 'thin', color: '#cbd5e1' },
              };
            } else if (type === 'bottom_double') {
              newBorders.bottom = { style: 'double', color: '#0f172a' };
              newBorders.top = { style: 'thin', color: '#0f172a' };
            } else if (type === 'top_bottom') {
              newBorders.top = { style: 'thin', color: '#0f172a' };
              newBorders.bottom = { style: 'thin', color: '#0f172a' };
            } else if (type === 'outside') {
              if (r === minR) newBorders.top = { style: 'medium', color: '#0f172a' };
              if (r === maxR) newBorders.bottom = { style: 'medium', color: '#0f172a' };
              if (c === minC) newBorders.left = { style: 'medium', color: '#0f172a' };
              if (c === maxC) newBorders.right = { style: 'medium', color: '#0f172a' };
            }

            newCells[key] = {
              ...current,
              style: {
                ...(current.style || {}),
                borders: newBorders,
              },
            };
          }
        }
        return { ...s, cells: newCells };
      });
      pushHistory(updated);
      return updated;
    });
  };

  // Merge Cells
  const handleMergeCells = () => {
    const minR = Math.min(selectionRange.startRow, selectionRange.endRow);
    const maxR = Math.max(selectionRange.startRow, selectionRange.endRow);
    const minC = Math.min(selectionRange.startCol, selectionRange.endCol);
    const maxC = Math.max(selectionRange.startCol, selectionRange.endCol);

    if (minR === maxR && minC === maxC) return; // single cell cannot merge

    const primaryKey = toCellKey(minR, minC);
    const colSpan = maxC - minC + 1;
    const rowSpan = maxR - minR + 1;

    setSheets((prevSheets) => {
      const updated = prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newCells = { ...s.cells };
        const primary = newCells[primaryKey] || { value: '' };

        newCells[primaryKey] = {
          ...primary,
          colSpan,
          rowSpan,
          style: {
            ...(primary.style || {}),
            align: 'center',
          },
        };

        // Mark remaining merged children
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            if (r === minR && c === minC) continue;
            const subKey = toCellKey(r, c);
            newCells[subKey] = {
              value: '',
              mergedInto: primaryKey,
            };
          }
        }

        return { ...s, cells: newCells };
      });
      pushHistory(updated);
      return updated;
    });
  };

  // Unmerge Cells
  const handleUnmergeCells = () => {
    const primaryKey = toCellKey(activeCell.row, activeCell.col);
    const primary = currentSheet.cells[primaryKey];
    if (!primary?.colSpan && !primary?.rowSpan) return;

    setSheets((prevSheets) => {
      const updated = prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newCells = { ...s.cells };

        const updatedPrimary = { ...newCells[primaryKey] };
        delete updatedPrimary.colSpan;
        delete updatedPrimary.rowSpan;
        newCells[primaryKey] = updatedPrimary;

        // Clear mergedInto references
        Object.keys(newCells).forEach((k) => {
          if (newCells[k]?.mergedInto === primaryKey) {
            delete newCells[k].mergedInto;
          }
        });

        return { ...s, cells: newCells };
      });
      pushHistory(updated);
      return updated;
    });
  };

  // Insert & Delete Row / Column
  const handleInsertRow = () => {
    const targetRow = activeCell.row;
    setSheets((prevSheets) => {
      const updated = prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newCells: Record<string, CellData> = {};

        Object.entries(s.cells).forEach(([key, cell]) => {
          const parsed = parseCellKey(key);
          if (!parsed) return;
          if (parsed.row >= targetRow) {
            const nextKey = toCellKey(parsed.row + 1, parsed.col);
            newCells[nextKey] = cell;
          } else {
            newCells[key] = cell;
          }
        });

        return { ...s, cells: newCells, rowCount: s.rowCount + 1 };
      });
      pushHistory(updated);
      return updated;
    });
  };

  const handleDeleteRow = () => {
    const targetRow = activeCell.row;
    setSheets((prevSheets) => {
      const updated = prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newCells: Record<string, CellData> = {};

        Object.entries(s.cells).forEach(([key, cell]) => {
          const parsed = parseCellKey(key);
          if (!parsed) return;
          if (parsed.row === targetRow) {
            // Delete
            return;
          } else if (parsed.row > targetRow) {
            const nextKey = toCellKey(parsed.row - 1, parsed.col);
            newCells[nextKey] = cell;
          } else {
            newCells[key] = cell;
          }
        });

        return { ...s, cells: newCells, rowCount: Math.max(10, s.rowCount - 1) };
      });
      pushHistory(updated);
      return updated;
    });
  };

  const handleInsertCol = () => {
    const targetCol = activeCell.col;
    setSheets((prevSheets) => {
      const updated = prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newCells: Record<string, CellData> = {};

        Object.entries(s.cells).forEach(([key, cell]) => {
          const parsed = parseCellKey(key);
          if (!parsed) return;
          if (parsed.col >= targetCol) {
            const nextKey = toCellKey(parsed.row, parsed.col + 1);
            newCells[nextKey] = cell;
          } else {
            newCells[key] = cell;
          }
        });

        return { ...s, cells: newCells, colCount: s.colCount + 1 };
      });
      pushHistory(updated);
      return updated;
    });
  };

  const handleDeleteCol = () => {
    const targetCol = activeCell.col;
    setSheets((prevSheets) => {
      const updated = prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newCells: Record<string, CellData> = {};

        Object.entries(s.cells).forEach(([key, cell]) => {
          const parsed = parseCellKey(key);
          if (!parsed) return;
          if (parsed.col === targetCol) {
            return;
          } else if (parsed.col > targetCol) {
            const nextKey = toCellKey(parsed.row, parsed.col - 1);
            newCells[nextKey] = cell;
          } else {
            newCells[key] = cell;
          }
        });

        return { ...s, cells: newCells, colCount: Math.max(5, s.colCount - 1) };
      });
      pushHistory(updated);
      return updated;
    });
  };

  // AutoSum button handler
  const handleAutoSum = () => {
    const { row, col } = activeCell;
    // Find contiguous range of numbers above active cell
    let startR = row - 1;
    while (startR >= 0) {
      const k = toCellKey(startR, col);
      const val = currentSheet.cells[k]?.value;
      if (!val || isNaN(parseFloat(val.replace(/,/g, '')))) {
        break;
      }
      startR--;
    }
    const sumStartRow = Math.max(0, startR + 1);
    const sumEndRow = Math.max(0, row - 1);
    const startCellKey = toCellKey(sumStartRow, col);
    const endCellKey = toCellKey(sumEndRow, col);

    const formula = `=SUM(${startCellKey}:${endCellKey})`;
    handleUpdateCell(activeKey, '', formula);
  };

  // Column / Row resize
  const handleResizeCol = (colIdx: number, width: number) => {
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId ? { ...s, colWidths: { ...s.colWidths, [colIdx]: width } } : s
      )
    );
  };

  const handleResizeRow = (rowIdx: number, height: number) => {
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId ? { ...s, rowHeights: { ...s.rowHeights, [rowIdx]: height } } : s
      )
    );
  };

  // Auto-Fill Handle Logic
  const handleAutoFill = (sourceRange: CellRange, targetRange: CellRange) => {
    setSheets((prevSheets) => {
      const updated = prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newCells = { ...s.cells };

        // For each cell in targetRange outside sourceRange, copy source pattern
        const srcHeight = sourceRange.endRow - sourceRange.startRow + 1;
        const srcWidth = sourceRange.endCol - sourceRange.startCol + 1;

        for (let r = targetRange.startRow; r <= targetRange.endRow; r++) {
          for (let c = targetRange.startCol; c <= targetRange.endCol; c++) {
            // If already in source, skip
            if (
              r >= sourceRange.startRow &&
              r <= sourceRange.endRow &&
              c >= sourceRange.startCol &&
              c <= sourceRange.endCol
            ) {
              continue;
            }

            const refR = sourceRange.startRow + ((r - sourceRange.startRow) % srcHeight);
            const refC = sourceRange.startCol + ((c - sourceRange.startCol) % srcWidth);
            const refKey = toCellKey(refR, refC);
            const refCell = s.cells[refKey];

            if (refCell) {
              const targetKey = toCellKey(r, c);
              newCells[targetKey] = {
                value: refCell.value,
                formula: refCell.formula,
                style: refCell.style ? { ...refCell.style } : undefined,
              };
            }
          }
        }

        return { ...s, cells: newCells };
      });
      pushHistory(updated);
      return updated;
    });
  };

  // Clipboard operations
  const handleCopy = () => {
    const minR = Math.min(selectionRange.startRow, selectionRange.endRow);
    const maxR = Math.max(selectionRange.startRow, selectionRange.endRow);
    const minC = Math.min(selectionRange.startCol, selectionRange.endCol);
    const maxC = Math.max(selectionRange.startCol, selectionRange.endCol);

    const cellsCopy: Record<string, CellData> = {};
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const k = toCellKey(r, c);
        if (currentSheet.cells[k]) {
          cellsCopy[k] = { ...currentSheet.cells[k] };
        }
      }
    }
    setClipboard({ cells: cellsCopy, range: selectionRange, isCut: false });
  };

  const handleCut = () => {
    handleCopy();
    if (clipboard) {
      setClipboard({ ...clipboard, isCut: true });
    }
  };

  const handlePaste = () => {
    if (!clipboard) return;
    const { startRow: srcStartR, startCol: srcStartC } = clipboard.range;
    const destStartR = activeCell.row;
    const destStartC = activeCell.col;

    setSheets((prevSheets) => {
      const updated = prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newCells = { ...s.cells };

        Object.entries(clipboard.cells).forEach(([oldKey, cellData]) => {
          const parsed = parseCellKey(oldKey);
          if (!parsed) return;
          const deltaR = parsed.row - srcStartR;
          const deltaC = parsed.col - srcStartC;
          const newKey = toCellKey(destStartR + deltaR, destStartC + deltaC);
          newCells[newKey] = { ...cellData };
          if (clipboard.isCut) {
            delete newCells[oldKey];
          }
        });

        return { ...s, cells: newCells };
      });
      pushHistory(updated);
      return updated;
    });

    if (clipboard.isCut) {
      setClipboard(null);
    }
  };

  // Sheet operations
  const handleAddSheet = () => {
    const newId = `sheet_${Date.now()}`;
    const newName = `Sheet ${sheets.length + 1}`;
    const newSheet = createBlankSheet(newId, newName);
    const updated = [...sheets, newSheet];
    setSheets(updated);
    setActiveSheetId(newId);
    pushHistory(updated);
  };

  const handleRenameSheet = (id: string, newName: string) => {
    const updated = sheets.map((s) => (s.id === id ? { ...s, name: newName } : s));
    setSheets(updated);
    pushHistory(updated);
  };

  const handleDeleteSheet = (id: string) => {
    if (sheets.length <= 1) return;
    const updated = sheets.filter((s) => s.id !== id);
    setSheets(updated);
    if (activeSheetId === id) {
      setActiveSheetId(updated[0].id);
    }
    pushHistory(updated);
  };

  // Templates loader
  const handleLoadTemplate = (type: 'salary' | 'payroll' | 'sales' | 'blank') => {
    let newSheet: SheetData;
    const id = `sheet_${Date.now()}`;
    if (type === 'salary') newSheet = createSalarySlipTemplate(id);
    else if (type === 'payroll') newSheet = createPayrollRegisterTemplate(id);
    else if (type === 'sales') newSheet = createSalesExpenseChartTemplate(id);
    else newSheet = createBlankSheet(id, `Sheet ${sheets.length + 1}`);

    const updated = [...sheets, newSheet];
    setSheets(updated);
    setActiveSheetId(id);
    pushHistory(updated);
  };

  // Charts
  const handleSaveChart = (chart: ChartModel) => {
    setSheets((prev) =>
      prev.map((s) => {
        if (s.id !== activeSheetId) return s;
        const exists = s.charts.some((c) => c.id === chart.id);
        const charts = exists
          ? s.charts.map((c) => (c.id === chart.id ? chart : c))
          : [...s.charts, chart];
        return { ...s, charts };
      })
    );
    setIsChartDrawerOpen(true);
  };

  const handleDeleteChart = (chartId: string) => {
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId
          ? { ...s, charts: s.charts.filter((c) => c.id !== chartId) }
          : s
      )
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    let maxR = 0;
    let maxC = 0;
    Object.keys(currentSheet.cells).forEach((k) => {
      const parsed = parseCellKey(k);
      if (parsed) {
        if (parsed.row > maxR) maxR = parsed.row;
        if (parsed.col > maxC) maxC = parsed.col;
      }
    });

    const lines: string[] = [];
    for (let r = 0; r <= maxR; r++) {
      const rowVals: string[] = [];
      for (let c = 0; c <= maxC; c++) {
        const k = toCellKey(r, c);
        const cell = currentSheet.cells[k];
        let val = cell?.value || '';
        if (cell?.formula) {
          try {
            val = evaluateFormula(cell.formula, currentSheet.cells);
          } catch {
            val = '';
          }
        }
        // escape CSV quotes
        rowVals.push(`"${String(val).replace(/"/g, '""')}"`);
      }
      lines.push(rowVals.join(','));
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSheet.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(sheets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workbookTitle.replace('.xlsx', '')}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import File (.csv or .json)
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSheets(parsed);
            setActiveSheetId(parsed[0].id);
            pushHistory(parsed);
          }
        } else if (file.name.endsWith('.csv')) {
          // Parse CSV
          const rows = content.split('\n').map((row) =>
            row.split(',').map((cell) => cell.replace(/^"(.*)"$/, '$1').trim())
          );
          const newSheet = createBlankSheet(`sheet_${Date.now()}`, file.name.replace('.csv', ''));
          rows.forEach((row, rIdx) => {
            row.forEach((val, cIdx) => {
              if (val) {
                const k = toCellKey(rIdx, cIdx);
                newSheet.cells[k] = { value: val };
              }
            });
          });
          newSheet.rowCount = Math.max(50, rows.length + 10);
          newSheet.colCount = Math.max(26, Math.max(...rows.map((r) => r.length)) + 5);

          const updated = [...sheets, newSheet];
          setSheets(updated);
          setActiveSheetId(newSheet.id);
          pushHistory(updated);
        }
      } catch (err) {
        console.error('Failed to import file:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Find & Replace
  const handleFind = (query: string, matchCase: boolean) => {
    const q = matchCase ? query : query.toLowerCase();
    let matches = 0;
    let firstMatch: CellPosition | null = null;

    for (const [key, cell] of Object.entries(currentSheet.cells)) {
      const cellVal = cell.value || '';
      const text = matchCase ? cellVal : cellVal.toLowerCase();
      if (text.includes(q)) {
        matches++;
        if (!firstMatch) {
          const pos = parseCellKey(key);
          if (pos) firstMatch = pos;
        }
      }
    }

    setFindMatchCount(matches);
    if (firstMatch) {
      const targetPos: CellPosition = firstMatch;
      setActiveCell(targetPos);
      setSelectionRange({
        startRow: targetPos.row,
        startCol: targetPos.col,
        endRow: targetPos.row,
        endCol: targetPos.col,
      });
    }
  };

  const handleReplace = (
    findText: string,
    replaceText: string,
    replaceAll: boolean,
    matchCase: boolean
  ) => {
    setSheets((prevSheets) => {
      const updated = prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newCells = { ...s.cells };
        const q = matchCase ? findText : findText.toLowerCase();

        let replacedOne = false;
        Object.entries(newCells).forEach(([key, cell]) => {
          if (!cell.value) return;
          if (!replaceAll && replacedOne) return;

          const cellVal = cell.value;
          const text = matchCase ? cellVal : cellVal.toLowerCase();

          if (text.includes(q)) {
            const regex = new RegExp(findText, matchCase ? 'g' : 'gi');
            newCells[key] = {
              ...cell,
              value: cellVal.replace(regex, replaceText),
            };
            replacedOne = true;
          }
        });

        return { ...s, cells: newCells };
      });
      pushHistory(updated);
      return updated;
    });
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const selectedRangeStr = `${toCellKey(
    Math.min(selectionRange.startRow, selectionRange.endRow),
    Math.min(selectionRange.startCol, selectionRange.endCol)
  )}:${toCellKey(
    Math.max(selectionRange.startRow, selectionRange.endRow),
    Math.max(selectionRange.startCol, selectionRange.endCol)
  )}`;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* 1. Desktop Excel Top Title Bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-emerald-900 text-white select-none">
        {/* Brand Wordmark & Document Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-emerald-600 flex items-center justify-center font-bold text-white shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight">ExcelSheet Studio</span>
          </div>

          <div className="h-4 w-px bg-emerald-700/60" />

          {/* Document Title (Editable input) */}
          <input
            type="text"
            value={workbookTitle}
            onChange={(e) => setWorkbookTitle(e.target.value)}
            className="text-xs bg-emerald-800/60 hover:bg-emerald-800 focus:bg-emerald-800 text-white font-medium px-2 py-0.5 rounded border border-transparent focus:border-emerald-400 outline-none w-60"
            title="Click to rename document"
          />
        </div>

        {/* Top Bar Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSalarySlipModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 rounded text-xs font-semibold shadow-2xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Salary Slip Wizard</span>
          </button>

          <button
            onClick={() => {
              setEditingChart(null);
              setIsChartModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 rounded text-xs font-semibold transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>New Chart</span>
          </button>

          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* 2. Ribbon Toolbar */}
      <RibbonToolbar
        currentStyle={currentStyle}
        onApplyStyle={handleApplyStyle}
        onApplyBorders={handleApplyBorders}
        onMergeCells={handleMergeCells}
        onUnmergeCells={handleUnmergeCells}
        canMerge={
          selectionRange.startRow !== selectionRange.endRow ||
          selectionRange.startCol !== selectionRange.endCol
        }
        isMerged={Boolean(activeCellData?.colSpan || activeCellData?.rowSpan)}
        onInsertRow={handleInsertRow}
        onDeleteRow={handleDeleteRow}
        onInsertCol={handleInsertCol}
        onDeleteCol={handleDeleteCol}
        onAutoSum={handleAutoSum}
        onOpenSalarySlipWizard={() => setIsSalarySlipModalOpen(true)}
        onOpenChartModal={() => {
          setEditingChart(null);
          setIsChartModalOpen(true);
        }}
        onOpenFindReplace={() => setIsFindReplaceOpen(true)}
        onOpenPrintPreview={() => setIsPrintPreviewOpen(true)}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onImportFile={handleImportFile}
        onLoadTemplate={handleLoadTemplate}
        showGridLines={currentSheet.showGridLines}
        onToggleGridLines={() => {
          setSheets((prev) =>
            prev.map((s) =>
              s.id === activeSheetId ? { ...s, showGridLines: !s.showGridLines } : s
            )
          );
        }}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
      />

      {/* 3. Formula Bar */}
      <FormulaBar
        activeCellKey={activeKey}
        formulaValue={formulaBarValue}
        onFormulaChange={(val) => {
          setFormulaBarValue(val);
          // live preview in active cell
          handleUpdateCell(activeKey, val);
        }}
        onFormulaCommit={() => {
          handleUpdateCell(activeKey, formulaBarValue);
        }}
        onFormulaCancel={() => {
          setFormulaBarValue(activeCellData?.formula || activeCellData?.value || '');
        }}
      />

      {/* 4. Central Grid Workspace + Interactive Charts Split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Spreadsheet Grid */}
        <SpreadsheetGrid
          sheet={currentSheet}
          activeCell={activeCell}
          selectionRange={selectionRange}
          onSelectCell={setActiveCell}
          onSelectRange={setSelectionRange}
          onUpdateCell={handleUpdateCell}
          onResizeCol={handleResizeCol}
          onResizeRow={handleResizeRow}
          onAutoFill={handleAutoFill}
          formulaBarValue={formulaBarValue}
        />

        {/* Side / Bottom Chart Panel (When sheet has charts) */}
        {currentSheet.charts.length > 0 && (
          <aside
            className={`transition-all duration-300 border-l border-slate-300 bg-slate-50 flex flex-col shadow-lg z-20 ${
              isChartDrawerOpen ? 'w-full md:w-[480px]' : 'w-10'
            }`}
          >
            {/* Drawer Header Toggle */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-200 border-b border-slate-300">
              {isChartDrawerOpen ? (
                <>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-slate-800">
                      Charts &amp; Visuals ({currentSheet.charts.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingChart(null);
                        setIsChartModalOpen(true);
                      }}
                      className="px-2 py-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded"
                    >
                      + Add Chart
                    </button>
                    <button
                      onClick={() => setIsChartDrawerOpen(false)}
                      className="p-1 text-slate-500 hover:text-slate-800"
                      title="Collapse charts"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setIsChartDrawerOpen(true)}
                  className="w-full flex flex-col items-center py-2 text-slate-600 hover:text-emerald-700"
                  title="Expand charts"
                >
                  <BarChart3 className="w-4 h-4 mb-2" />
                  <span className="text-[10px] font-bold vertical-text uppercase tracking-wider">Charts</span>
                </button>
              )}
            </div>

            {/* Charts List Container */}
            {isChartDrawerOpen && (
              <div className="p-3 overflow-y-auto flex-1 space-y-4">
                {currentSheet.charts.map((chart) => (
                  <InteractiveChart
                    key={chart.id}
                    chart={chart}
                    sheet={currentSheet}
                    onDeleteChart={handleDeleteChart}
                    onEditChart={(c) => {
                      setEditingChart(c);
                      setIsChartModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* 5. Bottom Sheet Tabs Bar & Status Bar */}
      <SheetTabs
        sheets={sheets}
        activeSheetId={activeSheetId}
        onSelectSheet={setActiveSheetId}
        onAddSheet={handleAddSheet}
        onRenameSheet={handleRenameSheet}
        onDeleteSheet={handleDeleteSheet}
        selectionRange={selectionRange}
        currentSheet={currentSheet}
      />

      {/* MODALS */}
      {/* 1. Salary Slip Generator Wizard */}
      <SalarySlipGeneratorModal
        isOpen={isSalarySlipModalOpen}
        onClose={() => setIsSalarySlipModalOpen(false)}
        onApplyToSheet={(newSheet) => {
          const updated = [...sheets, newSheet];
          setSheets(updated);
          setActiveSheetId(newSheet.id);
          pushHistory(updated);
        }}
        onDirectPrint={() => {
          setIsSalarySlipModalOpen(false);
          setIsPrintPreviewOpen(true);
        }}
      />

      {/* 2. Chart Creator & Customizer Modal */}
      <ChartModal
        isOpen={isChartModalOpen}
        onClose={() => {
          setIsChartModalOpen(false);
          setEditingChart(null);
        }}
        onSaveChart={handleSaveChart}
        initialChart={editingChart}
        selectedRangeStr={selectedRangeStr}
        sheet={currentSheet}
      />

      {/* 3. Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        sheet={currentSheet}
      />

      {/* 4. Find & Replace Modal */}
      <FindReplaceModal
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        onFind={handleFind}
        onReplace={handleReplace}
        matchCount={findMatchCount}
      />
    </div>
  );
}

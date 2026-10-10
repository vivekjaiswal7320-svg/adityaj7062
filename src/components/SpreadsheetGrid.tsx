/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SheetData, CellData, CellPosition, CellRange } from '../types/spreadsheet';
import {
  indexToCol,
  toCellKey,
  parseCellKey,
  evaluateFormula,
  formatCellValue,
} from '../utils/formulaEngine';

interface SpreadsheetGridProps {
  sheet: SheetData;
  activeCell: CellPosition;
  selectionRange: CellRange;
  onSelectCell: (pos: CellPosition) => void;
  onSelectRange: (range: CellRange) => void;
  onUpdateCell: (key: string, value: string, formula?: string) => void;
  onResizeCol: (colIdx: number, width: number) => void;
  onResizeRow: (rowIdx: number, height: number) => void;
  onAutoFill: (sourceRange: CellRange, targetRange: CellRange) => void;
  formulaBarValue: string;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  sheet,
  activeCell,
  selectionRange,
  onSelectCell,
  onSelectRange,
  onUpdateCell,
  onResizeCol,
  onResizeRow,
  onAutoFill,
}) => {
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [isAutoFilling, setIsAutoFilling] = useState<boolean>(false);
  const [autoFillTarget, setAutoFillTarget] = useState<CellPosition | null>(null);

  // Column / Row resize state
  const [resizingCol, setResizingCol] = useState<{ index: number; startX: number; startWidth: number } | null>(null);
  const [resizingRow, setResizingRow] = useState<{ index: number; startY: number; startHeight: number } | null>(null);

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const activeKey = toCellKey(activeCell.row, activeCell.col);

  // Focus inline editor when editing
  useEffect(() => {
    if (editingCell && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [editingCell]);

  // Start inline editing
  const startEditing = useCallback((pos: CellPosition, initialChar?: string) => {
    const key = toCellKey(pos.row, pos.col);
    const cell = sheet.cells[key];
    const initialVal = initialChar !== undefined ? initialChar : (cell?.formula || cell?.value || '');
    setEditingCell(pos);
    setEditValue(initialVal);
  }, [sheet.cells]);

  // Commit editing
  const commitEditing = useCallback((moveDirection?: 'down' | 'right') => {
    if (!editingCell) return;
    const key = toCellKey(editingCell.row, editingCell.col);
    const isFormula = editValue.startsWith('=');
    onUpdateCell(key, editValue, isFormula ? editValue : undefined);
    setEditingCell(null);

    if (moveDirection === 'down' && editingCell.row < sheet.rowCount - 1) {
      const nextPos = { row: editingCell.row + 1, col: editingCell.col };
      onSelectCell(nextPos);
      onSelectRange({ startRow: nextPos.row, startCol: nextPos.col, endRow: nextPos.row, endCol: nextPos.col });
    } else if (moveDirection === 'right' && editingCell.col < sheet.colCount - 1) {
      const nextPos = { row: editingCell.row, col: editingCell.col + 1 };
      onSelectCell(nextPos);
      onSelectRange({ startRow: nextPos.row, startCol: nextPos.col, endRow: nextPos.row, endCol: nextPos.col });
    }
  }, [editingCell, editValue, sheet.rowCount, sheet.colCount, onUpdateCell, onSelectCell, onSelectRange]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingCell(null);
  }, []);

  // Global mouseup listener for dragging selection & auto-fill & resizers
  useEffect(() => {
    const handleMouseUp = () => {
      if (isSelecting) {
        setIsSelecting(false);
      }
      if (isAutoFilling && autoFillTarget) {
        setIsAutoFilling(false);
        const sourceRange = { ...selectionRange };
        const targetRange = {
          startRow: Math.min(selectionRange.startRow, autoFillTarget.row),
          startCol: Math.min(selectionRange.startCol, autoFillTarget.col),
          endRow: Math.max(selectionRange.endRow, autoFillTarget.row),
          endCol: Math.max(selectionRange.endCol, autoFillTarget.col),
        };
        onAutoFill(sourceRange, targetRange);
        setAutoFillTarget(null);
      }
      if (resizingCol) setResizingCol(null);
      if (resizingRow) setResizingRow(null);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (resizingCol) {
        const delta = e.clientX - resizingCol.startX;
        const newWidth = Math.max(40, resizingCol.startWidth + delta);
        onResizeCol(resizingCol.index, newWidth);
      }
      if (resizingRow) {
        const delta = e.clientY - resizingRow.startY;
        const newHeight = Math.max(18, resizingRow.startHeight + delta);
        onResizeRow(resizingRow.index, newHeight);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isSelecting, isAutoFilling, autoFillTarget, selectionRange, resizingCol, resizingRow, onAutoFill, onResizeCol, onResizeRow]);

  // Handle cell click
  const handleCellMouseDown = (row: number, col: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    // Check if cell is merged into another
    const key = toCellKey(row, col);
    const cell = sheet.cells[key];
    let targetRow = row;
    let targetCol = col;
    if (cell?.mergedInto) {
      const parsed = parseCellKey(cell.mergedInto);
      if (parsed) {
        targetRow = parsed.row;
        targetCol = parsed.col;
      }
    }

    if (editingCell) {
      commitEditing();
    }

    if (e.shiftKey) {
      // Expand selection range
      onSelectRange({
        startRow: selectionRange.startRow,
        startCol: selectionRange.startCol,
        endRow: targetRow,
        endCol: targetCol,
      });
    } else {
      onSelectCell({ row: targetRow, col: targetCol });
      onSelectRange({
        startRow: targetRow,
        startCol: targetCol,
        endRow: targetRow,
        endCol: targetCol,
      });
      setIsSelecting(true);
    }
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (isSelecting) {
      onSelectRange({
        startRow: activeCell.row,
        startCol: activeCell.col,
        endRow: row,
        endCol: col,
      });
    } else if (isAutoFilling) {
      setAutoFillTarget({ row, col });
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEditing('down');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEditing('right');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      }
      return;
    }

    const { row, col } = activeCell;

    if (e.key === 'ArrowUp' && row > 0) {
      e.preventDefault();
      const nPos = { row: row - 1, col };
      onSelectCell(nPos);
      onSelectRange({ startRow: nPos.row, startCol: nPos.col, endRow: nPos.row, endCol: nPos.col });
    } else if (e.key === 'ArrowDown' && row < sheet.rowCount - 1) {
      e.preventDefault();
      const nPos = { row: row + 1, col };
      onSelectCell(nPos);
      onSelectRange({ startRow: nPos.row, startCol: nPos.col, endRow: nPos.row, endCol: nPos.col });
    } else if (e.key === 'ArrowLeft' && col > 0) {
      e.preventDefault();
      const nPos = { row, col: col - 1 };
      onSelectCell(nPos);
      onSelectRange({ startRow: nPos.row, startCol: nPos.col, endRow: nPos.row, endCol: nPos.col });
    } else if (e.key === 'ArrowRight' && col < sheet.colCount - 1) {
      e.preventDefault();
      const nPos = { row, col: col + 1 };
      onSelectCell(nPos);
      onSelectRange({ startRow: nPos.row, startCol: nPos.col, endRow: nPos.row, endCol: nPos.col });
    } else if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault();
      startEditing(activeCell);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      // Clear contents of selected range
      const minR = Math.min(selectionRange.startRow, selectionRange.endRow);
      const maxR = Math.max(selectionRange.startRow, selectionRange.endRow);
      const minC = Math.min(selectionRange.startCol, selectionRange.endCol);
      const maxC = Math.max(selectionRange.startCol, selectionRange.endCol);

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const k = toCellKey(r, c);
          onUpdateCell(k, '');
        }
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Start typing directly into active cell
      startEditing(activeCell, e.key);
    }
  };

  // Check if cell is in selection range
  const isCellSelected = (r: number, c: number) => {
    const minR = Math.min(selectionRange.startRow, selectionRange.endRow);
    const maxR = Math.max(selectionRange.startRow, selectionRange.endRow);
    const minC = Math.min(selectionRange.startCol, selectionRange.endCol);
    const maxC = Math.max(selectionRange.startCol, selectionRange.endCol);
    return r >= minR && r <= maxR && c >= minC && c <= maxC;
  };

  const isSelectionCorner = (r: number, c: number) => {
    const maxR = Math.max(selectionRange.startRow, selectionRange.endRow);
    const maxC = Math.max(selectionRange.startCol, selectionRange.endCol);
    return r === maxR && c === maxC;
  };

  return (
    <div
      ref={gridContainerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex-1 overflow-auto outline-none bg-slate-200 select-none relative"
      style={{ willChange: 'scroll-position' }}
    >
      <table className="border-separate border-spacing-0 bg-white min-w-full text-xs font-sans">
        {/* Sticky Header Row */}
        <thead>
          <tr className="sticky top-0 z-30 bg-slate-100 shadow-2xs">
            {/* Top-Left Select All Corner */}
            <th
              onClick={() => {
                onSelectRange({
                  startRow: 0,
                  startCol: 0,
                  endRow: sheet.rowCount - 1,
                  endCol: sheet.colCount - 1,
                });
              }}
              className="sticky left-0 top-0 z-40 w-11 min-w-[44px] h-6 bg-slate-200 border-r border-b border-slate-300 cursor-pointer hover:bg-slate-300 transition-colors"
            >
              <div className="w-2.5 h-2.5 mx-auto border-r border-b border-slate-500" />
            </th>

            {/* Column Headers (A, B, C...) */}
            {Array.from({ length: sheet.colCount }).map((_, cIdx) => {
              const colWidth = sheet.colWidths[cIdx] || 100;
              const isColActive = activeCell.col === cIdx;

              return (
                <th
                  key={`col-hdr-${cIdx}`}
                  style={{ width: `${colWidth}px`, minWidth: `${colWidth}px` }}
                  onClick={() => {
                    onSelectRange({
                      startRow: 0,
                      startCol: cIdx,
                      endRow: sheet.rowCount - 1,
                      endCol: cIdx,
                    });
                    onSelectCell({ row: 0, col: cIdx });
                  }}
                  className={`relative px-2 py-1 text-center font-semibold text-[11px] border-r border-b border-slate-300 font-mono tracking-wider cursor-pointer hover:bg-slate-200 select-none transition-colors ${
                    isColActive ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{indexToCol(cIdx)}</span>
                  {/* Resize Divider Drag Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizingCol({
                        index: cIdx,
                        startX: e.clientX,
                        startWidth: colWidth,
                      });
                    }}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500 z-10"
                  />
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Table Body (Rows 1..N) */}
        <tbody>
          {Array.from({ length: sheet.rowCount }).map((_, rIdx) => {
            const rowHeight = sheet.rowHeights[rIdx] || 24;
            const isRowActive = activeCell.row === rIdx;

            return (
              <tr key={`row-${rIdx}`} style={{ height: `${rowHeight}px` }}>
                {/* Row Header (1, 2, 3...) */}
                <td
                  onClick={() => {
                    onSelectRange({
                      startRow: rIdx,
                      startCol: 0,
                      endRow: rIdx,
                      endCol: sheet.colCount - 1,
                    });
                    onSelectCell({ row: rIdx, col: 0 });
                  }}
                  className={`sticky left-0 z-20 w-11 min-w-[44px] px-2 py-0.5 text-center text-[10px] font-mono font-medium border-r border-b border-slate-300 cursor-pointer hover:bg-slate-200 transition-colors ${
                    isRowActive ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span>{rIdx + 1}</span>
                  {/* Row Resize Drag Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizingRow({
                        index: rIdx,
                        startY: e.clientY,
                        startHeight: rowHeight,
                      });
                    }}
                    className="absolute left-0 right-0 bottom-0 h-1.5 cursor-row-resize hover:bg-emerald-500 z-10"
                  />
                </td>

                {/* Cells in Row */}
                {Array.from({ length: sheet.colCount }).map((_, cIdx) => {
                  const key = toCellKey(rIdx, cIdx);
                  const cell = sheet.cells[key];

                  // Skip rendering child of merged cell
                  if (cell?.mergedInto) {
                    return null;
                  }

                  const isActive = activeCell.row === rIdx && activeCell.col === cIdx;
                  const isSelected = isCellSelected(rIdx, cIdx);
                  const isCorner = isSelectionCorner(rIdx, cIdx);
                  const isEditingThis = editingCell?.row === rIdx && editingCell?.col === cIdx;

                  // Evaluate display value
                  let displayVal = cell?.value ?? '';
                  if (cell?.formula) {
                    try {
                      displayVal = evaluateFormula(cell.formula, sheet.cells);
                    } catch {
                      displayVal = '#VALUE!';
                    }
                  }

                  // Number formatting
                  if (cell?.style?.format) {
                    displayVal = formatCellValue(displayVal, cell.style.format, cell.style.decimals ?? 2);
                  }

                  const st = cell?.style || {};

                  // Borders inline style
                  const borderTopStyle = st.borders?.top
                    ? `${st.borders.top.style === 'double' ? '3px double' : '1px solid'} ${st.borders.top.color || '#334155'}`
                    : undefined;
                  const borderBottomStyle = st.borders?.bottom
                    ? `${st.borders.bottom.style === 'double' ? '3px double' : '1px solid'} ${st.borders.bottom.color || '#334155'}`
                    : undefined;
                  const borderLeftStyle = st.borders?.left
                    ? `1px solid ${st.borders.left.color || '#334155'}`
                    : undefined;
                  const borderRightStyle = st.borders?.right
                    ? `1px solid ${st.borders.right.color || '#334155'}`
                    : undefined;

                  return (
                    <td
                      key={`cell-${rIdx}-${cIdx}`}
                      colSpan={cell?.colSpan || 1}
                      rowSpan={cell?.rowSpan || 1}
                      onMouseDown={(e) => handleCellMouseDown(rIdx, cIdx, e)}
                      onMouseEnter={() => handleCellMouseEnter(rIdx, cIdx)}
                      onDoubleClick={() => startEditing({ row: rIdx, col: cIdx })}
                      style={{
                        width: `${sheet.colWidths[cIdx] || 100}px`,
                        fontWeight: st.bold ? 700 : 400,
                        fontStyle: st.italic ? 'italic' : 'normal',
                        textDecoration: st.underline ? 'underline' : 'none',
                        color: st.color || '#0f172a',
                        backgroundColor: isEditingThis
                          ? '#ffffff'
                          : isSelected && !isActive
                          ? '#ecfdf5' // soft emerald selection tint
                          : st.backgroundColor || '#ffffff',
                        textAlign: st.align || 'left',
                        verticalAlign: st.vAlign || 'middle',
                        fontSize: `${st.fontSize || 11}px`,
                        fontFamily: st.fontFamily || 'inherit',
                        borderTop: borderTopStyle,
                        borderBottom: borderBottomStyle,
                        borderLeft: borderLeftStyle,
                        borderRight: borderRightStyle,
                      }}
                      className={`relative px-2 py-1 select-none overflow-hidden text-ellipsis whitespace-nowrap transition-colors ${
                        sheet.showGridLines ? 'border-r border-b border-slate-200' : ''
                      } ${
                        isActive
                          ? 'ring-2 ring-emerald-600 ring-inset z-20'
                          : isSelected
                          ? 'ring-1 ring-emerald-400 ring-inset'
                          : ''
                      }`}
                    >
                      {isEditingThis ? (
                        <input
                          ref={inlineInputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commitEditing()}
                          className="absolute inset-0 w-full h-full px-2 py-0.5 text-xs text-slate-900 bg-white border-2 border-emerald-600 outline-none z-30 font-sans"
                        />
                      ) : (
                        <span className={st.format === 'number' || st.format === 'currency_inr' || st.format === 'currency_usd' ? 'font-mono tabular-nums' : ''}>
                          {displayVal}
                        </span>
                      )}

                      {/* Auto-Fill Drag Handle (Bottom Right Corner) */}
                      {isActive && !isEditingThis && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsAutoFilling(true);
                          }}
                          className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-700 border border-white cursor-crosshair z-30 hover:scale-125 transition-transform"
                          title="Drag to auto-fill"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

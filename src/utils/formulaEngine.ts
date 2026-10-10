/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CellData, NumberFormatType } from '../types/spreadsheet';

/** Convert 0-based column index to letter e.g. 0 -> "A", 25 -> "Z", 26 -> "AA" */
export function indexToCol(index: number): string {
  let col = '';
  let temp = index;
  while (temp >= 0) {
    col = String.fromCharCode((temp % 26) + 65) + col;
    temp = Math.floor(temp / 26) - 1;
  }
  return col;
}

/** Convert column letter to 0-based column index e.g. "A" -> 0, "AA" -> 26 */
export function colToIndex(colStr: string): number {
  let result = 0;
  const upper = colStr.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    result = result * 26 + (upper.charCodeAt(i) - 64);
  }
  return result - 1;
}

/** Format row and col into cell key e.g. (0, 0) -> "A1" */
export function toCellKey(row: number, col: number): string {
  return `${indexToCol(col)}${row + 1}`;
}

/** Parse cell key e.g. "B4" -> { row: 3, col: 1 } */
export function parseCellKey(key: string): { row: number; col: number } | null {
  const match = key.trim().toUpperCase().match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return null;
  const col = colToIndex(match[1]);
  const row = parseInt(match[2], 10) - 1;
  if (isNaN(row) || isNaN(col) || row < 0 || col < 0) return null;
  return { row, col };
}

/** Parse range string e.g. "A1:C5" or single cell "B2" */
export function parseRange(rangeStr: string): {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
} | null {
  const parts = rangeStr.trim().toUpperCase().split(':');
  if (parts.length === 1) {
    const parsed = parseCellKey(parts[0]);
    if (!parsed) return null;
    return {
      startRow: parsed.row,
      startCol: parsed.col,
      endRow: parsed.row,
      endCol: parsed.col,
    };
  }
  if (parts.length === 2) {
    const p1 = parseCellKey(parts[0]);
    const p2 = parseCellKey(parts[1]);
    if (!p1 || !p2) return null;
    return {
      startRow: Math.min(p1.row, p2.row),
      startCol: Math.min(p1.col, p2.col),
      endRow: Math.max(p1.row, p2.row),
      endCol: Math.max(p1.col, p2.col),
    };
  }
  return null;
}

/**
 * Format numeric value according to standard spreadsheet formatting
 */
export function formatCellValue(
  rawVal: string | number,
  format?: NumberFormatType,
  decimals: number = 2
): string {
  if (rawVal === null || rawVal === undefined || rawVal === '') return '';
  const str = String(rawVal);
  if (str.startsWith('#')) return str; // Error code like #REF!

  const num = typeof rawVal === 'number' ? rawVal : parseFloat(str.replace(/,/g, ''));
  const isNumeric = !isNaN(num) && isFinite(num) && /^-?\d+(\.\d+)?$/.test(str.replace(/,/g, '').trim());

  if (!isNumeric) {
    return str;
  }

  switch (format) {
    case 'currency_inr': {
      // Indian Rupee formatting (e.g. ₹ 1,23,456.00)
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    }
    case 'currency_usd': {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    }
    case 'percent': {
      return (num * 100).toFixed(decimals) + '%';
    }
    case 'number': {
      return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    }
    case 'date': {
      try {
        const d = new Date(rawVal);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
        }
      } catch {
        // fallback
      }
      return str;
    }
    case 'text':
    case 'general':
    default:
      return str;
  }
}

/**
 * Evaluates formula with full cell reference resolution
 */
export function evaluateFormula(
  formula: string,
  cells: Record<string, CellData>,
  visited: Set<string> = new Set()
): string {
  if (!formula.startsWith('=')) return formula;

  const expression = formula.substring(1).trim();

  // Helper to get raw numeric/string value from a cell key
  const getCellValue = (key: string): number | string => {
    const cleanKey = key.trim().toUpperCase();
    if (visited.has(cleanKey)) {
      throw new Error('#CYCLE!');
    }
    const cell = cells[cleanKey];
    if (!cell) return 0;

    if (cell.formula && cell.formula.startsWith('=')) {
      const subVisited = new Set(visited);
      subVisited.add(cleanKey);
      const res = evaluateFormula(cell.formula, cells, subVisited);
      const parsedNum = parseFloat(res.replace(/,/g, ''));
      return isNaN(parsedNum) ? res : parsedNum;
    }

    const val = cell.value || '';
    const parsedNum = parseFloat(val.replace(/,/g, ''));
    return isNaN(parsedNum) ? val : parsedNum;
  };

  // Helper to extract numbers from range or list
  const getValuesFromRange = (rangeToken: string): number[] => {
    const values: number[] = [];
    const parts = rangeToken.split(',').map((p) => p.trim());

    for (const part of parts) {
      if (part.includes(':')) {
        const parsed = parseRange(part);
        if (parsed) {
          for (let r = parsed.startRow; r <= parsed.endRow; r++) {
            for (let c = parsed.startCol; c <= parsed.endCol; c++) {
              const k = toCellKey(r, c);
              const val = getCellValue(k);
              if (typeof val === 'number') {
                values.push(val);
              } else {
                const n = parseFloat(String(val).replace(/,/g, ''));
                if (!isNaN(n)) values.push(n);
              }
            }
          }
        }
      } else {
        // Single cell or literal number
        const cellPos = parseCellKey(part);
        if (cellPos) {
          const val = getCellValue(part);
          const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
          if (!isNaN(n)) values.push(n);
        } else {
          const n = parseFloat(part);
          if (!isNaN(n)) values.push(n);
        }
      }
    }
    return values;
  };

  try {
    // 1. Process Built-in Functions
    // Function pattern: NAME(...)
    const funcRegex = /([A-Z]+)\(([^()]+)\)/gi;
    let processed = expression;

    let iterations = 0;
    while (funcRegex.test(processed) && iterations < 15) {
      iterations++;
      processed = processed.replace(funcRegex, (_, fnName: string, argsStr: string) => {
        const fn = fnName.toUpperCase();
        const nums = getValuesFromRange(argsStr);

        switch (fn) {
          case 'SUM': {
            const sum = nums.reduce((a, b) => a + b, 0);
            return String(sum);
          }
          case 'AVERAGE':
          case 'AVG': {
            if (nums.length === 0) return '0';
            const sum = nums.reduce((a, b) => a + b, 0);
            return String(sum / nums.length);
          }
          case 'COUNT': {
            return String(nums.length);
          }
          case 'MAX': {
            return nums.length ? String(Math.max(...nums)) : '0';
          }
          case 'MIN': {
            return nums.length ? String(Math.min(...nums)) : '0';
          }
          case 'PRODUCT': {
            if (nums.length === 0) return '0';
            const prod = nums.reduce((a, b) => a * b, 1);
            return String(prod);
          }
          case 'ROUND': {
            const args = argsStr.split(',').map((a) => a.trim());
            const num = parseFloat(args[0]) || 0;
            const decimals = parseInt(args[1], 10) || 0;
            return num.toFixed(decimals);
          }
          case 'IF': {
            const args = argsStr.split(',').map((a) => a.trim());
            const condStr = args[0];
            const thenVal = args[1] ? args[1].replace(/^["']|["']$/g, '') : '';
            const elseVal = args[2] ? args[2].replace(/^["']|["']$/g, '') : '';
            // Simple comparison support >, <, >=, <=, =, ==
            let condMet = false;
            if (condStr.includes('>=')) {
              const [l, r] = condStr.split('>=').map(Number);
              condMet = l >= r;
            } else if (condStr.includes('<=')) {
              const [l, r] = condStr.split('<=').map(Number);
              condMet = l <= r;
            } else if (condStr.includes('>')) {
              const [l, r] = condStr.split('>').map(Number);
              condMet = l > r;
            } else if (condStr.includes('<')) {
              const [l, r] = condStr.split('<').map(Number);
              condMet = l < r;
            } else if (condStr.includes('=')) {
              const [l, r] = condStr.split('=').map((s) => s.trim());
              condMet = l === r;
            } else {
              condMet = Boolean(Number(condStr));
            }
            return condMet ? thenVal : elseVal;
          }
          case 'CONCAT': {
            const args = argsStr.split(',').map((a) => {
              const trimmed = a.trim();
              if (parseCellKey(trimmed)) {
                return String(getCellValue(trimmed));
              }
              return trimmed.replace(/^["']|["']$/g, '');
            });
            return args.join('');
          }
          default:
            return '0';
        }
      });
    }

    // 2. Replace any remaining cell references (e.g. A1 + B2 * 10)
    const cellRefRegex = /\b([A-Z]+[0-9]+)\b/g;
    processed = processed.replace(cellRefRegex, (cellKey) => {
      const val = getCellValue(cellKey);
      if (typeof val === 'number') return String(val);
      const parsed = parseFloat(String(val).replace(/,/g, ''));
      return isNaN(parsed) ? `"${val}"` : String(parsed);
    });

    // 3. Safe arithmetic calculation
    // Validate that characters are safe for math evaluation
    if (/^[0-9+\-*/().\s%^]+$/.test(processed)) {
      // Replace % with /100 and ^ with **
      let sanitized = processed.replace(/%/g, '/100').replace(/\^/g, '**');
      // eslint-disable-next-line no-new-func
      const calcResult = Function(`"use strict"; return (${sanitized});`)();
      if (typeof calcResult === 'number' && !isNaN(calcResult) && isFinite(calcResult)) {
        return Number.isInteger(calcResult) ? String(calcResult) : calcResult.toFixed(2);
      }
    }

    return processed.replace(/^["']|["']$/g, '');
  } catch (err: unknown) {
    if (err instanceof Error && err.message === '#CYCLE!') {
      return '#CYCLE!';
    }
    return '#VALUE!';
  }
}

/**
 * Convert Indian Rupee numbers to formal words (Essential for Indian Salary Slips & Invoices)
 * e.g. 72500 -> "Rupees Seventy-Two Thousand Five Hundred Only"
 */
export function numberToWordsINR(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertTwoDigits = (num: number): string => {
    if (num === 0) return '';
    if (num < 10) return singleDigits[num];
    if (num < 20) return teens[num - 10];
    const unit = num % 10;
    return `${tens[Math.floor(num / 10)]}${unit ? '-' + singleDigits[unit] : ''}`;
  };

  const convertThreeDigits = (num: number): string => {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    let str = '';
    if (hundred > 0) {
      str += `${singleDigits[hundred]} Hundred`;
      if (remainder > 0) str += ' and ';
    }
    if (remainder > 0) {
      str += convertTwoDigits(remainder);
    }
    return str;
  };

  let num = Math.floor(Math.abs(amount));
  let words = '';

  const crores = Math.floor(num / 10000000);
  num %= 10000000;

  const lakhs = Math.floor(num / 100000);
  num %= 100000;

  const thousands = Math.floor(num / 1000);
  num %= 1000;

  const hundreds = num;

  if (crores > 0) {
    words += `${convertTwoDigits(crores)} Crore `;
  }
  if (lakhs > 0) {
    words += `${convertTwoDigits(lakhs)} Lakh `;
  }
  if (thousands > 0) {
    words += `${convertTwoDigits(thousands)} Thousand `;
  }
  if (hundreds > 0) {
    words += `${convertThreeDigits(hundreds)} `;
  }

  const paise = Math.round((Math.abs(amount) - Math.floor(Math.abs(amount))) * 100);
  let paiseWords = '';
  if (paise > 0) {
    paiseWords = ` and ${convertTwoDigits(paise)} Paise`;
  }

  return `Rupees ${words.trim()}${paiseWords} Only`;
}

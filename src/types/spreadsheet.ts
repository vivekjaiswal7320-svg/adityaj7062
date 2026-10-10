/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HorizontalAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';
export type NumberFormatType = 'general' | 'text' | 'number' | 'currency_inr' | 'currency_usd' | 'percent' | 'date';

export type BorderStyle = 'none' | 'thin' | 'medium' | 'thick' | 'double' | 'dashed';

export interface CellBorders {
  top?: { style: BorderStyle; color?: string };
  bottom?: { style: BorderStyle; color?: string };
  left?: { style: BorderStyle; color?: string };
  right?: { style: BorderStyle; color?: string };
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  backgroundColor?: string;
  align?: HorizontalAlign;
  vAlign?: VerticalAlign;
  fontSize?: number; // e.g. 11, 12, 14, 16, 18, 20
  fontFamily?: string;
  wrapText?: boolean;
  borders?: CellBorders;
  format?: NumberFormatType;
  decimals?: number;
}

export interface CellData {
  value: string; // evaluated display or raw value
  formula?: string; // e.g. "=SUM(B2:B8)"
  style?: CellStyle;
  colSpan?: number; // for merged cells
  rowSpan?: number; // for merged cells
  mergedInto?: string; // key of the primary cell this is merged into (e.g. "A1")
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export type ChartType = 'column' | 'bar' | 'line' | 'pie' | 'donut' | 'area';

export interface ChartSeriesConfig {
  name: string;
  colIndex: number;
  color?: string;
}

export interface ChartModel {
  id: string;
  title: string;
  type: ChartType;
  range: string; // e.g. "B13:C18"
  labelCol: number;
  valueCols: number[];
  palette: string[];
  showLegend: boolean;
  showValues: boolean;
  showGrid: boolean;
  position?: { x: number; y: number; width: number; height: number };
}

export interface SheetData {
  id: string;
  name: string;
  cells: Record<string, CellData>; // key e.g. "A1", "B4"
  rowCount: number;
  colCount: number;
  rowHeights: Record<number, number>; // rowIndex -> px
  colWidths: Record<number, number>; // colIndex -> px
  charts: ChartModel[];
  showGridLines: boolean;
}

export interface SalarySlipFormData {
  companyName: string;
  companyAddress: string;
  companySubtext: string;
  monthYear: string;
  employeeName: string;
  employeeId: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  bankAccount: string;
  panNo: string;
  pfUan: string;
  workedDays: number;
  lopDays: number;
  // Earnings
  basicSalary: number;
  hra: number;
  conveyance: number;
  medicalAllowance: number;
  specialAllowance: number;
  overtimeOrBonus: number;
  // Deductions
  providentFund: number;
  professionalTax: number;
  tdsIncomeTax: number;
  healthInsurance: number;
  loanAdvance: number;
}

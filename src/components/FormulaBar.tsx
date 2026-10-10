/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { FunctionSquare, Check, X, ChevronDown } from 'lucide-react';

interface FormulaBarProps {
  activeCellKey: string;
  formulaValue: string;
  onFormulaChange: (val: string) => void;
  onFormulaCommit: () => void;
  onFormulaCancel: () => void;
}

const COMMON_FUNCTIONS = [
  { name: 'SUM', desc: 'Add values: =SUM(B1:B10)', syntax: '=SUM(' },
  { name: 'AVERAGE', desc: 'Calculate average: =AVERAGE(C1:C10)', syntax: '=AVERAGE(' },
  { name: 'COUNT', desc: 'Count numerical values: =COUNT(A1:A20)', syntax: '=COUNT(' },
  { name: 'MAX', desc: 'Maximum value: =MAX(D2:D15)', syntax: '=MAX(' },
  { name: 'MIN', desc: 'Minimum value: =MIN(D2:D15)', syntax: '=MIN(' },
  { name: 'IF', desc: 'Conditional logic: =IF(C2>50, "Pass", "Fail")', syntax: '=IF(' },
  { name: 'CONCAT', desc: 'Join text: =CONCAT(A1, " ", B1)', syntax: '=CONCAT(' },
  { name: 'ROUND', desc: 'Round number: =ROUND(C2, 2)', syntax: '=ROUND(' },
];

export const FormulaBar: React.FC<FormulaBarProps> = ({
  activeCellKey,
  formulaValue,
  onFormulaChange,
  onFormulaCommit,
  onFormulaCancel,
}) => {
  const [showFxMenu, setShowFxMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fxMenuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fxMenuRef.current && !fxMenuRef.current.contains(e.target as Node)) {
        setShowFxMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInsertFunction = (syntax: string) => {
    onFormulaChange(syntax);
    setShowFxMenu(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-b border-slate-200 select-none text-xs">
      {/* Active Cell Name Box */}
      <div className="flex items-center justify-center w-20 px-2 py-1 font-mono font-bold text-slate-800 bg-slate-100 rounded border border-slate-300">
        <span>{activeCellKey || 'A1'}</span>
      </div>

      <div className="h-4 w-px bg-slate-200" />

      {/* Function FX Dropdown Button */}
      <div className="relative" ref={fxMenuRef}>
        <button
          onClick={() => setShowFxMenu(!showFxMenu)}
          title="Insert Formula / सूत्र डालें"
          className="flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded border border-transparent hover:border-emerald-200 transition-colors"
        >
          <span className="font-serif italic font-bold text-slate-700 text-sm">fx</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {showFxMenu && (
          <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-40">
            <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Common Formulas / सामान्य सूत्र
            </div>
            {COMMON_FUNCTIONS.map((fn) => (
              <button
                key={fn.name}
                onClick={() => handleInsertFunction(fn.syntax)}
                className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 transition-colors flex flex-col"
              >
                <span className="font-semibold text-slate-800 font-mono text-xs">{fn.name}</span>
                <span className="text-[10px] text-slate-500">{fn.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cancel and Commit buttons */}
      <button
        onClick={onFormulaCancel}
        title="Cancel (Esc)"
        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={onFormulaCommit}
        title="Enter / Commit (Enter)"
        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded"
      >
        <Check className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-slate-200" />

      {/* Formula Input Box */}
      <input
        ref={inputRef}
        type="text"
        value={formulaValue}
        onChange={(e) => onFormulaChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onFormulaCommit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onFormulaCancel();
          }
        }}
        placeholder="Enter value or formula like =SUM(B1:B10), =C2-D2..."
        className="flex-1 px-2.5 py-1 text-xs text-slate-800 bg-transparent border border-slate-200 rounded focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
      />
    </div>
  );
};

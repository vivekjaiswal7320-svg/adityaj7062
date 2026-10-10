/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Search, Replace, ArrowRight } from 'lucide-react';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: (query: string, matchCase: boolean) => void;
  onReplace: (find: string, replaceWith: string, replaceAll: boolean, matchCase: boolean) => void;
  matchCount?: number;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  onFind,
  onReplace,
  matchCount = 0,
}) => {
  if (!isOpen) return null;

  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);

  const handleFindSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findText) return;
    onFind(findText, matchCase);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Search className="w-4 h-4 text-emerald-600" />
            <span>Find and Replace / खोजें और बदलें</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleFindSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Find what / क्या खोजना है:
            </label>
            <input
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="e.g. Rahul, 42000, Engineering..."
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Replace with / इससे बदलें:
            </label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="e.g. Vivek, 45000..."
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Match case (केस संवेदनशील)</span>
            </label>

            {matchCount > 0 && (
              <span className="text-[11px] font-mono text-emerald-700 font-medium">
                {matchCount} match{matchCount > 1 ? 'es' : ''} found
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onReplace(findText, replaceText, false, matchCase)}
              disabled={!findText}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onReplace(findText, replaceText, true, matchCase)}
              disabled={!findText}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Replace All
            </button>
            <button
              type="submit"
              disabled={!findText}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs disabled:opacity-40"
            >
              Find Next
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

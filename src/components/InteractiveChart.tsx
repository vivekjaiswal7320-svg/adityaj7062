/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId, useMemo, useRef } from 'react';
import { ChartModel, SheetData } from '../types/spreadsheet';
import { parseRange, toCellKey, formatCellValue } from '../utils/formulaEngine';
import { Download, Trash2, Maximize2, Settings2 } from 'lucide-react';

interface InteractiveChartProps {
  chart: ChartModel;
  sheet: SheetData;
  onUpdateChart?: (updated: ChartModel) => void;
  onDeleteChart?: (id: string) => void;
  onEditChart?: (chart: ChartModel) => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  chart,
  sheet,
  onDeleteChart,
  onEditChart,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const chartId = useId();

  // Extract data from sheet using chart.range, labelCol, valueCols
  const chartData = useMemo(() => {
    const parsed = parseRange(chart.range);
    if (!parsed) return { labels: [], datasets: [] };

    const labels: string[] = [];
    const seriesValues: { name: string; values: number[] }[] = chart.valueCols.map((cIdx) => {
      // Find series name from header row above range if exists, or column letter
      const headerKey = toCellKey(Math.max(0, parsed.startRow - 1), cIdx);
      const headerCell = sheet.cells[headerKey];
      return {
        name: headerCell?.value || `Series ${cIdx + 1}`,
        values: [],
      };
    });

    for (let r = parsed.startRow; r <= parsed.endRow; r++) {
      const labelKey = toCellKey(r, chart.labelCol);
      const labelCell = sheet.cells[labelKey];
      const label = labelCell?.value ? String(labelCell.value) : `R${r + 1}`;
      labels.push(label);

      chart.valueCols.forEach((colIdx, sIdx) => {
        const valKey = toCellKey(r, colIdx);
        const valCell = sheet.cells[valKey];
        const raw = valCell?.value ?? '0';
        const num = parseFloat(String(raw).replace(/,/g, ''));
        seriesValues[sIdx].values.push(isNaN(num) ? 0 : num);
      });
    }

    return { labels, datasets: seriesValues };
  }, [chart.range, chart.labelCol, chart.valueCols, sheet.cells]);

  // Download chart as PNG image
  const handleDownloadPNG = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 480;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pngURL = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${chart.title.replace(/\s+/g, '_') || 'chart'}.png`;
        downloadLink.href = pngURL;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  const palette = chart.palette && chart.palette.length > 0
    ? chart.palette
    : ['#0d9488', '#2563eb', '#f59e0b', '#dc2626', '#8b5cf6', '#10b981'];

  // Dimensions
  const width = 640;
  const height = 340;
  const padding = { top: 40, right: 30, bottom: 50, left: 70 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Max value calculation
  const allValues = chartData.datasets.flatMap((d) => d.values);
  const maxVal = Math.max(...allValues, 10);
  const minVal = Math.min(0, ...allValues);
  const valRange = maxVal - minVal || 1;

  // Render SVG Chart based on type
  const renderChartGraphic = () => {
    const { labels, datasets } = chartData;
    if (labels.length === 0 || datasets.length === 0) {
      return (
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#94a3b8" fontSize="13">
          No data available in range {chart.range}
        </text>
      );
    }

    if (chart.type === 'pie' || chart.type === 'donut') {
      const isDonut = chart.type === 'donut';
      const firstDataset = datasets[0]?.values || [];
      const total = firstDataset.reduce((a, b) => a + Math.max(0, b), 0) || 1;
      const centerX = width / 2;
      const centerY = (height + 10) / 2;
      const radius = 105;
      const innerRadius = isDonut ? 55 : 0;

      let currentAngle = -Math.PI / 2;

      return (
        <g>
          {firstDataset.map((val, idx) => {
            const safeVal = Math.max(0, val);
            const sliceAngle = (safeVal / total) * (Math.PI * 2);
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            currentAngle = endAngle;

            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);

            const ix1 = centerX + innerRadius * Math.cos(startAngle);
            const iy1 = centerY + innerRadius * Math.sin(startAngle);
            const ix2 = centerX + innerRadius * Math.cos(endAngle);
            const iy2 = centerY + innerRadius * Math.sin(endAngle);

            const largeArc = sliceAngle > Math.PI ? 1 : 0;
            const color = palette[idx % palette.length];

            const path = isDonut
              ? `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`
              : `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

            // Label coordinate
            const midAngle = startAngle + sliceAngle / 2;
            const labelR = isDonut ? (radius + innerRadius) / 2 : radius * 0.65;
            const lx = centerX + labelR * Math.cos(midAngle);
            const ly = centerY + labelR * Math.sin(midAngle);
            const percent = ((safeVal / total) * 100).toFixed(0);

            return (
              <g key={`slice-${idx}`}>
                <path
                  d={path}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-300 hover:opacity-90"
                />
                {chart.showValues && sliceAngle > 0.18 && (
                  <text
                    x={lx}
                    y={ly + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {percent}%
                  </text>
                )}
              </g>
            );
          })}
        </g>
      );
    }

    if (chart.type === 'column') {
      const groupWidth = plotWidth / labels.length;
      const barPadding = 0.2;
      const numSeries = datasets.length;
      const barWidth = (groupWidth * (1 - barPadding)) / numSeries;

      return (
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {chart.showGrid &&
            [0, 0.25, 0.5, 0.75, 1].map((step, idx) => {
              const y = plotHeight * (1 - step);
              const gridVal = minVal + step * valRange;
              return (
                <g key={`grid-${idx}`}>
                  <line
                    x1="0"
                    y1={y}
                    x2={plotWidth}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                  <text
                    x="-8"
                    y={y + 4}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="10"
                    className="font-mono tabular-nums"
                  >
                    {formatCellValue(gridVal, 'number', 0)}
                  </text>
                </g>
              );
            })}

          {/* Bars */}
          {labels.map((label, lIdx) => {
            const groupX = lIdx * groupWidth + (groupWidth * barPadding) / 2;
            return (
              <g key={`col-group-${lIdx}`}>
                {datasets.map((ds, sIdx) => {
                  const val = ds.values[lIdx] ?? 0;
                  const barH = Math.max(2, ((val - minVal) / valRange) * plotHeight);
                  const barX = groupX + sIdx * barWidth;
                  const barY = plotHeight - barH;
                  const color = palette[sIdx % palette.length];

                  return (
                    <g key={`bar-${lIdx}-${sIdx}`}>
                      <rect
                        x={barX}
                        y={barY}
                        width={Math.max(4, barWidth - 3)}
                        height={barH}
                        fill={color}
                        rx="3"
                        className="transition-all duration-300 hover:brightness-110"
                      />
                      {chart.showValues && (
                        <text
                          x={barX + barWidth / 2 - 1.5}
                          y={barY - 5}
                          textAnchor="middle"
                          fill="#334155"
                          fontSize="9"
                          fontWeight="600"
                          className="font-mono tabular-nums"
                        >
                          {val > 999 ? `${(val / 1000).toFixed(1)}k` : val}
                        </text>
                      )}
                    </g>
                  );
                })}
                {/* X-axis label */}
                <text
                  x={groupX + (groupWidth * (1 - barPadding)) / 2}
                  y={plotHeight + 20}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="10"
                  className="select-none truncate"
                >
                  {label.length > 9 ? label.substring(0, 9) + '…' : label}
                </text>
              </g>
            );
          })}
        </g>
      );
    }

    if (chart.type === 'bar') {
      const groupHeight = plotHeight / labels.length;
      const numSeries = datasets.length;
      const barH = (groupHeight * 0.7) / numSeries;

      return (
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {labels.map((label, lIdx) => {
            const groupY = lIdx * groupHeight + (groupHeight * 0.15);
            return (
              <g key={`hbar-group-${lIdx}`}>
                {datasets.map((ds, sIdx) => {
                  const val = ds.values[lIdx] ?? 0;
                  const barW = Math.max(2, ((val - minVal) / valRange) * plotWidth);
                  const barY = groupY + sIdx * barH;
                  const color = palette[sIdx % palette.length];

                  return (
                    <g key={`hbar-${lIdx}-${sIdx}`}>
                      <rect
                        x="0"
                        y={barY}
                        width={barW}
                        height={Math.max(3, barH - 2)}
                        fill={color}
                        rx="2"
                        className="transition-all hover:brightness-110"
                      />
                      {chart.showValues && (
                        <text
                          x={barW + 5}
                          y={barY + barH / 2 + 3}
                          fill="#334155"
                          fontSize="9"
                          fontWeight="600"
                          className="font-mono tabular-nums"
                        >
                          {val}
                        </text>
                      )}
                    </g>
                  );
                })}
                <text
                  x="-8"
                  y={groupY + groupHeight / 2 - 2}
                  textAnchor="end"
                  fill="#475569"
                  fontSize="10"
                >
                  {label.length > 10 ? label.substring(0, 10) + '…' : label}
                </text>
              </g>
            );
          })}
        </g>
      );
    }

    // Line or Area Chart
    if (chart.type === 'line' || chart.type === 'area') {
      const stepX = labels.length > 1 ? plotWidth / (labels.length - 1) : plotWidth;

      return (
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {chart.showGrid &&
            [0, 0.25, 0.5, 0.75, 1].map((step, idx) => {
              const y = plotHeight * (1 - step);
              const gridVal = minVal + step * valRange;
              return (
                <g key={`grid-line-${idx}`}>
                  <line
                    x1="0"
                    y1={y}
                    x2={plotWidth}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                  <text
                    x="-8"
                    y={y + 4}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="10"
                    className="font-mono tabular-nums"
                  >
                    {formatCellValue(gridVal, 'number', 0)}
                  </text>
                </g>
              );
            })}

          {datasets.map((ds, sIdx) => {
            const points = ds.values.map((v, i) => {
              const x = i * stepX;
              const y = plotHeight - ((v - minVal) / valRange) * plotHeight;
              return { x, y, v };
            });

            const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
            const color = palette[sIdx % palette.length];

            const areaPath =
              points.length > 0
                ? `M ${points[0].x} ${plotHeight} L ${points.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${
                    points[points.length - 1].x
                  } ${plotHeight} Z`
                : '';

            return (
              <g key={`line-ds-${sIdx}`}>
                {chart.type === 'area' && (
                  <path d={areaPath} fill={color} fillOpacity="0.15" />
                )}
                <polyline
                  points={polylineStr}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {points.map((p, pIdx) => (
                  <g key={`pt-${pIdx}`}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke={color} strokeWidth="2.5" />
                    {chart.showValues && (
                      <text
                        x={p.x}
                        y={p.y - 8}
                        textAnchor="middle"
                        fill="#334155"
                        fontSize="9"
                        fontWeight="600"
                        className="font-mono tabular-nums"
                      >
                        {p.v}
                      </text>
                    )}
                  </g>
                ))}
              </g>
            );
          })}

          {/* X axis labels */}
          {labels.map((label, lIdx) => (
            <text
              key={`x-lbl-${lIdx}`}
              x={lIdx * stepX}
              y={plotHeight + 20}
              textAnchor="middle"
              fill="#475569"
              fontSize="10"
            >
              {label.length > 8 ? label.substring(0, 8) + '…' : label}
            </text>
          ))}
        </g>
      );
    }

    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
      {/* Chart Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 text-sm">{chart.title}</span>
          <span className="text-[11px] text-slate-500 font-mono">
            {chart.type.toUpperCase()} · {chart.range}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onEditChart && (
            <button
              onClick={() => onEditChart(chart)}
              title="Chart Settings / सेटिंग्स"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleDownloadPNG}
            title="Download PNG Image / चित्र डाउनलोड करें"
            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-200 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          {onDeleteChart && (
            <button
              onClick={() => onDeleteChart(chart.id)}
              title="Delete Chart / हटाएं"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="p-3 flex items-center justify-center overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[620px] h-auto select-none"
        >
          {/* Background */}
          <rect width={width} height={height} fill="#ffffff" />

          {/* Title */}
          <text
            x={width / 2}
            y={24}
            textAnchor="middle"
            fill="#0f172a"
            fontSize="14"
            fontWeight="700"
          >
            {chart.title}
          </text>

          {/* Graphic */}
          {renderChartGraphic()}

          {/* Legend */}
          {chart.showLegend && (
            <g transform={`translate(${padding.left}, ${height - 15})`}>
              {chart.type === 'pie' || chart.type === 'donut'
                ? chartData.labels.slice(0, 6).map((lbl, idx) => (
                    <g key={`leg-${idx}`} transform={`translate(${idx * 90}, 0)`}>
                      <rect width="10" height="10" rx="2" fill={palette[idx % palette.length]} />
                      <text x="14" y="9" fontSize="10" fill="#475569">
                        {lbl.length > 9 ? lbl.substring(0, 8) + '…' : lbl}
                      </text>
                    </g>
                  ))
                : chartData.datasets.map((ds, idx) => (
                    <g key={`leg-${idx}`} transform={`translate(${idx * 120}, 0)`}>
                      <rect width="10" height="10" rx="2" fill={palette[idx % palette.length]} />
                      <text x="14" y="9" fontSize="10" fill="#475569">
                        {ds.name.length > 12 ? ds.name.substring(0, 11) + '…' : ds.name}
                      </text>
                    </g>
                  ))}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

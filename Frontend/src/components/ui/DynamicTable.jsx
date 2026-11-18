import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const DynamicTable = ({
  columns = [],
  data = [],
  loading = false,
  onRowClick,
  onSort,
  pagination = true,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 10,
  onPageChange,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  actions = [],
  emptyMessage = 'No records available',
  className = '',
}) => {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (column) => {
    if (column.sortable !== false) {
      const newDirection = sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
      setSortColumn(column.key);
      setSortDirection(newDirection);
      if (onSort) {
        onSort(column.key, newDirection);
      }
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column.key) {
      return <ChevronUpIcon className="h-3.5 w-3.5 text-slate-400 opacity-60" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-3.5 w-3.5 text-blue-600 font-bold" />
      : <ChevronDownIcon className="h-3.5 w-3.5 text-blue-600 font-bold" />;
  };

  const renderCellValue = (row, column) => {
    if (column.render) {
      return column.render(row[column.key], row);
    }
    if (column.key && column.key.includes('.')) {
      const keys = column.key.split('.');
      let value = row;
      for (const key of keys) {
        value = value?.[key];
      }
      return value;
    }
    return row[column.key];
  };

  return (
    <div className={`bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left border-collapse">
          <thead className="bg-slate-50/70 border-b border-slate-200/80">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={onSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column)}
                  className={`px-4 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider ${column.sortable !== false ? 'cursor-pointer hover:text-slate-900 transition-colors select-none' : ''}`}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{column.label}</span>
                    {column.sortable !== false && getSortIcon(column)}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700 bg-white">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex justify-center items-center gap-2">
                    <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin" />
                    <span className="font-medium text-xs">Loading records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="px-4 py-12 text-center text-slate-400">
                  <p className="font-medium text-xs text-slate-500">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.id || index}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/50'} transition-colors`}
                >
                  {selectable && (
                    <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => onSelectRow && onSelectRow(row.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3.5 text-slate-800">
                      {renderCellValue(row, column)}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => action.onClick(row)}
                            className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer ${action.className || ''}`}
                            title={action.label}
                          >
                            {action.icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && totalPages > 1 && (
        <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div>
            Showing page <strong className="text-slate-900 font-bold">{currentPage}</strong> of <strong className="text-slate-900 font-bold">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white border border-slate-200/90 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs font-semibold transition"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white border border-slate-200/90 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs font-semibold transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicTable;

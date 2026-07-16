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
  emptyMessage = 'No data available',
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
      return <ChevronUpIcon className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-blue-600" />
      : <ChevronDownIcon className="h-4 w-4 text-blue-600" />;
  };

  const renderCellValue = (row, column) => {
    if (column.render) {
      return column.render(row[column.key], row);
    }
    if (column.key.includes('.')) {
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
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-max w-full table-auto divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={onSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column)}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable !== false && getSortIcon(column)}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="px-4 py-8 text-center">
                  <div className="flex justify-center items-center">
                    <ArrowPathIcon className="h-6 w-6 text-blue-600 animate-spin" />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.id || index}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => onSelectRow && onSelectRow(row.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                      {renderCellValue(row, column)}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        {actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            className={`p-1 rounded hover:bg-gray-100 transition-colors ${action.className || ''}`}
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
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
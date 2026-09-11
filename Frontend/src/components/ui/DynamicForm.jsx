import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * A reusable dynamic form component that parses field configurations.
 * 
 * Props:
 * - fields: Array of field objects { name, label, type, required, placeholder, options (for select), halfWidth }
 * - formData: Object containing current values
 * - onChange: Handler for value change
 * - onSubmit: Submit button click handler
 * - onCancel: Cancel button click handler
 * - loading: Submission loading state
 * - error: Error string
 * - success: Success string
 * - submitButtonText: Submit button text label
 */
const DynamicForm = ({
  fields = [],
  formData = {},
  onChange,
  onSubmit,
  onCancel,
  loading = false,
  error = "",
  success = "",
  submitButtonText = "Submit",
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Alert Banners */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-shake">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-2xl flex items-center space-x-2">
          <CheckCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const isSelect = field.type === 'select';
          const isTextarea = field.type === 'textarea';
          const isFullWidth = !field.halfWidth;

          const inputElement = isSelect ? (
            <select
              name={field.name}
              value={formData[field.name] || ""}
              onChange={onChange}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : isTextarea ? (
            <textarea
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              value={formData[field.name] || ""}
              onChange={onChange}
              rows={field.rows || 3}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400 transition"
            />
          ) : (
            <input
              type={field.type || "text"}
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              value={formData[field.name] || ""}
              onChange={onChange}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400 transition"
            />
          );

          return (
            <div
              key={field.name}
              className={`space-y-1.5 ${isFullWidth ? "md:col-span-2" : ""}`}
            >
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {inputElement}
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end items-center space-x-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition disabled:opacity-50 flex items-center space-x-1.5"
        >
          <span>{loading ? "Provisioning..." : submitButtonText}</span>
        </button>
      </div>
    </form>
  );
};

export default DynamicForm;

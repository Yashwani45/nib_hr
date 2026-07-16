import React from "react";
import { ReceiptPercentIcon } from "@heroicons/react/24/outline";

const SalaryStructure = ({
  records = [],
  selectedPayslipEmp,
  setSelectedPayslipEmp,
  computedPayslip = {},
  hideList
}) => {
  return (
    <div className="space-y-6">
      {/* Payslip & Compensation Calculator */}
      <div className="p-5 border border-indigo-100 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 rounded-xl">
        <h3 className="text-sm font-bold text-indigo-950 mb-3 flex items-center gap-1.5">
          <ReceiptPercentIcon className="h-5 w-5 text-indigo-600" />
          Payslip Preview Generator
        </h3>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 bg-white border p-3 rounded-lg shrink-0">
            <label className="block text-xs font-semibold text-gray-500 mb-2">Select Employee</label>
            <select
              value={selectedPayslipEmp}
              onChange={(e) => setSelectedPayslipEmp(e.target.value)}
              className="w-full text-xs border rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              {records.map(emp => (
                <option key={emp.id} value={emp.empName}>
                  {emp.empName}
                </option>
              ))}
            </select>
          </div>

          {/* Payslip Design */}
          <div className="flex-1 bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">NIB Technologies Pvt Ltd</h4>
                <p className="text-[10px] text-gray-400">Okhla Phase III, New Delhi</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">PAYSLIP</span>
                <p className="text-[9px] text-gray-400 mt-1">Month: July 2026</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400">Employee Name:</span>
                <p className="font-semibold text-gray-800">{computedPayslip.empName || "--"}</p>
              </div>
              <div className="text-right">
                <span className="text-gray-400">Currency:</span>
                <p className="font-semibold text-gray-800">INR (₹)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-3">
              <div className="space-y-1.5">
                <h5 className="font-semibold text-xs text-gray-700 pb-1 border-b">Earnings</h5>
                <div className="flex justify-between text-xs">
                  <span>Basic Salary</span>
                  <span className="font-semibold">₹{computedPayslip.basic || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>HRA</span>
                  <span className="font-semibold">₹{computedPayslip.hra || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Dearness Allowance (DA)</span>
                  <span className="font-semibold">₹{computedPayslip.da || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Special Allowance</span>
                  <span className="font-semibold">₹{computedPayslip.special || 0}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-900 border-t pt-1">
                  <span>Gross Salary</span>
                  <span>₹{computedPayslip.gross || 0}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h5 className="font-semibold text-xs text-gray-700 pb-1 border-b text-right md:text-left">Deductions</h5>
                <div className="flex justify-between text-xs">
                  <span>PF Contribution</span>
                  <span className="font-semibold text-red-600">₹{computedPayslip.pfDeduction || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>ESI Contribution</span>
                  <span className="font-semibold text-red-600">₹{computedPayslip.esiDeduction || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Professional Tax (PT)</span>
                  <span className="font-semibold text-red-600">₹{computedPayslip.pt || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>TDS</span>
                  <span className="font-semibold text-red-600">₹{computedPayslip.tds || 0}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-900 border-t pt-1">
                  <span>Total Deductions</span>
                  <span>₹{Number(computedPayslip.pfDeduction || 0) + Number(computedPayslip.esiDeduction || 0) + Number(computedPayslip.pt || 0) + Number(computedPayslip.tds || 0)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-dashed pt-4">
              <span className="text-sm font-extrabold text-gray-800">Net Take Home Pay:</span>
              <span className="text-lg font-black text-indigo-700">₹{computedPayslip.netSalary || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {!hideList && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {records.map((item) => (
            <div key={item.id} className="border border-gray-200/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-xs text-gray-800">Employee: {item.empName || "--"}</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-bold">
                  Net Take Home: ₹{item.netSalary || 0}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                {Object.entries(item)
                  .filter(([key]) => key !== "id" && key !== "status" && key !== "created_at" && key !== "updated_at")
                  .map(([key, val]) => (
                    <div key={key} className="space-y-0.5 truncate">
                      <span className="text-gray-400 uppercase tracking-wider text-[8px] font-semibold">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <p className="font-bold text-gray-800 truncate">{String(val || "--")}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SalaryStructure;

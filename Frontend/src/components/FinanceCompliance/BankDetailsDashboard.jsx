import React, { useState, useMemo } from "react";
import { 
  EyeIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  CreditCardIcon
} from "@heroicons/react/24/outline";

const BankDetailsDashboard = ({ records = [], onOpenEdit, onDelete }) => {
  const [filterBank, setFilterBank] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBankDetails, setSelectedBankDetails] = useState(null); // Selected for Eye icon preview
  const [showFullAccountMap, setShowFullAccountMap] = useState({}); // To toggle account number mask

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fallback mock accounts if none of the database rows have bank details filled
  const mockAccounts = useMemo(() => [
    {
      id: "emp-1",
      employeeCode: "TVN2007",
      firstName: "Yashwani",
      lastName: "Rao",
      department: "IT",
      designation: "Systems Engineer",
      bankName: "HDFC Bank",
      accountHolderName: "Yashwani Rao",
      accountNumber: "50100431289574",
      ifscCode: "HDFC0000124",
      branchName: "Tech Park Branch",
      status: "Active",
      photo: ""
    },
    {
      id: "emp-2",
      employeeCode: "EMP-908712",
      firstName: "John",
      lastName: "Doe",
      department: "Marketing",
      designation: "Marketing Specialist",
      bankName: "Chase Bank",
      accountHolderName: "John Doe",
      accountNumber: "124859067341",
      ifscCode: "CHASUS33XXX",
      branchName: "Wall Street Branch",
      status: "Active",
      photo: ""
    },
    {
      id: "emp-3",
      employeeCode: "TVN2004",
      firstName: "Abhishek",
      lastName: "Sharma",
      department: "Software Engineering",
      designation: "Senior Developer",
      bankName: "ICICI Bank",
      accountHolderName: "Abhishek Sharma",
      accountNumber: "000401567892",
      ifscCode: "ICIC0000004",
      branchName: "Connaught Place Branch",
      status: "Active",
      photo: ""
    }
  ], []);

  // Filter records that have bank details populated, or fall back to mock accounts if none have it
  const displayRecords = useMemo(() => {
    const hasAnyBankData = records.some(r => r.bankName || r.accountNumber || r.ifscCode);
    return hasAnyBankData ? records : mockAccounts;
  }, [records, mockAccounts]);

  // Unique list of banks for tabs
  const banks = useMemo(() => {
    const set = new Set(displayRecords.map(r => r.bankName).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [displayRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return displayRecords.filter(r => {
      // If "All" isn't selected, filter by specific bank name
      const bankMatch = filterBank === "All" || String(r.bankName || "").toLowerCase() === filterBank.toLowerCase();
      
      const empName = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
      const empCode = String(r.employeeCode || r.empCode || r.emp_code || "").toLowerCase();
      const bankNameVal = String(r.bankName || "").toLowerCase();
      const branchNameVal = String(r.branchName || "").toLowerCase();
      const holderVal = String(r.accountHolderName || "").toLowerCase();
      
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || 
                           empName.includes(searchLower) || 
                           empCode.includes(searchLower) || 
                           bankNameVal.includes(searchLower) || 
                           branchNameVal.includes(searchLower) ||
                           holderVal.includes(searchLower);
                           
      return bankMatch && searchMatch;
    });
  }, [displayRecords, filterBank, searchQuery]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRecords.slice(startIndex, startIndex + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;

  // Mask helper for account number (e.g. •••• •••• 1234)
  const maskAccountNumber = (accNum, id) => {
    if (!accNum) return "Not Configured";
    if (showFullAccountMap[id]) return accNum;
    const str = String(accNum);
    if (str.length <= 4) return str;
    const last4 = str.slice(-4);
    return `•••• •••• ${last4}`;
  };

  const toggleMask = (id) => {
    setShowFullAccountMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-85">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search account holder, bank..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        {/* Dynamic Bank Selector Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl border max-w-full overflow-x-auto">
          {banks.map(bank => (
            <button
              key={bank}
              onClick={() => { setFilterBank(bank); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                filterBank === bank 
                  ? "bg-white text-indigo-600 shadow-xs border border-slate-100" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
              }`}
            >
              {bank === "All" ? "All Accounts" : bank}
            </button>
          ))}
        </div>

        {/* Page Size Select */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 shrink-0">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="bg-slate-50 border rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-wider">
                <th className="py-3 px-2 w-8"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="py-3">Employee / Account Holder</th>
                <th>Bank Name</th>
                <th>Account Number</th>
                <th>IFSC Code</th>
                <th>Branch Location</th>
                <th>Status</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.map(row => {
                const fullName = `${row.firstName || ""} ${row.lastName || ""}`.trim() || row.accountHolderName || "Unassigned Employee";
                
                return (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-2"><input type="checkbox" className="rounded border-slate-350" /></td>
                    {/* Employee Profile Cell */}
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                          {row.photo ? (
                            <img src={row.photo} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px]">👤</span>
                          )}
                        </div>
                        <div>
                          <span className="block text-slate-700 font-black truncate max-w-[150px]">
                            {fullName}
                          </span>
                          <span className="block text-[9px] text-slate-400">
                            {row.employeeCode || row.id?.slice(0, 8)} • {row.department || "General Staff"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-800 font-extrabold">{row.bankName || "Not Configured"}</td>
                    <td className="font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span>{maskAccountNumber(row.accountNumber, row.id)}</span>
                        {row.accountNumber && (
                          <button
                            onClick={() => toggleMask(row.id)}
                            className="text-slate-400 hover:text-indigo-600 text-[10px] font-extrabold focus:outline-none"
                            title="Show/Hide Account Number"
                          >
                            {showFullAccountMap[row.id] ? "👁" : "🔒"}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="font-mono font-bold uppercase">{row.ifscCode || "N/A"}</td>
                    <td>{row.branchName || "N/A"}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        row.status === "Approved" || row.status === "Active" ? "bg-green-50 text-green-700 border border-green-200" :
                        row.status === "Pending" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-slate-50 text-slate-500 border border-slate-200"
                      } border`}>
                        {row.status || "Active"}
                      </span>
                    </td>
                    {/* Action Column */}
                    <td className="text-right pr-4">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Eye icon: View Details Preview */}
                        <button
                          type="button"
                          onClick={() => setSelectedBankDetails(row)}
                          className="p-1.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition cursor-pointer"
                          title="View Bank Details"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                        </button>
                        {/* Edit Action */}
                        <button
                          type="button"
                          onClick={() => onOpenEdit(row)}
                          className="p-1.5 rounded-lg border border-slate-100 hover:border-green-200 hover:bg-green-50 text-green-500 hover:text-green-700 transition cursor-pointer"
                          title="Edit Details"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        {/* Delete Action */}
                        <button
                          type="button"
                          onClick={() => onDelete(row.id)}
                          className="p-1.5 rounded-lg border border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                          title="Delete Record"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    No bank accounts matching selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-[11px] font-bold text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="inline-flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 border rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 border rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bank Account Details View Preview Modal */}
      {selectedBankDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800">
                  Bank Account Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedBankDetails(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="h-10 w-10 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                  {selectedBankDetails.photo ? (
                    <img src={selectedBankDetails.photo} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[14px]">👤</span>
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">
                    {`${selectedBankDetails.firstName || ""} ${selectedBankDetails.lastName || ""}`.trim() || selectedBankDetails.accountHolderName}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {selectedBankDetails.employeeCode || "N/A"} • {selectedBankDetails.designation || "Staff"} ({selectedBankDetails.department || "Operations"})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-black">Bank Name</span>
                  <span className="text-slate-800 font-black">{selectedBankDetails.bankName || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-black">Account Holder Name</span>
                  <span className="text-slate-800 font-bold">{selectedBankDetails.accountHolderName || `${selectedBankDetails.firstName || ""} ${selectedBankDetails.lastName || ""}`.trim()}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-black">Account Number</span>
                  <span className="text-slate-800 font-mono font-black text-sm tracking-wider">{selectedBankDetails.accountNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-black">IFSC Code</span>
                  <span className="text-slate-800 font-mono font-bold uppercase">{selectedBankDetails.ifscCode || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-black">Branch Name</span>
                  <span className="text-slate-800 font-bold">{selectedBankDetails.branchName || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-black">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    selectedBankDetails.status === "Approved" || selectedBankDetails.status === "Active" ? "bg-green-50 text-green-700 border border-green-200" :
                    "bg-slate-50 text-slate-500 border border-slate-200"
                  } border mt-1`}>
                    {selectedBankDetails.status || "Active"}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end">
              <button
                onClick={() => setSelectedBankDetails(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankDetailsDashboard;

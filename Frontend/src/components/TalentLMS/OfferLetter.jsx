import React, { useState } from "react";
import { PlusIcon, TrashIcon, EyeIcon, DocumentTextIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";

const OfferLetter = ({ records = [], onRefreshData }) => {
  const { user } = useAuth();
  const userRole = String(typeof user?.role === "object" ? user?.role?.name : user?.role || "").toLowerCase().trim();
  const isEmployee = userRole === "employee";
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [formData, setFormData] = useState({
    candidate_name: "",
    candidate_email: "",
    job_title: "",
    ctc: "",
    offer_date: "",
    joining_date: "",
    status: "Sent"
  });
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (offer, nextStatus) => {
    try {
      await apiFetch(`/api/table/offer_letters/${offer.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...offer, status: nextStatus })
      });

      if (nextStatus === "Accepted") {
        const onboardingUuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        const DEFAULT_TASKS = [
          { id: "docs", label: "Document Verification (Aadhar, PAN, Education)", completed: false },
          { id: "assets", label: "IT Assets Allocation (Laptop, Access Card)", completed: false },
          { id: "email", label: "Corporate Email & IAM Setup", completed: false },
          { id: "training", label: "Compliance & Orientation Training", completed: false },
          { id: "biometric", label: "Biometric Registration & Shift Schedule", completed: false }
        ];

        await apiFetch("/api/table/onboarding_tasks", {
          method: "POST",
          body: JSON.stringify({
            id: onboardingUuid,
            candidate_name: offer.candidate_name,
            candidate_email: offer.candidate_email,
            job_title: offer.job_title,
            status: "Pending",
            progress: 0,
            tasks: JSON.stringify(DEFAULT_TASKS)
          })
        });
      }

      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  if (isEmployee) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
          <h3 className="text-sm font-black text-slate-800">My Job Offer</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">View and respond to your official offer letter</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {records.map((offer) => (
            <div key={offer.id} className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono">
                    CTC Package: {offer.ctc}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${
                    offer.status === "Accepted" ? "bg-green-50 text-green-700 border-green-200" :
                    offer.status === "Sent" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {offer.status || "Sent"}
                  </span>
                </div>
                
                <h4 className="text-base font-black text-slate-800">{offer.candidate_name}</h4>
                <p className="text-xs font-bold text-slate-500">{offer.job_title}</p>
                <div className="text-xs text-slate-550 grid grid-cols-2 gap-2 pt-2 max-w-md">
                  <div><strong>Offer Date:</strong> {offer.offer_date || "--"}</div>
                  <div><strong>Proposed Joining:</strong> {offer.joining_date || "--"}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedOffer(offer)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                >
                  <EyeIcon className="w-4 h-4 text-slate-500" />
                  <span>View Full Document</span>
                </button>

                {offer.status === "Sent" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(offer, "Accepted")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 transition cursor-pointer"
                    >
                      Accept Offer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(offer, "Rejected")}
                      className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md shadow-red-600/10 transition cursor-pointer"
                    >
                      Decline
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {records.length === 0 && (
            <div className="py-16 text-center bg-white border border-dashed rounded-2xl space-y-3 col-span-full">
              <span className="text-4xl block">✉️</span>
              <h4 className="font-extrabold text-sm text-slate-650">No Offer Released Yet</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Your job offer letter is currently being generated. Please check back shortly.</p>
            </div>
          )}
        </div>

        {selectedOffer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col h-[85vh]">
              <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800">Job Offer Document</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">Offer Details: {selectedOffer.job_title}</p>
                </div>
                <button
                  onClick={() => setSelectedOffer(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  &times;
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 bg-slate-100/60 flex items-center justify-center">
                <div className="bg-white max-w-2xl w-full shadow-lg border border-slate-200/50 p-8 rounded-lg space-y-6 text-xs text-slate-800 font-medium leading-relaxed relative min-h-[600px] flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b pb-4">
                    <div className="space-y-0.5">
                      <span className="font-black text-indigo-600 tracking-wider text-[11px] uppercase">NIB Technologies Pvt Ltd</span>
                      <p className="text-[9px] text-slate-400">Okhla Phase III, New Delhi, Delhi 110020</p>
                    </div>
                    <div className="h-8 w-8 bg-indigo-50 border rounded-lg flex items-center justify-center text-indigo-600 text-xs">
                      <DocumentTextIcon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <p className="font-mono text-[9px] text-slate-400">Ref: NIB/OFFER/{selectedOffer.id.substring(0,6).toUpperCase()}</p>
                    <p className="font-bold text-slate-500">Date: {selectedOffer.offer_date || "Not Specified"}</p>
                    <div className="pt-2">
                      <p className="font-black text-slate-800">To,</p>
                      <p className="font-black text-slate-800">{selectedOffer.candidate_name}</p>
                      <p className="text-slate-500 font-bold">{selectedOffer.candidate_email}</p>
                    </div>
                  </div>
                  <div className="space-y-3.5">
                    <p className="font-black text-slate-800">Subject: Letter of Offer for the Position of {selectedOffer.job_title}</p>
                    <p>Dear {selectedOffer.candidate_name},</p>
                    <p>
                      We are pleased to offer you the position of <strong className="text-slate-850 font-bold">{selectedOffer.job_title}</strong> with NIB Technologies Pvt Ltd. Your annual compensation package (CTC) will be <strong className="text-slate-850 font-bold">{selectedOffer.ctc}</strong>, inclusive of all statutory and non-statutory benefits as per corporate guidelines.
                    </p>
                    <p>
                      You are scheduled to join us officially on or before <strong className="text-slate-850 font-bold">{selectedOffer.joining_date || "Not Specified"}</strong>. On your date of joining, please report to our Corporate Office at 9:30 AM to complete onboarding and asset allocation structures.
                    </p>
                    <p>
                      We look forward to welcome you to the NIB family.
                    </p>
                  </div>
                  <div className="flex justify-between items-end pt-8 border-t border-slate-50">
                    <div className="space-y-1">
                      <div className="h-6 w-24 border-b border-slate-350 italic font-mono text-[10px] text-slate-400 flex items-end">Digitally Signed</div>
                      <span className="block font-black text-[10px] text-slate-700">Authorized Signatory</span>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="h-6 w-24 border-b border-slate-350"></div>
                      <span className="block font-black text-[10px] text-slate-700">Candidate Signature</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedOffer(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 bg-white"
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition inline-flex items-center gap-1.5"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  <span>Download / Print</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      await apiFetch("/api/table/offer_letters", {
        method: "POST",
        body: JSON.stringify({ id: uuid, ...formData })
      });
      setShowAddModal(false);
      setFormData({
        candidate_name: "",
        candidate_email: "",
        job_title: "",
        ctc: "",
        offer_date: "",
        joining_date: "",
        status: "Sent"
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to release offer: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer record?")) return;
    try {
      await apiFetch(`/api/table/offer_letters/${id}`, {
        method: "DELETE"
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to delete offer.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
        <div>
          <h3 className="text-sm font-black text-slate-800">Offer Letter Management</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Generate, dispatch, and monitor candidate job offers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 hover:shadow-lg transition cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Release Offer</span>
        </button>
      </div>

      {/* Grid ledger */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {records.map((offer) => (
          <div key={offer.id} className="bg-white border border-slate-150 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                  CTC: {offer.ctc}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                  offer.status === "Accepted" ? "bg-green-50 text-green-700 border-green-200" :
                  offer.status === "Sent" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  "bg-red-50 text-red-700 border-red-200"
                } border`}>
                  {offer.status || "Sent"}
                </span>
              </div>
              
              <h4 className="text-sm font-black text-slate-800 line-clamp-1">{offer.candidate_name}</h4>
              <p className="text-[10px] font-bold text-slate-400">{offer.job_title}</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-50 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Offer Date:</span>
                <span className="font-semibold text-slate-700">{offer.offer_date || "--"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Joining Date:</span>
                <span className="font-semibold text-slate-700">{offer.joining_date || "--"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Email:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[150px]">{offer.candidate_email}</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-50">
              <div className="inline-flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOffer(offer)}
                  className="p-1.5 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-indigo-500 hover:text-indigo-700 transition flex items-center gap-1 text-[10px] font-bold"
                  title="View offer document"
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                
                <select
                  value={offer.status}
                  onChange={(e) => handleStatusChange(offer, e.target.value)}
                  className="text-[9px] border bg-gray-50 rounded px-1.5 py-0.5 focus:outline-none"
                >
                  <option value="Sent">Sent</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteOffer(offer.id)}
                className="p-1.5 rounded-lg border border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {records.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white border border-dashed rounded-2xl space-y-3">
            <span className="text-4xl block">✉️</span>
            <h4 className="font-extrabold text-sm text-slate-600">No Offer Letters Released</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">Create and release a formal offer letter to selected candidates.</p>
          </div>
        )}
      </div>

      {/* Release Offer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">Release Job Offer Letter</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Publish and configure compensation details</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Candidate Name</label>
                  <input
                    type="text"
                    required
                    value={formData.candidate_name}
                    onChange={e => setFormData(prev => ({ ...prev, candidate_name: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Aditya Rao"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Candidate Email</label>
                  <input
                    type="email"
                    required
                    value={formData.candidate_email}
                    onChange={e => setFormData(prev => ({ ...prev, candidate_email: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. aditya@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Job Position</label>
                  <input
                    type="text"
                    required
                    value={formData.job_title}
                    onChange={e => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">CTC Package (per annum)</label>
                  <input
                    type="text"
                    required
                    value={formData.ctc}
                    onChange={e => setFormData(prev => ({ ...prev, ctc: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. 12 LPA / ₹1,200,000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Offer Date</label>
                  <input
                    type="date"
                    required
                    value={formData.offer_date}
                    onChange={e => setFormData(prev => ({ ...prev, offer_date: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={formData.joining_date}
                    onChange={e => setFormData(prev => ({ ...prev, joining_date: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 bg-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {loading ? "Releasing..." : "Release Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Letter Document Preview Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col h-[85vh]">
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">Job Offer Document</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Released Offer: {selectedOffer.candidate_name}</p>
              </div>
              <button
                onClick={() => setSelectedOffer(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                &times;
              </button>
            </div>

            {/* Document Body */}
            <div className="flex-1 overflow-y-auto p-12 bg-slate-100/60 flex items-center justify-center">
              <div className="bg-white max-w-2xl w-full shadow-lg border border-slate-200/50 p-8 rounded-lg space-y-6 text-xs text-slate-800 font-medium font-sans leading-relaxed relative min-h-[600px] flex flex-col justify-between">
                
                {/* Letterhead */}
                <div className="flex justify-between items-center border-b pb-4">
                  <div className="space-y-0.5">
                    <span className="font-black text-indigo-600 tracking-wider text-[11px] uppercase">NIB Technologies Pvt Ltd</span>
                    <p className="text-[9px] text-slate-400">Okhla Phase III, New Delhi, Delhi 110020</p>
                  </div>
                  <div className="h-8 w-8 bg-indigo-50 border rounded-lg flex items-center justify-center text-indigo-600 text-xs">
                    <DocumentTextIcon className="w-5 h-5" />
                  </div>
                </div>

                {/* Date & Address */}
                <div className="space-y-2 pt-2">
                  <p className="font-mono text-[9px] text-slate-400">Ref: NIB/OFFER/{selectedOffer.id.substring(0,6).toUpperCase()}</p>
                  <p className="font-bold text-slate-500">Date: {selectedOffer.offer_date || "Not Specified"}</p>
                  <div className="pt-2">
                    <p className="font-black text-slate-800">To,</p>
                    <p className="font-black text-slate-800">{selectedOffer.candidate_name}</p>
                    <p className="text-slate-500 font-bold">{selectedOffer.candidate_email}</p>
                  </div>
                </div>

                {/* Letter Content */}
                <div className="space-y-3.5">
                  <p className="font-black text-slate-800">Subject: Letter of Offer for the Position of {selectedOffer.job_title}</p>
                  
                  <p>Dear {selectedOffer.candidate_name},</p>
                  
                  <p>
                    We are pleased to offer you the position of <strong className="text-slate-850 font-bold">{selectedOffer.job_title}</strong> with NIB Technologies Pvt Ltd. Your annual compensation package (CTC) will be <strong className="text-slate-850 font-bold">{selectedOffer.ctc}</strong>, inclusive of all statutory and non-statutory benefits as per corporate guidelines.
                  </p>

                  <p>
                    You are scheduled to join us officially on or before <strong className="text-slate-850 font-bold">{selectedOffer.joining_date || "Not Specified"}</strong>. On your date of joining, please report to our Corporate Office at 9:30 AM to complete onboarding and asset allocation structures.
                  </p>

                  <p>
                    Please review this offer, sign and return the duplicate copy of this letter as a token of your formal acceptance. We look forward to welcome you to the NIB family.
                  </p>
                </div>

                {/* Sign block */}
                <div className="flex justify-between items-end pt-8 border-t border-slate-50">
                  <div className="space-y-1">
                    <div className="h-6 w-24 border-b border-slate-350 italic font-mono text-[10px] text-slate-400 flex items-end">Digitally Signed</div>
                    <span className="block font-black text-[10px] text-slate-700">Authorized Signatory</span>
                    <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Human Resources Department</span>
                  </div>
                  
                  <div className="space-y-1 text-right">
                    <div className="h-6 w-24 border-b border-slate-350"></div>
                    <span className="block font-black text-[10px] text-slate-700">Candidate Signature</span>
                    <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Acceptance Sign-off</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedOffer(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 bg-white transition"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition inline-flex items-center gap-1.5"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                <span>Download / Print</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferLetter;

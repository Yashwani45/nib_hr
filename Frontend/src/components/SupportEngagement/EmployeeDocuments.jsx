import React, { useState, useEffect, useMemo } from "react";
import { 
  EyeIcon, 
  ArrowDownTrayIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  XMarkIcon,
  FolderIcon
} from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";

const EmployeeDocuments = ({ activeTab, user }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showSignModal, setShowSignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  const [sigRef, setSigRef] = useState("");
  const [rejReason, setRejReason] = useState("");

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/documents/employee/documents");
      setDocuments(res.data || []);
    } catch (err) {
      console.error("Failed to load employee documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleAcknowledge = async (id) => {
    if (!window.confirm("Acknowledge receipt and reading of this document?")) return;
    try {
      await apiFetch(`/api/documents/employee/documents/${id}/acknowledge`, { method: "POST" });
      loadDocuments();
    } catch (err) {
      alert("Acknowledge failed: " + err.message);
    }
  };

  const handleAccept = async (id) => {
    if (!window.confirm("Accept this official offer/agreement?")) return;
    try {
      await apiFetch(`/api/documents/employee/documents/${id}/accept`, { method: "POST" });
      loadDocuments();
    } catch (err) {
      alert("Accept failed: " + err.message);
    }
  };

  const handleSign = async (e) => {
    e.preventDefault();
    if (!sigRef) return alert("Please enter your name/signature verification reference.");
    try {
      await apiFetch(`/api/documents/employee/documents/${selectedDoc.id}/sign`, {
        method: "POST",
        body: JSON.stringify({ reference: sigRef })
      });
      setShowSignModal(false);
      setSigRef("");
      loadDocuments();
    } catch (err) {
      alert("Signing failed: " + err.message);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejReason) return alert("Please enter rejection reason.");
    try {
      await apiFetch(`/api/documents/employee/documents/${selectedDoc.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejReason })
      });
      setShowRejectModal(false);
      setRejReason("");
      loadDocuments();
    } catch (err) {
      alert("Rejection failed: " + err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 mt-4">
      <div className="flex justify-between items-center border-b pb-3">
        <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 uppercase">
          <FolderIcon className="h-5 w-5 text-rose-600" /> Letter Workspace
        </h4>
      </div>

      {loading && (
        <div className="text-center text-slate-400 py-12 text-xs">
          Loading documents...
        </div>
      )}

      {!loading && documents.length === 0 && (
        <div className="text-center text-slate-400 py-16 text-xs">
          No documents issued to you.
        </div>
      )}

      {!loading && documents.length > 0 && (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-4">Doc Number</th>
                <th className="p-4">Title</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Action Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {documents.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-bold text-slate-900">{d.document_number}</td>
                  <td className="p-4 font-bold">{d.title}</td>
                  <td className="p-4 font-mono">{d.expiry_date || "No Expiry"}</td>
                  <td className="p-4">
                    {d.accepted_at ? (
                      <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 font-bold">Accepted</span>
                    ) : d.rejected_at ? (
                      <span className="text-[10px] text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-bold">Rejected</span>
                    ) : d.signed_at ? (
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-bold">E-Signed</span>
                    ) : d.acknowledged_at ? (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">Acknowledged</span>
                    ) : (
                      <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-bold">Action Pending</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`/api/documents/employee/documents/${d.id}/preview`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                      >
                        <EyeIcon className="w-4.5 h-4.5" />
                      </a>

                      <a
                        href={`/api/documents/employee/documents/${d.id}/download`}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <ArrowDownTrayIcon className="w-4.5 h-4.5" />
                      </a>

                      {!d.acknowledged_at && !d.accepted_at && !d.signed_at && (
                        <button
                          onClick={() => handleAcknowledge(d.id)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                          title="Acknowledge Receipt"
                        >
                          <ClipboardDocumentCheckIcon className="w-4.5 h-4.5" />
                        </button>
                      )}

                      {!d.signed_at && !d.accepted_at && !d.rejected_at && (
                        <button
                          onClick={() => {
                            setSelectedDoc(d);
                            setShowSignModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                          title="E-Sign Document"
                        >
                          <ShieldCheckIcon className="w-4.5 h-4.5" />
                        </button>
                      )}

                      {!d.accepted_at && !d.rejected_at && (
                        <>
                          <button
                            onClick={() => handleAccept(d.id)}
                            className="p-1.5 text-slate-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                            title="Accept"
                          >
                            <CheckCircleIcon className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDoc(d);
                              setShowRejectModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Reject"
                          >
                            <XCircleIcon className="w-4.5 h-4.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SIGN MODAL */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">E-Signature Verification</h3>
              <button onClick={() => setShowSignModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSign} className="space-y-3 text-xs">
              <p className="text-slate-500">To electronically sign this document, please enter your full legal name below as a signature confirmation.</p>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Confirm Full Name</label>
                <input type="text" required value={sigRef} onChange={e => setSigRef(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowSignModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md">Acknowledge & Sign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Decline/Reject Document</h3>
              <button onClick={() => setShowRejectModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleReject} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Rejection Reason</label>
                <textarea required value={rejReason} onChange={e => setRejReason(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="3" placeholder="Provide a reason for rejecting this document..." />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowRejectModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md">Decline Document</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDocuments;

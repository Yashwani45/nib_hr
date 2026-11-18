const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'Frontend', 'src', 'components', 'CoreSetup', 'EmployeeProfile.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add QrCodeIcon and modal imports
if (!code.includes('EmployeeQrCardModal')) {
  code = code.replace(
    '  EllipsisVerticalIcon\n} from "@heroicons/react/24/outline";',
    '  EllipsisVerticalIcon,\n  QrCodeIcon\n} from "@heroicons/react/24/outline";\nimport EmployeeQrCardModal from "../Attendance/EmployeeQrCardModal";\nimport EmployeeQrScannerModal from "../Attendance/EmployeeQrScannerModal";'
  );
  if (!code.includes('EmployeeQrCardModal')) {
    // try with \r\n
    code = code.replace(
      '  EllipsisVerticalIcon\r\n} from "@heroicons/react/24/outline";',
      '  EllipsisVerticalIcon,\r\n  QrCodeIcon\r\n} from "@heroicons/react/24/outline";\r\nimport EmployeeQrCardModal from "../Attendance/EmployeeQrCardModal";\r\nimport EmployeeQrScannerModal from "../Attendance/EmployeeQrScannerModal";'
    );
  }
}

// 2. Add states for QR modals
if (!code.includes('selectedQrEmployee')) {
  const target = '  const [showModal, setShowModal] = useState(false);';
  const newStates = `  const [showModal, setShowModal] = useState(false);
  const [selectedQrEmployee, setSelectedQrEmployee] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);`;
  code = code.replace(target, newStates);
}

// 3. Add QR Scanner Button to Toolbar
if (!code.includes('Scan Attendance QR')) {
  const targetBtn = '<PlusIcon className="w-3.5 h-3.5 text-white" />\n                <span>Add Employee</span>\n              </button>';
  const targetBtnCRLF = '<PlusIcon className="w-3.5 h-3.5 text-white" />\r\n                <span>Add Employee</span>\r\n              </button>';
  const qrScannerBtn = `<PlusIcon className="w-3.5 h-3.5 text-white" />
                <span>Add Employee</span>
              </button>

              <button
                type="button"
                onClick={() => setIsScannerModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition border border-emerald-600 shadow-sm cursor-pointer active:scale-95"
                title="Open Live Attendance QR Scanner (Check-In & Check-Out)"
              >
                <QrCodeIcon className="w-3.5 h-3.5 text-white" />
                <span>Scan Attendance QR</span>
              </button>`;

  if (code.includes(targetBtn)) {
    code = code.replace(targetBtn, qrScannerBtn);
  } else if (code.includes(targetBtnCRLF)) {
    code = code.replace(targetBtnCRLF, qrScannerBtn);
  }
}

// 4. Add QR Badge button in table row actions
if (!code.includes('View & Print Attendance QR Badge')) {
  const eyeBtnTarget = `<EyeIcon className="w-4 h-4 transition group-hover:scale-110" />
                            </button>`;
  const eyeBtnTargetCRLF = `<EyeIcon className="w-4 h-4 transition group-hover:scale-110" />\r\n                            </button>`;

  const replacementRowActions = `<EyeIcon className="w-4 h-4 transition group-hover:scale-110" />
                            </button>
                            <button
                              type="button"
                              title="View & Print Attendance QR Badge"
                              onClick={() => {
                                setSelectedQrEmployee(e);
                                setIsQrModalOpen(true);
                              }}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl transition transform active:scale-95 border border-emerald-200/80 flex items-center justify-center cursor-pointer shadow-2xs group"
                            >
                              <QrCodeIcon className="w-4 h-4 transition group-hover:scale-110" />
                            </button>`;

  if (code.includes(eyeBtnTarget)) {
    code = code.replace(eyeBtnTarget, replacementRowActions);
  } else if (code.includes(eyeBtnTargetCRLF)) {
    code = code.replace(eyeBtnTargetCRLF, replacementRowActions);
  }
}

// 5. Add "View QR Badge" to actions dropdown
if (!code.includes('View QR Badge')) {
  const dropdownTarget = `👁️ View Profile\n                                </button>`;
  const dropdownTargetCRLF = `👁️ View Profile\r\n                                </button>`;
  const dropdownReplacement = `👁️ View Profile
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionsMenu(null);
                                    setSelectedQrEmployee(e);
                                    setIsQrModalOpen(true);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 hover:text-emerald-600 transition text-left"
                                >
                                  🪪 View QR Badge
                                </button>`;

  if (code.includes(dropdownTarget)) {
    code = code.replace(dropdownTarget, dropdownReplacement);
  } else if (code.includes(dropdownTargetCRLF)) {
    code = code.replace(dropdownTargetCRLF, dropdownReplacement);
  }
}

// 6. Mount modals before closing tag
if (!code.includes('<EmployeeQrCardModal')) {
  const endTarget = '    </div>\n  );\n};\n\nexport default EmployeeProfile;';
  const endTargetCRLF = '    </div>\r\n  );\r\n};\r\n\r\nexport default EmployeeProfile;';
  const modalsMounted = `      {/* Employee QR Badge Modal */}
      <EmployeeQrCardModal
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setSelectedQrEmployee(null);
        }}
        employee={selectedQrEmployee}
      />

      {/* Live QR Attendance Scanner Kiosk Modal */}
      <EmployeeQrScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onSuccess={(data) => {
          showNotification(data?.message || 'Attendance verified successfully!', 'success');
        }}
      />
    </div>
  );
};

export default EmployeeProfile;`;

  if (code.includes(endTarget)) {
    code = code.replace(endTarget, modalsMounted);
  } else if (code.includes(endTargetCRLF)) {
    code = code.replace(endTargetCRLF, modalsMounted);
  }
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated EmployeeProfile.jsx with QR integrations!');

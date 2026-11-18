const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'Frontend', 'src', 'pages', 'AdminEmployeeQrScannerPage.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add punchMode state
if (!code.includes('const [punchMode, setPunchMode]')) {
  code = code.replace(
    '  const [soundEnabled, setSoundEnabled] = useState(true);',
    '  const [soundEnabled, setSoundEnabled] = useState(true);\n  const [punchMode, setPunchMode] = useState("auto"); // "auto" | "clock-in" | "clock-out"'
  );
}

// 2. Enhance handleCameraZoomChange
if (!code.includes('videoElem.style.transform')) {
  const oldZoomFn = `  const handleCameraZoomChange = async (value) => {
    const zoom = Number(value);
    setCameraZoom(zoom);
    setCameraZoomError("");
    try {
      await html5QrCodeRef.current?.applyVideoConstraints({
        advanced: [{ zoom }],
      });
    } catch (err) {
      setCameraZoomError(err.message || "This camera could not adjust zoom.");
    }
  };`;

  const newZoomFn = `  const handleCameraZoomChange = async (value) => {
    const zoom = Number(value);
    setCameraZoom(zoom);
    setCameraZoomError("");
    try {
      await html5QrCodeRef.current?.applyVideoConstraints({
        advanced: [{ zoom }],
      });
    } catch (err) {
      // Hardware zoom unsupported - digital zoom handles scaling
    }
    try {
      const videoElem = document.querySelector(\`#\${readerElementId} video\`);
      if (videoElem) {
        videoElem.style.transform = \`scale(\${zoom})\`;
        videoElem.style.transformOrigin = "center center";
        videoElem.style.transition = "transform 0.25s ease-out";
      }
    } catch (_) {}
  };`;

  code = code.replace(oldZoomFn, newZoomFn);
}

// 3. Update verifyQrCode with punchMode
if (!code.includes('actionToTake')) {
  const oldAction = `          const action = res.data.nextAction === "clock-out" ? "clock-out" : "clock-in";
          await handleConfirmAttendance(action, rawQrString.trim(), res.data.employee);`;

  const newAction = `          const actionToTake = punchMode === "auto"
            ? (res.data.nextAction === "clock-out" ? "clock-out" : "clock-in")
            : punchMode;
          await handleConfirmAttendance(actionToTake, rawQrString.trim(), res.data.employee);`;

  code = code.replace(oldAction, newAction);
}

// 4. Inject Punch Mode and Distance Zoom Presets into UI
if (!code.includes('Smart Auto (In / Out)')) {
  const targetHeader = '{/* Scanner Card Header */}';
  const newControls = `{/* Attendance Punch Mode Selector */}
          <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 mb-4">
            <button
              type="button"
              onClick={() => setPunchMode("auto")}
              className={\`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer \${
                punchMode === "auto"
                  ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700 font-black"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }\`}
            >
              <SparklesIcon className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>⚡ Smart Auto (In / Out)</span>
            </button>
            <button
              type="button"
              onClick={() => setPunchMode("clock-in")}
              className={\`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer \${
                punchMode === "clock-in"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-600"
              }\`}
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>🟢 Check-In Only</span>
            </button>
            <button
              type="button"
              onClick={() => setPunchMode("clock-out")}
              className={\`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer \${
                punchMode === "clock-out"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-amber-600"
              }\`}
            >
              <ClockIcon className="w-4 h-4" />
              <span>🔴 Check-Out Only</span>
            </button>
          </div>

          {/* Quick Distance Zoom Presets */}
          <div className="flex items-center justify-between px-3 py-2 mb-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl text-xs">
            <span className="text-[11px] font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <span>🎯 Door Se Scan (Distance Zoom):</span>
            </span>
            <div className="flex items-center gap-1">
              {[1, 1.5, 2, 2.5, 3].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => handleCameraZoomChange(z)}
                  className={\`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer \${
                    cameraZoom === z
                      ? "bg-indigo-600 text-white shadow-sm scale-105"
                      : "bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  }\`}
                  title={\`Zoom \${z}x for scanning QR badges from distance\`}
                >
                  {z}x
                </button>
              ))}
            </div>
          </div>

          {/* Scanner Card Header */}`;

  code = code.replace(targetHeader, newControls);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated AdminEmployeeQrScannerPage.jsx!');

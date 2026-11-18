const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'Frontend', 'src', 'components', 'Attendance', 'EmployeeQrScannerModal.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add punchMode state
if (!code.includes('const [punchMode, setPunchMode]')) {
  code = code.replace(
    '  const [cameraZoomError, setCameraZoomError] = useState("");',
    '  const [cameraZoomError, setCameraZoomError] = useState("");\n  const [punchMode, setPunchMode] = useState("auto"); // "auto" | "clock-in" | "clock-out"'
  );
}

// 2. Enhance handleCameraZoomChange with video element digital scaling fallback
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
      // Hardware zoom unsupported - digital zoom fallback will take care of it
    }
    // Universal Digital Zoom fallback: Scale the video stream so distant small QR codes appear large & sharp
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

// 3. Update handleProcessToken to honor punchMode
if (!code.includes('actionToTake')) {
  const oldActionLogic = `        const action = res.data.nextAction === "clock-out" ? "clock-out" : "clock-in";
        setIdentifiedEmp({
          ...res.data,
          qrToken: qrToken.trim(),
        });
        await handleConfirmPunch(action, qrToken.trim());`;

  const newActionLogic = `        const actionToTake = punchMode === "auto"
          ? (res.data.nextAction === "clock-out" ? "clock-out" : "clock-in")
          : punchMode;

        setIdentifiedEmp({
          ...res.data,
          qrToken: qrToken.trim(),
        });
        await handleConfirmPunch(actionToTake, qrToken.trim());`;

  code = code.replace(oldActionLogic, newActionLogic);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated EmployeeQrScannerModal.jsx logic!');

// Prevent React 19 DevTools DataCloneError when profiling components with large props, webcam streams or fibers
if (typeof window !== "undefined" && window.performance) {
  if (typeof window.performance.measure === "function") {
    const _origMeasure = window.performance.measure.bind(window.performance);
    window.performance.measure = function (name, startOrMeasureOptions, endMark) {
      try {
        return _origMeasure(name, startOrMeasureOptions, endMark);
      } catch (err) {
        if (startOrMeasureOptions && typeof startOrMeasureOptions === "object") {
          try {
            const { detail, ...safeOptions } = startOrMeasureOptions;
            return _origMeasure(name, safeOptions, endMark);
          } catch (_) {}
        }
        return null;
      }
    };
  }
}

import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);




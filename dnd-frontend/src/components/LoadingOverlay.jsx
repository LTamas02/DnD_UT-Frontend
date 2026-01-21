import React, { useEffect, useState } from "react";
import "../assets/styles/LoadingOverlay.css";

const LoadingOverlay = ({ active, label = "Loading..." }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timerId;
    if (active) {
      timerId = setTimeout(() => setVisible(true), 200);
    } else {
      setVisible(false);
    }

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [active]);

  return (
    <div className={`app-loading-overlay${visible ? " is-visible" : ""}`} aria-hidden={!visible}>
      <div className="app-loading-card" role="status" aria-live="polite">
        <span className="app-loading-spinner" aria-hidden="true" />
        <span className="app-loading-text">{label}</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;

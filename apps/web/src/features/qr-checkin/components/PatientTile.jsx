// src/features/qr-checkin/components/PatientTile.jsx
import React from "react";

export default function PatientTile({
  iconSrc,
  title = "Patient",
  subtitle = "Check in for your appointment",
  ctaText = "Continue",
  onClick,
}) {
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className="qr-home card option"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKey}
      aria-label={`${title}, ${subtitle}`}
    >
      <div className="tile-left">
        <img className="tile-icon" src={iconSrc} alt="" aria-hidden />
        <div className="tile-text">
          <div className="tile-title">{title}</div>
          <div className="tile-subtitle">{subtitle}</div>
        </div>
      </div>

      <button type="button" className="btn-primary">
        {ctaText}
      </button>
    </div>
  );
}

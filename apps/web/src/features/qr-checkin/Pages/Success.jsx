import { useLocation, useNavigate } from "react-router-dom";
import IconBackPoly from "../../../assets/icons/icon-polygon.svg";
import IconLogo from "../../../assets/icons/icon-logo.svg";
import IconCheck from "../../../assets/icons/icon-check.svg";
import "../success.css";

export default function Success() {
  const nav = useNavigate();
  const { state } = useLocation() || {};
  // local mock
  const ticketId = state?.ticketId ?? "mock-ticket";
  const waitTime = state?.estimatedWaitTime ?? "08:00";

  const goHome = () => nav("/");
  const toQueue = () => nav("/patient-queue");
  const onBackKey = (e) => (e.key === "Enter" || e.key === " ") && goHome();

  return (
    <div className="success-page">
      {/* topbar */}
      <header className="qr-topbar">
        <button
          type="button"
          className="back-home"
          onClick={goHome}
          onKeyDown={onBackKey}
          aria-label="Back to Home"
        >
          <img className="back-icon" src={IconBackPoly} alt="" aria-hidden="true" />
          <span className="back-text">Home</span>
        </button>

        <div className="top-center">
          <img className="logo" src={IconLogo} alt="" aria-hidden="true" />
          <span className="top-title">Patient Check-in</span>
        </div>

        <div className="top-right" aria-hidden="true" />
      </header>

      {/* mid card */}
      <main className="success-card">
        {/* green circle */}
        <div className="success-head">
          <span className="check-badge" aria-hidden="true">
            <img src={IconCheck} alt="" />
          </span>
          <h1 className="success-title">Check-in Successful !</h1>
        </div>

        {/* white card */}
        <section className="ticket">
          <p className="ticket-caption">Your Appointment Number</p>
          <p className="ticket-num"># {ticketId}</p>

          <div className="ticket-row">
            <span className="ticket-label">Estimated Wait Time</span>
            <span className="ticket-time">{waitTime}</span>
          </div>
        </section>

        {/* text */}
        <p className="success-note">
          <strong>Please wait in the waiting area.</strong>&nbsp;
          Your number will be called when it&apos;s your turn. You can view the queue
          status on the waiting room display.
        </p>

        {/* View Queue  */}
        <button type="button" className="btn-view-queue" onClick={toQueue}>
          View Queue Display
        </button>
      </main>
    </div>
  );
}

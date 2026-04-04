import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

import IconLogo from "../../../assets/icons/icon-logo.svg";
import IconDoctor from "../../../assets/icons/icon-doctor.svg";
import IconShield from "../../../assets/icons/icon-shield.svg";
import IconTV from "../../../assets/icons/icon-tv.svg";
import IconPatient from "../../../assets/icons/icon-patient.svg";

import Image1 from "../../../assets/images/image1.png";
import Image2 from "../../../assets/images/image2.png";

import "../home.css";

export default function Home() {
  const navigate = useNavigate();
  const goQr = () => navigate("/qr");

  const goTo = (path) => {
    navigate(path);
  };

  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  
  const handleSendOTP = async () => {
    // phonenumber
    if (!phoneNumber.trim()) {
      setMessage("Please enter your phone number");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("OTP sent! Please check your phone for the verification code.");
      } else {
        setMessage(data.detail || "Failed to send OTP");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
      console.error("Send OTP error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qc-home">
      {/* left */}
      <section className="qc-left">
        {/* image */}
        <div
          className="qc-left-img qc-left-img1"
          style={{ backgroundImage: `url(${Image1})` }}
          aria-hidden="true"
        />
        <div
          className="qc-left-img qc-left-img2"
          style={{ backgroundImage: `url(${Image2})` }}
          aria-hidden="true"
        />

        {/* card*/}
        <div className="qc-login-card">
          <div className="qc-logo">
            <img src={IconLogo} alt="Pulse" className="qc-logo-icon" />
            <h1 className="qc-logo-title">Pulse</h1>
          </div>

          <p className="qc-sub">Sign in to your account</p>

          {/* opt*/}
          <div className="qc-otp">
            <label className="qc-label">Phone number</label>
            <input
              className="qc-input"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
            />
            <button 
              className="qc-btn-primary"
              onClick={handleSendOTP}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
            
            {/* message */}
            {message && (
              <p className="qc-message" style={{
                fontSize: "14px",
                color: message.includes("successfully") ? "#10b981" : "#ef4444",
                marginTop: "8px",
                textAlign: "center"
              }}>
                {message}
              </p>
            )}
          </div>

          <p className="qc-tip">
            For Doctors &amp; Admins only. Patients use QR code check-in →
          </p>
        </div>
      </section>

      {/* 右半屏：Quick Access 列表 */}
      <section className="qc-right">
        <div className="qc-right-inner">
          <h2 className="qc-title">Quick Access</h2>
          <p className="qc-title-sub">Select your role to continue</p>

          {/* 卡片容器 */}
          <div className="qc-cards-container">
            {/* 1. Patient */}
            <article
              className="qc-role-card qc-role--clickable"
              onClick={goQr}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && goQr()}
            >
              <div className="qa-left">
                <img src={IconPatient} alt="" className="qa-icon" />
                <div>
                  <div className="qa-h">Patient</div>
                  <div className="qa-p">Check in for your appointment</div>
                </div>
              </div>
              <button className="qa-btn qa-btn--filled">Continue</button>
            </article>

            {/* 2. Clinician */}
            <article className="qc-role-card">
              <div className="qa-left">
                <img src={IconDoctor} alt="" className="qa-icon" />
                <div>
                  <div className="qa-h">Clinician</div>
                  <div className="qa-p">View and manage patient queue</div>
                </div>
              </div>
              <button onClick={() => goTo("/clinician-dashboard")} className="qa-btn qa-btn--filled">Continue</button>
            </article>

            {/* 3. Admin */}
            <article className="qc-role-card">
              <div className="qa-left">
                <img src={IconShield} alt="" className="qa-icon" />
                <div>
                  <div className="qa-h">Admin</div>
                  <div className="qa-p">
                    Access analytics and system management
                  </div>
                </div>
              </div>
              <button onClick={() => goTo("/admin-dashboard")} className="qa-btn qa-btn--filled">Continue</button>
            </article>

            {/* 4. Patient Queue Display */}
            <article className="qc-role-card">
              <div className="qa-left">
                <img src={IconTV} alt="" className="qa-icon" />
                <div>
                  <div className="qa-h">Patient Queue Display</div>
                  <div className="qa-p">View public waiting room display</div>
                </div>
              </div>
              <button  onClick={() => goTo("/patient-queue")} className="qa-btn qa-btn--outline">View Display</button>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
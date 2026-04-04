import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import IconBackPoly from "../../../assets/icons/icon-polygon.svg";
import IconLogo from "../../../assets/icons/icon-logo.svg";
import IconPhone from "../../../assets/icons/icon-phone.svg";
import "../phone.css";

/** ====== 环境开关 & 工具 ====== */
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Phone() {
  const nav = useNavigate();

  /** ====== 状态 ====== */
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [agree, setAgree] = useState(false);

  // SEND OPT：inactive -> active -> cooldown
  const [optState, setOptState] = useState("inactive");
  const [optLabel, setOptLabel] = useState("SEND OPT");
  const cooldownRef = useRef(null);

  // 错误/加载 & 记录 otp_id（真后端时可用）
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpId, setOtpId] = useState(null);

  /** ====== 派生校验 ====== */
  const phoneDigits = useMemo(() => phone.replace(/\D/g, ""), [phone]);
  const phoneValid = phoneDigits.length >= 10;
  const codeValid = /^\d+$/.test(code) && code.length >= 1;
  const canCheckIn = codeValid && agree;

  /** ====== 同步 SEND OPT 启用态 ====== */
  useEffect(() => {
    if (optState === "cooldown") return;
    setOptState(phoneValid ? "active" : "inactive");
  }, [phoneValid, optState]);

  /** 组件卸载清理冷却计时器 */
  useEffect(() => () => clearTimeout(cooldownRef.current), []);

  /** ====== 返回 Home ====== */
  const goHome = () => nav("/");
  const onBackKey = (e) => (e.key === "Enter" || e.key === " ") && goHome();

  /** ====== 发送验证码（带环境开关） ====== */
  const handleSendOPT = async () => {
    if (optState !== "active") return;

    setLoading(true);
    setError("");

    try {
      const formattedPhone = phoneDigits.startsWith("1")
        ? `+${phoneDigits}`
        : `+1${phoneDigits}`;

      if (USE_MOCK) {
        await delay(300);
      } else {
        const response = await fetch(`${API_BASE}/api/otp/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: formattedPhone }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.detail || "Failed to send OTP");
        setOtpId(data.otp_id);
      }

      // 统一进入 10s 冷却 & 改文案
      setOptLabel("Resend OPT");
      setOptState("cooldown");
      clearTimeout(cooldownRef.current);
      cooldownRef.current = setTimeout(() => {
        setOptState(phoneValid ? "active" : "inactive");
      }, 10000);
    } catch (err) {
      console.error("Send OTP error:", err);
      setError(err.message || "Network error. Please try again.");
      setOptState("active"); // 失败回到可点
    } finally {
      setLoading(false);
    }
  };

  /** ====== 校验并进入 Success（带环境开关） ====== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCheckIn) return;

    setLoading(true);
    setError("");

    try {
      const formattedPhone = phoneDigits.startsWith("1")
        ? `+${phoneDigits}`
        : `+1${phoneDigits}`;

      if (USE_MOCK) {
        // MOCK：不调后端，直接进入成功页
        await delay(300);
        return nav("/success", {
          state: {
            mock: true,
            phone: formattedPhone,
            patientId: "mock-patient",
            visitId: "mock-visit",
            ticketId: "mock-ticket",
            queuePosition: 3,
            estimatedWaitTime: "08:00",
          },
        });
      }

      // 真接口
      const response = await fetch(`${API_BASE}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: formattedPhone,
          otp_code: code,
          check_in_method: "OTP",
          otp_id: otpId ?? undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || "Invalid or expired OTP");

      nav("/success", {
        state: {
          patientId: data.patient_id,
          visitId: data.visit_id,
          ticketId: data.ticket_id,
          queuePosition: data.queue_position,
          estimatedWaitTime: data.estimated_wait_time,
        },
      });
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /** ====== UI ====== */
  return (
    <div className="phone-page">
      {/* 顶栏（与 QrCode 一致） */}
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

      {/* 中间卡片 */}
      <main className="phone-card">
        {/* 标题：图标与文字同基线且居中 */}
        <div className="title-row" aria-hidden="true">
          <img src={IconPhone} className="phone-icon" alt="" />
          <h1 className="phone-title">Enter Your Phone Number</h1>
        </div>

        <p className="phone-sub">We'll send you a verification code</p>

        {/* 错误提示 */}
        {error && (
          <p
            style={{
              color: "#ef4444",
              fontSize: "14px",
              marginBottom: "12px",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        <form className="phone-form" onSubmit={handleSubmit}>
          {/* 手机号输入 + 内嵌 SEND OPT */}
          <div className="phone-row phone-row--with-opt">
            <input
              type="tel"
              inputMode="tel"
              aria-label="Enter phone number"
              placeholder="Enter phone number"
              className="input input--phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleSendOPT}
              disabled={optState !== "active" || loading}
              className={`btn-opt ${optState === "active" ? "btn-opt--on" : "btn-opt--off"}`}
              aria-disabled={optState !== "active" || loading}
            >
              {loading && optState === "cooldown" ? "Sending..." : optLabel}
            </button>
          </div>

          {/* 验证码输入（同尺寸） */}
          <div className="phone-row">
            <input
              type="text"
              inputMode="numeric"
              aria-label="Enter verification code"
              placeholder="Enter Verification Code"
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              disabled={loading}
            />
          </div>

          {/* 主按钮：验证码为数字且勾选协议才启用 */}
          <button
            type="submit"
            disabled={!canCheckIn || loading}
            className={`btn-checkin ${
              canCheckIn && !loading ? "btn-checkin--on" : "btn-checkin--off"
            }`}
            aria-disabled={!canCheckIn || loading}
          >
            {loading ? "Verifying..." : "Verify & Check In"}
          </button>

          {/* 协议 */}
          <label className="agreement">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              aria-label="Agree to user agreement and privacy policy"
              disabled={loading}
            />
            <span> User agreement, privacy policy</span>
          </label>

          <p className="help-tip">
            Having trouble? Please see the front desk for assistance.
          </p>
        </form>
      </main>
    </div>
  );
}

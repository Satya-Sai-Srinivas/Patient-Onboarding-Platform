// src/features/qr-checkin/Pages/QrCode.jsx
import { useNavigate } from "react-router-dom";

// 顶栏用到的图标
import IconLogo from "../../../assets/icons/icon-logo.svg";
import IconBackPoly from "../../../assets/icons/icon-polygon.svg";

// 只在本页使用的样式
import "../QrCode.css";

// 新增：二维码组件
import { QRCodeCanvas } from "qrcode.react";

export default function QrCode() {
  const navigate = useNavigate();

  // 返回首页（保持你现有 Home 路由）
  const goHome = () => navigate("/");

  // 模拟扫码：进入 Phone 页面（保持你现有的路由）
  const goPhone = () => navigate("/phone");

  // ====== 二维码内容 ======
  // 用户用手机相机/扫码 App 扫描后要打开的地址。
  // 这里直接编码为当前站点的 phone 路由，兼容多环境。
  const qrValue = `${window.location.origin}/phone`;

  // 键盘可访问：在顶栏返回按钮上回车也能返回
  const onBackKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goHome();
    }
  };

  return (
    <div className="qr-page">
      {/* 顶栏（不改动你现有结构，只保证固定在顶部和居中标题） */}
      <header className="qr-topbar">
        <button
          type="button"
          className="back-home"
          onClick={goHome}
          onKeyDown={onBackKey}
          aria-label="Back to Home"
        >
          {/* 注意：为了保证是“<”方向，直接用未旋转的多边形并通过CSS让尖角朝左 */}
          <img className="back-icon" src={IconBackPoly} alt="" aria-hidden="true" />
          <span className="back-text">Home</span>
        </button>

        <div className="top-center">
          <img className="logo" src={IconLogo} alt="" aria-hidden="true" />
          <span className="top-title">Patient Check-in</span>
        </div>

        {/* 右侧占位，保持居中布局不偏移 */}
        <div className="top-right" aria-hidden="true" />
      </header>

      {/* 中间卡片（保持原有结构与文案） */}
      <main className="qr-main">
        <article className="qr-card" role="region" aria-label="QR Code Check-in">
          <div className="qr-card-head">
            <img className="card-logo" src={IconLogo} alt="" aria-hidden="true" />
            <h1 className="qr-title">Welcome to Pulse</h1>
          </div>

          {/* 这里：把原来的灰色方块替换为可扫描的二维码 */}
          <div className="qr-box">
            <QRCodeCanvas
              value={qrValue}
              size={204}             // 视觉大小（保持原灰框内边距后正好贴合）
              level="M"              // 容错等级：L/M/Q/H
              includeMargin={true}   // 四周留白，扫码更稳
              bgColor="#FFFFFF"
              fgColor="#1F2937"      // 深灰（对比度好）
            />
          </div>

          <p className="qr-help">
            Use your phone's camera to scan this QR code and continue with your check-in
          </p>

          <button type="button" className="qr-btn" onClick={goPhone}>
            Simulate QR Scan
          </button>

          <p className="qr-desk">Having trouble? Please see the front desk for assistance.</p>
        </article>
      </main>
    </div>
  );
}
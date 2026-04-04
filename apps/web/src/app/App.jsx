// src/app/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from '../features/qr-checkin/Pages/Home'
import Phone from '../features/qr-checkin/Pages/Phone'
import QrCode from '../features/qr-checkin/Pages/QrCode'
import Success from '../features/qr-checkin/Pages/Success'

import ClinicianDashboard from "../features/dashboards/pages/ClinicianDashboard";
import AdminDashboard from "../features/dashboards/pages/AdminDashboard";
import WaitingDisplay from "../features/dashboards/pages/WaitingDisplay";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/phone" element={<Phone />} />
        <Route path="/qr" element={<QrCode />} />
        <Route path="/success" element={<Success />} />
        <Route path="/clinician-dashboard" element={<ClinicianDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/patient-queue" element={<WaitingDisplay />} />
      </Routes>
    </BrowserRouter>
  )
}



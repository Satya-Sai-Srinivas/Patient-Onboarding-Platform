import axios from "axios";
import type { Appointment, AppointmentStatus, QueueMetrics } from "../types/appointment";
import { mockAppointments } from "../lib/mockData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// ── Backend response shapes ───────────────────────────────────────────────────

interface BackendQueueSummary {
  total: number;
  waiting: number;
  called: number;
  in_progress: number;
  completed_today?: number;
  average_wait_time?: number;
}

interface BackendTicketAdmin {
  ticket_id: number;
  visit_id: number;
  patient_id: number;
  queue_position: number;
  queue_status: string;
  estimated_wait_time: number | null;
  actual_wait_time: number | null;
  patient_name: string;
  patient_phone: string | null;
  doctor_id: number | null;
  doctor_name: string;
  department_id: number | null;
  department_name: string;
  check_in_time: string | null;
  check_in_method: string | null;
  called_at: string | null;
  started_at: string | null;
  created_at: string | null;
}

interface BackendTicketClinician {
  ticket_id: number;
  visit_id: number;
  patient_id: number;
  queue_position: number;
  queue_status: string;
  estimated_wait_time: number | null;
  patient_name: string;
  patient_age: number | null;
  check_in_time: string | null;
  called_at: string | null;
  started_at: string | null;
}

interface BackendTicketPublic {
  ticket_id: number;
  visit_id: number;
  queue_position: number;
  queue_status: string;
  estimated_wait_time: number | null;
  patient_name: string;
  doctor_name: string;
  check_in_time: string | null;
}

interface AdminStateResponse {
  success: boolean;
  timestamp: string;
  summary: BackendQueueSummary;
  queue: BackendTicketAdmin[];
}

interface ClinicianStateResponse {
  success: boolean;
  clinician_id: number;
  timestamp: string;
  summary: BackendQueueSummary;
  queue: BackendTicketClinician[];
}

interface PublicDisplayStateResponse {
  success: boolean;
  timestamp: string;
  summary: BackendQueueSummary;
  queue: BackendTicketPublic[];
}

// ── Status mapping ────────────────────────────────────────────────────────────

const BACKEND_TO_FRONTEND: Record<string, AppointmentStatus> = {
  WAITING: "QUEUED",
  CALLED: "READY",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

const FRONTEND_TO_BACKEND: Record<AppointmentStatus, string> = {
  QUEUED: "WAITING",
  READY: "CALLED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "CANCELLED",
};

// ── Adapters ──────────────────────────────────────────────────────────────────

function padPos(pos: number): string {
  return pos.toString().padStart(4, "0");
}

function adminTicketToAppointment(t: BackendTicketAdmin): Appointment {
  const num = padPos(t.queue_position);
  return {
    id: String(t.ticket_id),
    patientId: String(t.patient_id),
    displayLabel: `${t.patient_name} #${num}`,
    appointmentNumber: num,
    status: BACKEND_TO_FRONTEND[t.queue_status] ?? "QUEUED",
    queuePosition: t.queue_position,
    createdAt: t.created_at ? new Date(t.created_at) : new Date(),
    startedAt: t.started_at ? new Date(t.started_at) : undefined,
    clinicianId: t.doctor_id !== null ? String(t.doctor_id) : undefined,
    clinicianName: t.doctor_name,
    estimatedWaitMinutes: t.estimated_wait_time ?? 0,
  };
}

function clinicianTicketToAppointment(
  t: BackendTicketClinician,
  clinicianId: number
): Appointment {
  const num = padPos(t.queue_position);
  return {
    id: String(t.ticket_id),
    patientId: String(t.patient_id),
    displayLabel: `${t.patient_name} #${num}`,
    appointmentNumber: num,
    status: BACKEND_TO_FRONTEND[t.queue_status] ?? "QUEUED",
    queuePosition: t.queue_position,
    createdAt: t.check_in_time ? new Date(t.check_in_time) : new Date(),
    startedAt: t.started_at ? new Date(t.started_at) : undefined,
    clinicianId: String(clinicianId),
    estimatedWaitMinutes: t.estimated_wait_time ?? 0,
  };
}

function publicTicketToAppointment(t: BackendTicketPublic): Appointment {
  const num = padPos(t.queue_position);
  return {
    id: String(t.ticket_id),
    patientId: String(t.visit_id),
    displayLabel: `${t.patient_name} #${num}`,
    appointmentNumber: num,
    status: BACKEND_TO_FRONTEND[t.queue_status] ?? "QUEUED",
    queuePosition: t.queue_position,
    createdAt: t.check_in_time ? new Date(t.check_in_time) : new Date(),
    clinicianName: t.doctor_name,
    estimatedWaitMinutes: t.estimated_wait_time ?? 0,
  };
}

// ── Public API functions ──────────────────────────────────────────────────────

export interface AdminQueueResult {
  appointments: Appointment[];
  metrics: QueueMetrics;
}

export async function getAdminQueue(): Promise<AdminQueueResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return {
      appointments: mockAppointments,
      metrics: { currentQueueLength: 3, avgWaitTime: 22, throughputToday: 24, noShowRate: 5.2 },
    };
  }
  const { data } = await apiClient.get<AdminStateResponse>("/queue/admin");
  const appointments = data.queue.map(adminTicketToAppointment);
  const metrics: QueueMetrics = {
    currentQueueLength: data.summary.waiting + data.summary.called + data.summary.in_progress,
    avgWaitTime: Math.round(data.summary.average_wait_time ?? 0),
    throughputToday: data.summary.completed_today ?? 0,
    noShowRate: 0,
  };
  return { appointments, metrics };
}

export async function getClinicianQueue(clinicianId: number): Promise<Appointment[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return mockAppointments.filter((apt) => apt.clinicianId === String(clinicianId));
  }
  const { data } = await apiClient.get<ClinicianStateResponse>(`/queue/clinician/${clinicianId}`);
  return data.queue.map((t) => clinicianTicketToAppointment(t, clinicianId));
}

export async function getPublicQueue(): Promise<Appointment[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return mockAppointments.filter(
      (apt) => apt.status !== "COMPLETED" && apt.status !== "CANCELLED"
    );
  }
  const { data } = await apiClient.get<PublicDisplayStateResponse>("/queue/public-display");
  return data.queue.map(publicTicketToAppointment);
}

export async function updateTicketStatus(
  ticketId: string,
  newStatus: AppointmentStatus
): Promise<void> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return;
  }
  const backendStatus = FRONTEND_TO_BACKEND[newStatus];
  await apiClient.patch(`/appointment/${ticketId}/status`, { status: backendStatus });
}

/** Backward-compatible alias — fetches the full admin queue. */
export async function getAppointments(): Promise<Appointment[]> {
  const { appointments } = await getAdminQueue();
  return appointments;
}

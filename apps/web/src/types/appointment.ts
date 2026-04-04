export type AppointmentStatus = 
  | "QUEUED" 
  | "IN_PROGRESS" 
  | "READY" 
  | "COMPLETED" 
  | "CANCELLED" 
  | "NO_SHOW";

export interface Appointment {
  id: string;
  patientId: string;
  displayLabel: string;
  appointmentNumber: string;
  status: AppointmentStatus;
  queuePosition: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  clinicianId?: string;
  clinicianName?: string;
  estimatedWaitMinutes: number;
}

export interface Clinician {
  id: string;
  name: string;
  specialty: string;
  availableSlots: number;
}

export interface QueueMetrics {
  currentQueueLength: number;
  avgWaitTime: number;
  throughputToday: number;
  noShowRate: number;
}
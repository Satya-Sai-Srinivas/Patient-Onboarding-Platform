import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { Activity, Clock } from "lucide-react";
import { Appointment } from "../../../types/appointment";
import Navigation from "../components/Navigation";
import { getPublicQueue } from "../../../services/http";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 30_000;

export default function WaitingDisplay() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchQueue = () => {
      getPublicQueue()
        .then(setAppointments)
        .catch(() => toast.error("Could not refresh queue. Retrying…"));
    };

    fetchQueue();
    const pollInterval = setInterval(fetchQueue, POLL_INTERVAL_MS);
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const getStatusAppointments = (status: string) => {
    return appointments.filter((apt) => apt.status === status);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation title="Patient Queue Display" />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-hero text-white rounded-2xl p-8 shadow-large">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Activity className="h-12 w-12" />
              <div>
                <h1 className="text-4xl font-bold">Patient Queue</h1>
                <p className="text-white/80 text-lg mt-1">Waiting Room Display</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </div>
              <div className="text-white/80 text-lg">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Queue Sections */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* In Progress */}
          <Card className="p-6 shadow-medium">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-3 w-3 rounded-full bg-status-in-progress animate-pulse-soft" />
              <h2 className="text-xl font-bold text-foreground">In Progress</h2>
              <span className="ml-auto text-2xl font-bold text-status-in-progress">
                {getStatusAppointments("IN_PROGRESS").length}
              </span>
            </div>
            <div className="space-y-3">
              {getStatusAppointments("IN_PROGRESS").map((apt) => (
                <div
                  key={apt.id}
                  className="bg-status-in-progress/10 border-2 border-status-in-progress/30 rounded-xl p-4 animate-fade-in"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold text-status-in-progress">
                      {apt.appointmentNumber}
                    </span>
                    <StatusBadge status={apt.status} size="sm" />
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {apt.displayLabel.split(' #')[0]}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {apt.clinicianName}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Queued */}
          <Card className="p-6 shadow-medium">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-3 w-3 rounded-full bg-status-queued" />
              <h2 className="text-xl font-bold text-foreground">Waiting</h2>
              <span className="ml-auto text-2xl font-bold text-status-queued">
                {getStatusAppointments("QUEUED").length}
              </span>
            </div>
            <div className="space-y-3">
              {getStatusAppointments("QUEUED").map((apt) => (
                <div
                  key={apt.id}
                  className="bg-secondary rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-foreground">
                      {apt.appointmentNumber}
                    </span>
                    <StatusBadge status={apt.status} size="sm" />
                  </div>
                  <p className="text-base font-semibold text-foreground">
                    {apt.displayLabel.split(' #')[0]}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                    <Clock className="h-3 w-3" />
                    <span>~{apt.estimatedWaitMinutes} min wait</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Ready */}
          <Card className="p-6 shadow-medium">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-3 w-3 rounded-full bg-status-ready animate-pulse-soft" />
              <h2 className="text-xl font-bold text-foreground">Ready</h2>
              <span className="ml-auto text-2xl font-bold text-status-ready">
                {getStatusAppointments("READY").length}
              </span>
            </div>
            <div className="space-y-3">
              {getStatusAppointments("READY").map((apt) => (
                <div
                  key={apt.id}
                  className="bg-status-ready/10 border-2 border-status-ready/30 rounded-xl p-4 animate-fade-in"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold text-status-ready">
                      {apt.appointmentNumber}
                    </span>
                    <StatusBadge status={apt.status} size="sm" />
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {apt.displayLabel.split(' #')[0]}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {apt.clinicianName}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Footer Notice */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Please listen for your appointment number • If you have concerns, please see the front desk
          </p>
        </div>
      </div>
    </div>
  );
}
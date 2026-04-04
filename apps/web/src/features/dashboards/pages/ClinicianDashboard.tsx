import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { StatusBadge } from "../components/StatusBadge";
import { 
  Search, 
  Clock, 
  Users, 
  Activity,
  PlayCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { mockClinicians } from "../../../lib/mockData";
import { Appointment, AppointmentStatus } from "../../../types/appointment";
import { toast } from "sonner";
import Navigation from "../components/Navigation";
import { getClinicianQueue, updateTicketStatus } from "../../../services/http";

const CLINICIAN_ID = Number(import.meta.env.VITE_CLINICIAN_ID) || 1;

export default function ClinicianDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const currentClinician = mockClinicians[0];

  useEffect(() => {
    getClinicianQueue(CLINICIAN_ID)
      .then(setAppointments)
      .catch(() => toast.error("Failed to load queue. Showing mock data."))
      .finally(() => setLoading(false));
  }, []);

  const queuedCount = appointments.filter((apt) => apt.status === "QUEUED").length;
  const inProgressCount = appointments.filter((apt) => apt.status === "IN_PROGRESS").length;

  const filteredAppointments = appointments.filter(
    (apt) =>
      apt.displayLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.appointmentNumber.includes(searchQuery)
  );

  const statusMessages: Record<AppointmentStatus, string> = {
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    NO_SHOW: "No show",
    CANCELLED: "Cancelled",
    READY: "Ready",
    QUEUED: "Queued",
  };

  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    const previous = appointments;
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId
          ? {
              ...apt,
              status: newStatus,
              startedAt: newStatus === "IN_PROGRESS" ? new Date() : apt.startedAt,
              completedAt: newStatus === "COMPLETED" ? new Date() : apt.completedAt,
            }
          : apt
      )
    );
    try {
      await updateTicketStatus(appointmentId, newStatus);
      toast.success(statusMessages[newStatus] || "Status updated");
    } catch {
      setAppointments(previous);
      toast.error("Failed to update status. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading queue...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation title="Clinician Dashboard" />

      {/* Stats Header */}
      <div className="bg-card border-b shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <p className="font-semibold text-foreground text-lg">{currentClinician.name}</p>
              <p className="text-sm text-muted-foreground">{currentClinician.specialty}</p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-status-queued" />
                <span className="text-sm text-muted-foreground">Queued:</span>
                <span className="font-semibold text-lg">{queuedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-status-in-progress" />
                <span className="text-sm text-muted-foreground">In Progress:</span>
                <span className="font-semibold text-lg">{inProgressCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Search Bar */}
        <Card className="p-4 mb-6 shadow-soft">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name or appointment number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Appointments List */}
        <div className="grid gap-4">
          {filteredAppointments.map((apt) => (
            <Card
              key={apt.id}
              className="p-6 shadow-medium hover:shadow-large transition-shadow"
            >
              <div className="flex items-start justify-between gap-6">
                {/* Left: Patient Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-primary">
                      {apt.appointmentNumber}
                    </span>
                    <StatusBadge status={apt.status} />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {apt.displayLabel}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Patient ID: {apt.patientId}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        Checked in: {apt.createdAt.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {apt.startedAt && (
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        <span>
                          Started: {apt.startedAt.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {apt.estimatedWaitMinutes > 0 && (
                    <Badge variant="secondary" className="text-sm">
                      Est. wait: {apt.estimatedWaitMinutes} minutes
                    </Badge>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col gap-2 min-w-[180px]">
                  {apt.status === "QUEUED" && (
                    <>
                      <Button
                        onClick={() => handleStatusChange(apt.id, "IN_PROGRESS")}
                        className="bg-status-in-progress hover:bg-status-in-progress/90 text-white gap-2"
                      >
                        <PlayCircle className="h-4 w-4" />
                        Start Appointment
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleStatusChange(apt.id, "NO_SHOW")}
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Mark No-Show
                      </Button>
                    </>
                  )}
                  
                  {apt.status === "IN_PROGRESS" && (
                    <>
                      <Button
                        onClick={() => handleStatusChange(apt.id, "COMPLETED")}
                        className="bg-status-completed hover:bg-status-completed/90 text-white gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Complete
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleStatusChange(apt.id, "CANCELLED")}
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel
                      </Button>
                    </>
                  )}
                  
                  {(apt.status === "COMPLETED" || apt.status === "CANCELLED" || apt.status === "NO_SHOW") && (
                    <Badge variant="secondary" className="text-center py-2">
                      {apt.status === "COMPLETED" ? "Completed" : 
                       apt.status === "CANCELLED" ? "Cancelled" : "No-Show"}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {filteredAppointments.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No appointments found</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
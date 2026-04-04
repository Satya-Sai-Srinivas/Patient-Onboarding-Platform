import { useState, useEffect } from "react";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";

import { 
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  Download,
  Calendar
} from "lucide-react";
import { mockClinicians } from "../../../lib/mockData";
import { Appointment, QueueMetrics } from "../../../types/appointment";
import Navigation from "../components/Navigation";
import { getAdminQueue } from "../../../services/http";

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [metrics, setMetrics] = useState<QueueMetrics>({
    currentQueueLength: 0,
    avgWaitTime: 0,
    throughputToday: 0,
    noShowRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminQueue()
      .then(({ appointments: apts, metrics: m }) => {
        setAppointments(apts);
        setMetrics(m);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const noShowToday = appointments.filter((apt) => apt.status === "NO_SHOW").length;

  const handleExportCSV = () => {
    // Simple CSV export simulation
    const csvContent = [
      ["Appointment #", "Patient", "Status", "Clinician", "Check-in Time", "Completed Time"],
      ...appointments.map((apt) => [
        apt.appointmentNumber,
        apt.displayLabel,
        apt.status,
        apt.clinicianName || "Unassigned",
        apt.createdAt.toISOString(),
        apt.completedAt?.toISOString() || "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation title="Admin Dashboard" />
      <div className="bg-card border-b shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">System Analytics & Management</h1>
            </div>
            <Button onClick={handleExportCSV} className="gap-2 bg-primary hover:bg-primary-hover">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6 shadow-medium">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Queue</p>
                <p className="text-4xl font-bold text-foreground">{metrics.currentQueueLength}</p>
                <p className="text-xs text-muted-foreground mt-2">patients waiting</p>
              </div>
              <div className="bg-status-queued/10 p-3 rounded-xl">
                <Users className="h-6 w-6 text-status-queued" />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-medium">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Wait Time</p>
                <p className="text-4xl font-bold text-foreground">{metrics.avgWaitTime}</p>
                <p className="text-xs text-muted-foreground mt-2">minutes</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-xl">
                <Clock className="h-6 w-6 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-medium">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Throughput Today</p>
                <p className="text-4xl font-bold text-foreground">{metrics.throughputToday}</p>
                <p className="text-xs text-status-completed mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% vs yesterday
                </p>
              </div>
              <div className="bg-status-completed/10 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6 text-status-completed" />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-medium">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">No-Show Rate</p>
                <p className="text-4xl font-bold text-foreground">{metrics.noShowRate}%</p>
                <p className="text-xs text-muted-foreground mt-2">{noShowToday} no-shows today</p>
              </div>
              <div className="bg-destructive/10 p-3 rounded-xl">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </Card>
        </div>

        {/* Clinician Performance */}
        <Card className="p-6 shadow-medium">
          <h2 className="text-xl font-bold text-foreground mb-6">Clinician Overview</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockClinicians.map((clinician) => {
              const clinicianAppts = appointments.filter(
                (apt) => apt.clinicianId === clinician.id
              );
              const completed = clinicianAppts.filter((apt) => apt.status === "COMPLETED").length;
              const inProgress = clinicianAppts.filter((apt) => apt.status === "IN_PROGRESS").length;
              const queued = clinicianAppts.filter((apt) => apt.status === "QUEUED").length;

              return (
                <div key={clinician.id} className="bg-secondary rounded-xl p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{clinician.name}</h3>
                    <p className="text-xs text-muted-foreground">{clinician.specialty}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="font-semibold text-status-completed">{completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">In Progress:</span>
                      <span className="font-semibold text-status-in-progress">{inProgress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Queued:</span>
                      <span className="font-semibold text-status-queued">{queued}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Appointments */}
        <Card className="p-6 shadow-medium">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Recent Appointments</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString('en-US', { 
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Appointment #
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Patient
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Clinician
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Check-in Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Wait Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => {
                  const waitTime = apt.startedAt
                    ? Math.round((apt.startedAt.getTime() - apt.createdAt.getTime()) / 60000)
                    : null;

                  return (
                    <tr key={apt.id} className="border-b hover:bg-secondary/50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-mono font-semibold text-primary">
                          {apt.appointmentNumber}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-foreground">{apt.displayLabel}</td>
                      <td className="py-4 px-4">
                        <StatusBadge status={apt.status} size="sm" />
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {apt.clinicianName || "Unassigned"}
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {apt.createdAt.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {waitTime !== null ? `${waitTime} min` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

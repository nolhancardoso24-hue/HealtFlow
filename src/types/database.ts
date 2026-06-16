export type Specialty =
  | "Médecin"
  | "Kiné"
  | "Ostéopathe"
  | "Masseuse"
  | "Nutritionniste"
  | "Coach"
  | "Autre";

export type PatientStatus = "active" | "inactive" | "archived";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no-show";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ExercisesDone = "yes" | "partial" | "no";

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  specialty: Specialty;
  cabinet_name: string | null;
  hours_start: string | null;
  hours_end: string | null;
  days_closed: number[];
  session_duration_minutes: number;
  language: string;
  timezone: string;
  email_reminders: boolean;
  sms_reminders: boolean;
  subscription_plan: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  practitioner_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string | null;
  phone: string | null;
  chief_complaint: string;
  medical_history: string | null;
  contraindications: string | null;
  allergies: string | null;
  tags: string[];
  age_group: string | null;
  status: PatientStatus;
  total_appointments: number;
  last_appointment_date: string | null;
  risk_score: number;
  risk_level: RiskLevel;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  practitioner_id: string;
  date_time: string;
  duration_minutes: number;
  reason: string | null;
  notes: string | null;
  status: AppointmentStatus;
  is_absent: boolean;
  reminder_sent: boolean;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
}

export interface Questionnaire {
  id: string;
  appointment_id: string;
  patient_id: string;
  relief_level: number | null;
  side_effects: boolean | null;
  side_effects_description: string | null;
  current_pain: number | null;
  exercises_done: ExercisesDone | null;
  comments: string | null;
  mobility_score: number | null;
  sleep_quality: number | null;
  activity_level: string | null;
  created_at: string;
  submitted_at: string | null;
}

export interface DashboardStats {
  appointmentsToday: number;
  activePatients: number;
  questionnaireCompletionRate: number;
  weeklyProgress: number;
  todayAppointments: Appointment[];
  alerts: DashboardAlert[];
  appointmentsByDay: { date: string; count: number }[];
}

export interface DashboardAlert {
  type: "risk" | "trend" | "action";
  message: string;
}

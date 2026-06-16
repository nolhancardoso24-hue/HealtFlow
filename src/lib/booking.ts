import { addDays, format, getDay, startOfDay } from "date-fns";
import type { Appointment, Profile } from "@/types/database";

export interface BookingSlot {
  time: string;
  label: string;
}

export interface BookingDateOption {
  date: string;
  label: string;
  availableCount: number;
  isClosed: boolean;
}

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(value: number) {
  const hours = String(Math.floor(value / 60)).padStart(2, "0");
  const minutes = String(value % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getBookingWeekday(date: Date) {
  const weekday = getDay(date);
  return weekday === 0 ? 6 : weekday - 1;
}

export function isBookingDayClosed(profile: Partial<Profile>, date: Date) {
  return (profile.days_closed ?? []).includes(getBookingWeekday(date));
}

function overlaps(slotStart: number, slotEnd: number, appointmentStart: number, appointmentEnd: number) {
  return slotStart < appointmentEnd && slotEnd > appointmentStart;
}

export function getAvailableSlotsForDate({
  profile,
  appointments,
  date,
}: {
  profile: Partial<Profile>;
  appointments: Pick<Appointment, "date_time" | "duration_minutes" | "status">[];
  date: Date;
}) {
  const hoursStart = profile.hours_start?.slice(0, 5) ?? "09:00";
  const hoursEnd = profile.hours_end?.slice(0, 5) ?? "18:00";
  const duration = profile.session_duration_minutes ?? 45;

  if (isBookingDayClosed(profile, date)) {
    return [];
  }

  const openingMinutes = timeToMinutes(hoursStart);
  const closingMinutes = timeToMinutes(hoursEnd);

  if (closingMinutes <= openingMinutes || duration <= 0) {
    return [];
  }

  const slots: BookingSlot[] = [];

  for (let slotStart = openingMinutes; slotStart + duration <= closingMinutes; slotStart += duration) {
    const slotEnd = slotStart + duration;
    const hasOverlap = appointments.some((appointment) => {
      if (appointment.status === "cancelled") {
        return false;
      }

      const appointmentDate = new Date(appointment.date_time);
      const appointmentStart = appointmentDate.getHours() * 60 + appointmentDate.getMinutes();
      const appointmentEnd = appointmentStart + appointment.duration_minutes;

      return overlaps(slotStart, slotEnd, appointmentStart, appointmentEnd);
    });

    if (!hasOverlap) {
      const time = minutesToTime(slotStart);
      slots.push({ time, label: time });
    }
  }

  return slots;
}

export function getBookingDateOptions({
  profile,
  appointments,
  startDate = new Date(),
  days = 14,
}: {
  profile: Partial<Profile>;
  appointments: Pick<Appointment, "date_time" | "duration_minutes" | "status">[];
  startDate?: Date;
  days?: number;
}) {
  const start = startOfDay(startDate);

  return Array.from({ length: days }, (_, index) => addDays(start, index)).map((date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dayAppointments = appointments.filter(
      (appointment) => format(new Date(appointment.date_time), "yyyy-MM-dd") === dateKey
    );
    const slots = getAvailableSlotsForDate({ profile, appointments: dayAppointments, date });

    return {
      date: dateKey,
      label: format(date, "EEEE d MMMM"),
      availableCount: slots.length,
      isClosed: slots.length === 0,
    } satisfies BookingDateOption;
  });
}

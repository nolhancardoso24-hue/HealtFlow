import { format } from "date-fns";
import { NextResponse } from "next/server";
import { getAvailableSlotsForDate, getBookingDateOptions } from "@/lib/booking";
import { updatePatientTags } from "@/lib/segmentation";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizePhone(value: string | null | undefined) {
  return value ? value.replace(/[^\d+]/g, "") : null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ practitionerId: string }> }
) {
  const { practitionerId } = await params;
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const requestedDate = searchParams.get("date");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", practitionerId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Praticien introuvable" }, { status: 404 });
  }

  const today = new Date();
  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("date_time, duration_minutes, status")
    .eq("practitioner_id", practitionerId)
    .gte("date_time", `${format(today, "yyyy-MM-dd")}T00:00:00`)
    .order("date_time");

  if (appointmentsError) {
    return NextResponse.json({ error: appointmentsError.message }, { status: 500 });
  }

  const dateOptions = getBookingDateOptions({
    profile,
    appointments: appointments ?? [],
    startDate: today,
  });

  const selectedDate =
    requestedDate && dateOptions.some((option) => option.date === requestedDate)
      ? requestedDate
      : dateOptions.find((option) => option.availableCount > 0)?.date ?? dateOptions[0]?.date ?? "";

  const slots = selectedDate
    ? getAvailableSlotsForDate({
        profile,
        appointments: (appointments ?? []).filter(
          (appointment) => format(new Date(appointment.date_time), "yyyy-MM-dd") === selectedDate
        ),
        date: new Date(`${selectedDate}T12:00:00`),
      })
    : [];

  return NextResponse.json({
    practitioner: {
      id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`.trim(),
      specialty: profile.specialty,
      cabinetName: profile.cabinet_name,
      hoursStart: profile.hours_start,
      hoursEnd: profile.hours_end,
      sessionDuration: profile.session_duration_minutes ?? 45,
    },
    dateOptions,
    selectedDate,
    slots,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ practitionerId: string }> }
) {
  const { practitionerId } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  if (!body.first_name || !body.last_name || !body.date || !body.time || !body.date_of_birth) {
    return NextResponse.json({ error: "Informations incomplètes" }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", practitionerId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Praticien introuvable" }, { status: 404 });
  }

  const { data: dayAppointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("date_time, duration_minutes, status")
    .eq("practitioner_id", practitionerId)
    .gte("date_time", `${body.date}T00:00:00`)
    .lte("date_time", `${body.date}T23:59:59`);

  if (appointmentsError) {
    return NextResponse.json({ error: appointmentsError.message }, { status: 500 });
  }

  const availableSlots = getAvailableSlotsForDate({
    profile,
    appointments: dayAppointments ?? [],
    date: new Date(`${body.date}T12:00:00`),
  });

  if (!availableSlots.some((slot) => slot.time === body.time)) {
    return NextResponse.json({ error: "Ce créneau n'est plus disponible" }, { status: 409 });
  }

  const normalizedEmail = body.email?.trim().toLowerCase() || null;
  const normalizedPhone = normalizePhone(body.phone);

  let patient = null;

  if (normalizedEmail) {
    const { data } = await supabase
      .from("patients")
      .select("*")
      .eq("practitioner_id", practitionerId)
      .eq("email", normalizedEmail)
      .maybeSingle();
    patient = data;
  }

  if (!patient && normalizedPhone) {
    const { data } = await supabase
      .from("patients")
      .select("*")
      .eq("practitioner_id", practitionerId)
      .eq("phone", normalizedPhone)
      .maybeSingle();
    patient = data;
  }

  if (!patient) {
    const segmentation = updatePatientTags({
      date_of_birth: body.date_of_birth,
      chief_complaint: body.reason || "Réservation en ligne",
      medical_history: body.notes || null,
    });

    const { data, error } = await supabase
      .from("patients")
      .insert({
        practitioner_id: practitionerId,
        first_name: body.first_name,
        last_name: body.last_name,
        date_of_birth: body.date_of_birth,
        email: normalizedEmail,
        phone: normalizedPhone,
        chief_complaint: body.reason || "Réservation en ligne",
        medical_history: body.notes || null,
        tags: segmentation.tags,
        age_group: segmentation.age_group,
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Création patient impossible" }, { status: 500 });
    }

    patient = data;
  }

  const dateTime = new Date(`${body.date}T${body.time}:00`);
  const { error: appointmentError } = await supabase.from("appointments").insert({
    patient_id: patient.id,
    practitioner_id: practitionerId,
    date_time: dateTime.toISOString(),
    duration_minutes: profile.session_duration_minutes ?? 45,
    reason: body.reason || "Réservation en ligne",
    notes: body.notes || null,
    status: "scheduled",
  });

  if (appointmentError) {
    return NextResponse.json({ error: appointmentError.message }, { status: 500 });
  }

  await supabase.from("notifications").insert({
    practitioner_id: practitionerId,
    type: "info",
    title: "Nouvelle réservation en ligne",
    message: `${body.first_name} ${body.last_name} a demandé le ${body.date} à ${body.time}.`,
    link: "/calendar",
    is_read: false,
  });

  return NextResponse.json({
    success: true,
    date: body.date,
    time: body.time,
  });
}

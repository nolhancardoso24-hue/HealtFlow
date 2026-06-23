import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  assertPatientOwnedByPractitioner,
  getPractitionerId,
} from "@/lib/api/practitioner";
import { buildDocumentStoragePath } from "@/lib/storage/document-path";

export async function POST(request: Request) {
  const supabase = await createClient();
  const practitionerId = await getPractitionerId(supabase);

  if (!practitionerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const patientId = formData.get("patient_id") as string;
  const appointmentId = formData.get("appointment_id") as string | null;
  const docType = (formData.get("doc_type") as string) || "report";

  if (!file || !patientId) {
    return NextResponse.json({ error: "File and patient_id required" }, { status: 400 });
  }

  const ownsPatient = await assertPatientOwnedByPractitioner(
    supabase,
    patientId,
    practitionerId
  );
  if (!ownsPatient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const filePath = buildDocumentStoragePath(
    practitionerId,
    patientId,
    file.name,
    docType
  );

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("healthflow-documents")
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      patient_id: patientId,
      practitioner_id: practitionerId,
      appointment_id: appointmentId || null,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      doc_type: docType,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from("healthflow-documents").remove([filePath]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const practitionerId = await getPractitionerId(supabase);
  if (!practitionerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patient_id");

  let query = supabase
    .from("documents")
    .select("*")
    .eq("practitioner_id", practitionerId)
    .order("created_at", { ascending: false });

  if (patientId) query = query.eq("patient_id", patientId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const docsWithUrls = await Promise.all(
    (data ?? []).map(async (doc) => {
      const { data: signedUrl } = await supabase.storage
        .from("healthflow-documents")
        .createSignedUrl(doc.file_path, 3600);
      return { ...doc, url: signedUrl?.signedUrl };
    })
  );

  return NextResponse.json(docsWithUrls);
}

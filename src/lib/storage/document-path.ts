/** Chemin Storage : documents/{practitionerId}/{patientId}/{filename} */
export function buildDocumentStoragePath(
  practitionerId: string,
  patientId: string,
  originalFileName: string,
  docType: string
): string {
  const ext = originalFileName.split(".").pop() || "bin";
  const filename = `${Date.now()}_${docType}.${ext}`;
  return `documents/${practitionerId}/${patientId}/${filename}`;
}

export function appointmentReminderHtml(params: {
  patientName: string;
  practitionerName: string;
  dateFormatted: string;
  confirmLink?: string;
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Rappel RDV</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#0066CC;padding:24px 32px;">
      <h1 style="color:#fff;font-size:22px;margin:0;">❤️ HealthFlow</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="font-size:18px;color:#1e293b;margin:0 0 16px;">Rappel de votre rendez-vous</h2>
      <p style="color:#475569;line-height:1.6;">Bonjour <strong>${params.patientName}</strong>,</p>
      <p style="color:#475569;line-height:1.6;">
        Petit rappel: vous avez rendez-vous <strong>demain</strong> à ${params.dateFormatted} 
        chez <strong>${params.practitionerName}</strong>.
      </p>
      ${params.confirmLink ? `
      <div style="text-align:center;margin:32px 0;">
        <a href="${params.confirmLink}" style="background:#0066CC;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
          Confirmer ma présence
        </a>
      </div>
      ` : ""}
      <p style="color:#94a3b8;font-size:13px;">À demain!</p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">HealthFlow — Plateforme pour praticiens de santé</p>
    </div>
  </div>
</body>
</html>`;
}

export function questionnaireInviteHtml(params: {
  patientName: string;
  practitionerName: string;
  link: string;
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Questionnaire post-séance</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#0066CC;padding:24px 32px;">
      <h1 style="color:#fff;font-size:22px;margin:0;">❤️ HealthFlow</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="font-size:18px;color:#1e293b;margin:0 0 16px;">Comment vous sentez-vous?</h2>
      <p style="color:#475569;line-height:1.6;">Bonjour <strong>${params.patientName}</strong>,</p>
      <p style="color:#475569;line-height:1.6;">
        Merci pour votre visite chez <strong>${params.practitionerName}</strong>.
        Prenez 2 minutes pour nous dire comment vous allez depuis la séance.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${params.link}" style="background:#10B981;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
          Remplir le questionnaire
        </a>
      </div>
      <p style="color:#94a3b8;font-size:13px;">Ce lien expire dans 7 jours.</p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">HealthFlow — Plateforme pour praticiens de santé</p>
    </div>
  </div>
</body>
</html>`;
}

export function questionnaireFollowUpHtml(params: {
  patientName: string;
  link: string;
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Votre avis nous intéresse</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#0066CC;padding:24px 32px;">
      <h1 style="color:#fff;font-size:22px;margin:0;">❤️ HealthFlow</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#475569;line-height:1.6;">Bonjour <strong>${params.patientName}</strong>,</p>
      <p style="color:#475569;line-height:1.6;">
        Nous aimerions connaître votre ressenti après votre dernière séance. 
        Ça vous prend moins de 2 minutes!
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${params.link}" style="background:#0066CC;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
          Répondre maintenant
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function exerciseReminderHtml(params: {
  patientName: string;
  exercises: string[];
  nextAppointmentDate?: string;
}) {
  const exerciseList = params.exercises.map((e) => `<li style="margin:4px 0;color:#475569;">${e}</li>`).join("");
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>N'oubliez pas vos exercices</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#10B981;padding:24px 32px;">
      <h1 style="color:#fff;font-size:22px;margin:0;">💪 Rappel exercices</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#475569;line-height:1.6;">Bonjour <strong>${params.patientName}</strong>,</p>
      <p style="color:#475569;line-height:1.6;">Pensez à faire vos exercices:</p>
      <ul style="margin:16px 0;">${exerciseList}</ul>
      ${params.nextAppointmentDate ? `<p style="color:#475569;">Prochain RDV: <strong>${params.nextAppointmentDate}</strong></p>` : ""}
      <p style="color:#94a3b8;font-size:13px;">Le respect du programme améliore vos résultats!</p>
    </div>
  </div>
</body>
</html>`;
}

const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  return transporter;
}

async function notifyNewSubmission(submission) {
  const to = process.env.OPS_NOTIFY_TO;
  const from = process.env.SMTP_FROM;
  const tx = getTransporter();

  if (!tx || !to || !from) return { sent: false, reason: "smtp_not_configured" };

  const subject = `[BFC] New ${submission.source} submission ${submission.public_id}`;
  const lines = [
    `Public ID: ${submission.public_id}`,
    `Source: ${submission.source}`,
    `Status: ${submission.status}`,
    `Name: ${submission.name || "-"}`,
    `Email: ${submission.email || "-"}`,
    `Phone: ${submission.phone || "-"}`,
    `From: ${submission.route_from || "-"}`,
    `To: ${submission.route_to || "-"}`,
    `Departure: ${submission.departure_date || "-"}`,
    `Return: ${submission.return_date || "-"}`,
    `Passengers: ${submission.passengers ?? "-"}`,
    `Notes: ${submission.notes || "-"}`,
    `Created: ${submission.created_at}`
  ];

  await tx.sendMail({
    from,
    to,
    subject,
    text: lines.join("\n")
  });

  return { sent: true };
}

module.exports = {
  notifyNewSubmission
};

import { query, queryOne } from "@/lib/db";
import { newObjectId } from "@/lib/objectId";
import { sendEmailWithPdfFromS3, sendAdminNotificationEmail } from "@/lib/mail";

const toDoc = (row) =>
  row && {
    _id: row.id,
    name: row.name,
    email: row.email,
    quiz: row.quiz ?? [],
    result: row.result ?? [],
    pdfUrl: row.pdfUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };

const saveUserData = async (data) => {
  const id = newObjectId();
  const now = new Date();

  await query(
    `INSERT INTO users (id, name, email, quiz, result, pdfUrl, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name?.trim() ?? null,
      data.email?.trim().toLowerCase() ?? null,
      JSON.stringify(data.quiz ?? []),
      JSON.stringify(data.result ?? []),
      data.pdfUrl?.trim() ?? null,
      now,
      now,
    ]
  );

  // Not awaited: the report PDF is several MB and the two sends together take
  // ~40s, which is longer than the browser (or any serverless host) will wait.
  // The submission is already saved, so the mail runs in the background and a
  // failure is logged rather than surfaced to the user.
  sendEmailWithPdfFromS3(data.email, data.name, data.pdfUrl)
    .then(() => console.log(`Email sent successfully to ${data.email}`))
    .catch((err) => console.error(`Background email error: ${err.message}`));

  sendAdminNotificationEmail(data.email, data.name, data.pdfUrl)
    .then(() => console.log("Admin email sent successfully"))
    .catch((err) => console.error(`Admin background email error: ${err.message}`));

  return getUserById(id);
};

const getUserById = async (id) =>
  toDoc(await queryOne(`SELECT * FROM users WHERE id = ?`, [id]));

const userServices = { saveUserData, getUserById };
export default userServices;

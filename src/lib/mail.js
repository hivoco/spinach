import path from "node:path";
import fs from "node:fs";
import nodemailer from "nodemailer";

/**
 * The report email and the admin notification, in the Spinach theme
 * (colours from src/app/globals.css; web fonts don't load reliably in email).
 */
const globalForMail = globalThis;

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

export const transporter =
  globalForMail.__archetypeTransporter || createTransporter();

if (!globalForMail.__archetypeTransporter) {
  globalForMail.__archetypeTransporter = transporter;
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dipti@spinachlearn.com";
const CONTACT_EMAIL = "dipti@spinachlearn.com";
const WEBSITE_URL = "https://www.spinachlearn.com";
const WEBSITE_LABEL = "www.spinachlearn.com";

const TEAL = "#2f6f6a";
const INK = "#2e3440";
const MIST = "#edf0ed";
const MILK = "#f5f4f1";

// The logo is attached inline (cid:) so the mail carries it and depends on no
// external host. PNG, because some mail clients can't show WebP.
const LOGO_PATH = path.join(process.cwd(), "public", "images", "logo.png");
const LOGO_CID = "spinach-logo";

const logoAttachment = () =>
  fs.existsSync(LOGO_PATH)
    ? [{ filename: "logo.png", path: LOGO_PATH, cid: LOGO_CID }]
    : [];

// Names and emails are typed by whoever takes the quiz, so they must not be able to add markup to a mail.
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );

/** The shared layout: logo on a white card over the site's mist background, with a teal bar on top. */
const emailLayout = (title, content) => `<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
</head>

<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:${MIST};">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${MIST}">
        <tr>
            <td align="center" style="padding: 40px 12px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border-top: 6px solid ${TEAL};">
                    <!-- Logo Row -->
                    <tr>
                        <td align="left" style="padding: 32px 32px 20px 32px;">
                            <img src="cid:${LOGO_CID}" width="160"
                                alt="Spinach"
                                style="display: block; width: 160px; max-width: 100%; height: auto; border: 0;" />
                        </td>
                    </tr>
                    <!-- Content Row -->
                    <tr>
                        <td align="left" style="padding: 0 32px 32px 32px; color: ${INK}; font-size: 16px; line-height: 1.6;">
${content}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>`;

const sendEmailWithPdfFromS3 = async (toEmail, firstName, s3PdfUrl) => {
  try {
    // Step 1: Download PDF from S3 as buffer
    const pdfResponse = await fetch(s3PdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    const mailOptions = {
      from: `"Spinach"<${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Your Career Archetype Quiz Results Are Here!",
      html: emailLayout(
        "Your Career Archetype Quiz Results",
        `                            <p style="margin-top: 0;">Hi <strong>${escapeHtml(firstName)}</strong>,</p>

                            <p>Thank you for taking the <strong style="color: ${TEAL};">Career Archetype Quiz</strong>!</p>

                            <p>
                                Attached to this email, you'll find your personalized report — a snapshot of your unique
                                career personality, what drives you at work, and how you can make more aligned and
                                confident career choices.
                            </p>

                            <p>
                                We hope this helps you reflect, realign, and take your next step with greater clarity.
                            </p>

                            <p>
                                If you'd like to explore your results further or have a deeper conversation about your
                                career direction with a coach, reach out to us at
                                <a href="mailto:${CONTACT_EMAIL}" style="color: ${TEAL};">${CONTACT_EMAIL}</a>.
                            </p>

                            <p style="margin-bottom: 0;">Warm regards,</p>
                            <p style="margin-top: 0;"><strong>Team Spinach</strong></p>

                            <p style="margin-bottom: 0;"><a href="${WEBSITE_URL}" style="color: ${TEAL};">${WEBSITE_LABEL}</a></p>`
      ),
      attachments: [
        {
          filename: "Career-Archetype-Report.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
        ...logoAttachment(),
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (err) {
    console.error("Error sending email:", err);
  }
};

const sendAdminNotificationEmail = async (userEmail, userName, s3PdfUrl) => {
  try {
    // Extract archetype name from S3 URL for more informative admin notification
    const pdfFileName = s3PdfUrl.split("/").pop();
    const archetypeName = decodeURIComponent(pdfFileName.replace(".pdf", ""));
    const email = escapeHtml(userEmail);
    const rowLabel = `padding: 12px; background-color: ${MILK}; border-bottom: 1px solid ${MIST}; font-weight: bold; width: 110px;`;
    const rowValue = `padding: 12px; border-bottom: 1px solid ${MIST};`;

    const mailOptions = {
      from: `"Spinach Quiz Submissions"<${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL, // Admin email
      subject: "New Career Archetype Quiz Submission",
      html: emailLayout(
        "New Career Archetype Quiz Submission",
        `                            <h2 style="margin: 0 0 12px 0; color: ${TEAL}; font-size: 22px; line-height: 1.3;">New Quiz Submission</h2>

                            <p style="margin-top: 0;">A new user has completed the Career Archetype Quiz:</p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 20px 0; font-size: 15px;">
                                <tr>
                                    <td style="${rowLabel}">Name:</td>
                                    <td style="${rowValue}">${escapeHtml(userName)}</td>
                                </tr>
                                <tr>
                                    <td style="${rowLabel}">Email:</td>
                                    <td style="${rowValue}">
                                        <a href="mailto:${email}" style="color: ${TEAL};">${email}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="${rowLabel}">Archetype:</td>
                                    <td style="${rowValue}">${escapeHtml(archetypeName)}</td>
                                </tr>
                            </table>

                            <p>
                                <a href="${escapeHtml(s3PdfUrl)}" style="display: inline-block; background-color: ${TEAL}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 24px; font-weight: bold;">View PDF Report</a>
                            </p>

                            <p style="margin: 20px 0 0 0; color: ${INK}; opacity: 0.65; font-size: 14px;">This is an automated notification from the Career Archetype Quiz system.</p>`
      ),
      attachments: logoAttachment(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Admin notification email sent:", info.response);
    return info;
  } catch (err) {
    console.error("Error sending admin notification email:", err);
    throw err;
  }
};

export { sendEmailWithPdfFromS3, sendAdminNotificationEmail };

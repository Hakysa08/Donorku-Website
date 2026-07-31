import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to: string, otp: string) {
  await transporter.sendMail({
    from: `"Donorku" <${process.env.SMTP_USER}>`,
    to,
    subject: "Kode Verifikasi Reset Password - Donorku",
    html: `
      <div style="font-family: sans-serif; padding: 24px;">
        <h2 style="color: #DC2626;">Donorku</h2>
        <p>Kami menerima permintaan reset password untuk akun kamu.</p>
        <p>Masukkan kode berikut untuk melanjutkan:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 16px 0;">
          ${otp}
        </div>
        <p>Kode ini berlaku selama 10 menit. Jangan bagikan kode ini ke siapa pun.</p>
      </div>
    `,
  });
}
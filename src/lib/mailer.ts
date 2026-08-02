import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(to: string, otp: string) {
  await resend.emails.send({
    from: "Donorku <noreply@donorku.site>",
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
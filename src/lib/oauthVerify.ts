import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export type ProfilOAuth = {
  provider: "google" | "facebook";
  provider_id: string;
  nama_lengkap: string;
  email: string;
};

export async function verifikasiGoogleToken(idToken: string): Promise<ProfilOAuth> {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error("Token Google tidak valid");
  }

  return {
    provider: "google",
    provider_id: payload.sub,
    nama_lengkap: payload.name ?? payload.email,
    email: payload.email,
  };
}

export async function verifikasiFacebookToken(accessToken: string): Promise<ProfilOAuth> {
  const res = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
  );

  if (!res.ok) {
    throw new Error("Token Facebook tidak valid");
  }

  const data = await res.json();

  if (!data.email) {
    throw new Error("Akun Facebook tidak memiliki email terverifikasi");
  }

  return {
    provider: "facebook",
    provider_id: data.id,
    nama_lengkap: data.name ?? data.email,
    email: data.email,
  };
}
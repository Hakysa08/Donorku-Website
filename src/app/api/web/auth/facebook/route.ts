import { NextResponse } from "next/server";

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/web/auth/facebook/callback`,
    scope: "email,public_profile",
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
  );
}
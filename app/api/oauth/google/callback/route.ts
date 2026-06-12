import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Authorization code missing" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.json();
      return NextResponse.json(
        { error: "Google token exchange failed", details: errorBody },
        { status: response.status }
      );
    }

    const tokens = await response.json();
    const refreshToken = tokens.refresh_token;
    const accessToken = tokens.access_token;
    console.log("GOOGLE TOKENS RECEIVED");

    console.log({
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
      refreshTokenExists: !!refreshToken,
      accessTokenExists: !!accessToken,
    });

    // call backend api
    try {
      const result = await api.updateTokensInDB({ refreshToken, accessToken });
      console.log("Backend response:", result);
    } catch (dbError) {
      console.error("Failed to update tokens in database:", dbError);
      // We continue to redirect even if DB update fails, or you can return an error here
    }

    // Redirect to the admin page using 302 (Found) instead of default 307
    const adminUrl = new URL("/admin", request.nextUrl.origin);
    return NextResponse.redirect(adminUrl, 302);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to exchange token" },
      { status: 500 }
    );
  }
}
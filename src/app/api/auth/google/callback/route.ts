import { googleOAuthClient } from "@/lib/googleOAuth";
import { lucia } from "@/lib/lucia";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return new Response("Invalid request", { status: 400 });
  }
  const codeVerifier = cookies().get("code_verifier")?.value;
  const savedState = cookies().get("state")?.value;
  if (!codeVerifier) {
    return new Response("Invalid request", { status: 400 });
  }
  if (state !== savedState) {
    return new Response("Invalid request", { status: 400 });
  }

  const { accessToken } = await googleOAuthClient.validateAuthorizationCode(
    code,
    codeVerifier
  );
  const googleRes = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
  );
  const googleData = (await googleRes.json()) as {
    id: string;
    email: string;
    name: string;
    picture: string;
  };

  let userId: string = "";
  const existingUser = await prisma.user.findFirst({
    where: {
      email: googleData.email,
    },
  });

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const user = await prisma.user.create({
      data: {
        email: googleData.email,
        firstName: googleData.name.split(" ")[0],
        lastName: googleData.name.split(" ")[1],
        picture: googleData.picture,
      },
    });

    userId = user.id;
  }

  // Check if the user has an active session
  const existingSession = await prisma.session.findFirst({
    where: {
      userId: userId,
      expiresAt: {
        gte: new Date(),
      },
    },
  });

  let sessionId;
  if (existingSession) {
    sessionId = existingSession.id;
  } else {
    // Create a new session if none exists
    const session = await lucia.createSession(userId, {});
    sessionId = session.id;
  }

  // Set the session cookie
  const sessionCookie = await lucia.createSessionCookie(sessionId);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
  return redirect("/dashboard");
}

"use server";

import { z } from "zod";
import { signUpSchema } from "../auth/signup/page";
import { prisma } from "@/lib/prisma";
import { Argon2id } from "oslo/password";
import { lucia } from "@/lib/lucia";
import { cookies } from "next/headers";
import { signInSchema } from "../auth/login/page";
import { redirect } from "next/navigation";
import { generateCodeVerifier, generateState } from "arctic";
import { googleOAuthClient } from "@/lib/googleOAuth";

export const signUp = async (data: z.infer<typeof signUpSchema>) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      return { error: "User already exists", success: false };
    }

    //hash password
    const hashedPassword = await new Argon2id().hash(data.password);

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
      },
    });

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = await lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return { success: true };
  } catch (error) {
    return { error: "An error occurred", success: false };
  }
};

export const signIn = async (data: z.infer<typeof signInSchema>) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    //check credentials
    if (!user || !user.password) {
      return { error: "Invalid credentials", success: false };
    }
    const validatedPass = await new Argon2id().verify(
      user.password,
      data.password
    );
    if (!validatedPass) {
      return { error: "Invalid credentials", success: false };
    }

    //check is user has an active session
    const existingSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    let sessionId;
    if (existingSession) {
      sessionId = existingSession.id;
    } else {
      //create a new session
      const session = await lucia.createSession(user.id, {});
      sessionId = session.id;
    }

    const sessionCookie = await lucia.createSessionCookie(sessionId);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
    return { success: true };
  } catch (error) {
    return { error: "An error occurred", success: false };
  }
};

//Sign out action

export const signOut = async () => {
  const sessionCookie = await lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
  return redirect("/auth/login");
};

//Google OAuth

export const getGoogleOAuthConsentUrl = async () => {
  try {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    cookies().set("code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    cookies().set("state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    const authUrl = await googleOAuthClient.createAuthorizationURL(
      state,
      codeVerifier,
      {
        scopes: ["profile", "email"],
      }
    );

    return { success: true, url: authUrl.toString() };
  } catch (error) {
    return { error: "An error occurred", success: false };
  }
};

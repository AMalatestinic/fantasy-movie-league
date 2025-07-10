import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/userModel";
import NextAuth from "next-auth";

import type { DefaultUser, Session } from "next-auth";

// Ensures the necessary environment variables are set
if (
  !process.env.GOOGLE_CLIENT_ID ||
  !process.env.GOOGLE_CLIENT_SECRET ||
  !process.env.NEXTAUTH_SECRET
) {
  throw new Error("Missing environment variables for NextAuth configuration");
}

// This file configures NextAuth.js for authentication using Google OAuth
// It connects to a MongoDB database to manage user data and sessions.
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }: { user: DefaultUser }) {
      try {
        await dbConnect();
        let dbUser = await User.findOne({ email: user.email });

        if (!dbUser) {
          dbUser = await User.create({
            username: user.name,
            email: user.email,
            image: user.image,
          });
        }

        // Attach user ID to token so session can grab it later
        (user as any).id = dbUser._id.toString();

        return true;
      } catch (err) {
        console.error("Error in signIn callback:", err);
        return false;
      }
    },

    async session({ session, token }: { session: Session; token: any }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },

    async jwt({ token, user }: { token: any; user?: DefaultUser }) {
      if (user) {
        token.id = (user as any).id;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

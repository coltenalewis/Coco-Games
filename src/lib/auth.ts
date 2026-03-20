import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { getSupabase } from "./supabase";
import { assignVerifiedRole } from "./verification";
import type { UserRole } from "./roles";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      discordId?: string;
      role?: UserRole;
    };
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string;
    accessToken?: string;
    role?: UserRole;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify guilds",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const discordProfile = profile as {
          id: string;
          username: string;
          avatar: string | null;
        };

        token.discordId = discordProfile.id;
        token.accessToken = account.access_token as string;

        const isOwner =
          discordProfile.id === process.env.OWNER_DISCORD_ID;

        // Upsert user in Supabase on login
        await getSupabase().from("users").upsert(
          {
            discord_id: discordProfile.id,
            discord_username: discordProfile.username,
            discord_avatar: discordProfile.avatar,
            is_owner: isOwner,
            ...(isOwner ? { role: "owner" } : {}),
          },
          { onConflict: "discord_id" }
        );

        // Fetch the user's role from DB
        const { data: dbUser } = await getSupabase()
          .from("users")
          .select("role")
          .eq("discord_id", discordProfile.id)
          .maybeSingle();

        token.role = (dbUser?.role as UserRole) || "user";

        // Check if user already has Roblox linked — if so, assign Verified
        await assignVerifiedRole(
          discordProfile.id,
          account.access_token as string
        );
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.discordId = token.discordId;
        session.user.role = token.role;
      }
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

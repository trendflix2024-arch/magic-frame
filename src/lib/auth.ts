import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";
import type { NextAuthOptions } from "next-auth";

// Helper for deterministic UUID generation from ANY string
function toUUID(id: string): string {
    // Already a valid UUID → return as-is
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return id;

    // For numeric-only strings (Google IDs), use legacy zero-padding
    const digits = id.replace(/[^0-9]/g, '');
    if (digits.length > 0 && digits.length === id.length) {
        const padded = digits.padStart(32, '0').slice(-32);
        return `${padded.slice(0, 8)}-${padded.slice(8, 12)}-${padded.slice(12, 16)}-${padded.slice(16, 20)}-${padded.slice(20, 32)}`;
    }

    // For ANY other string: character-code hashing (FNV)
    let hex = '';
    for (let round = 0; hex.length < 32; round++) {
        let h = 0x811c9dc5 + round;
        for (let i = 0; i < id.length; i++) {
            h ^= id.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        hex += (h >>> 0).toString(16).padStart(8, '0');
    }
    hex = hex.slice(0, 32);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

const devProviders = process.env.NODE_ENV === "development"
    ? [
        CredentialsProvider({
            id: "dev-login",
            name: "개발자 로그인",
            credentials: {
                email: { label: "이메일", type: "email" },
                name: { label: "이름", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;
                return {
                    id: credentials.email,
                    name: credentials.name || "테스트 작가",
                    email: credentials.email,
                };
            },
        }),
    ]
    : [];

export const authOptions: NextAuthOptions = {
    providers: [
        ...devProviders,
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        KakaoProvider({
            clientId: process.env.KAKAO_CLIENT_ID || "",
            clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async signIn({ user, account }) {
            if (!user?.id) return true;

            const userId = toUUID(user.id);

            try {
                // Check if this user already exists in Supabase
                const { data: existing } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', userId)
                    .maybeSingle();

                // Mark as new user if no profile found (for Google first-timers)
                (user as any).isNewUser = !existing;

                let error;
                if (!existing) {
                    // New user: create profile with Google name
                    ({ error } = await supabase.from('profiles').insert({
                        id: userId,
                        name: user.name || '작가님',
                        email: user.email || '',
                        updated_at: new Date().toISOString(),
                    }));
                } else {
                    // Existing user: preserve custom name, only update email/timestamp
                    ({ error } = await supabase.from('profiles').update({
                        email: user.email || '',
                        updated_at: new Date().toISOString(),
                    }).eq('id', userId));
                }

                if (error) console.error('Supabase signIn sync error:', error);
            } catch (err) {
                console.error('Supabase sync exception:', err);
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = toUUID(user.id);
                token.isNewUser = (user as any).isNewUser || false;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).isNewUser = token.isNewUser || false;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 100 * 365 * 24 * 60 * 60, // 100 years — effectively permanent
    },
    debug: process.env.NODE_ENV === "development",
};

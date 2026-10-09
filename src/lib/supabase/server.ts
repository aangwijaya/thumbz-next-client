import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // called from a Server Component — cookie mutation not allowed
          }
        },
      },
    },
  );
}

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * The session's access token, to forward as `Bearer` to the API (which
 * verifies it against the JWKS). Read from the cookie session: never use it
 * for authorization decisions in this app — use getVerifiedClaims() for that.
 */
export async function getAccessToken(): Promise<string | null> {
  if (!isConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
}

interface SessionClaims {
  sub: string;
  email?: string;
  user_metadata?: { full_name?: string; name?: string };
}

/** JWT claims verified against the Supabase JWKS; null when signed out. */
export async function getVerifiedClaims(): Promise<SessionClaims | null> {
  if (!isConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims as SessionClaims | undefined;
  if (error || typeof claims?.sub !== "string") return null;
  return claims;
}

// First letter of the signed-in user's name (or email) for the header avatar.
export async function getUserInitial(): Promise<string | null> {
  const claims = await getVerifiedClaims();
  if (!claims) return null;
  const name =
    claims.user_metadata?.full_name ?? claims.user_metadata?.name ?? claims.email ?? "";
  return name.trim().charAt(0).toUpperCase() || "U";
}

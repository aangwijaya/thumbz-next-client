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

export async function getAccessToken(): Promise<string | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
}

// First letter of the signed-in user's name (or email) for the header avatar.
// Null when signed out. Display only, never used for authorization: the token
// claims are read without verifying them, the middleware validates the session.
export async function getUserInitial(): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) return null;

  let claims: { email?: string; user_metadata?: { full_name?: string; name?: string } } = {};
  try {
    claims = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString());
  } catch {
    // unreadable token: fall back to a generic initial
  }

  const name = claims?.user_metadata?.full_name ?? claims?.user_metadata?.name ?? claims?.email ?? "";
  return name.trim().charAt(0).toUpperCase() || "U";
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getBillingState } from "@/lib/billing";
import { getSupabaseEnv } from "@/lib/supabase/env";

function withSupabaseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value, cookie);
  });
  return to;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const { url: supabaseUrl, anonKey: supabaseKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  const isAuthCallback = pathname.startsWith("/auth/callback");

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/patients") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/booking") ||
    pathname.startsWith("/ai") ||
    pathname.startsWith("/settings");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return withSupabaseCookies(
      supabaseResponse,
      NextResponse.redirect(url)
    );
  }

  if (user && isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, trial_ends_at")
      .eq("user_id", user.id)
      .single();

    if (profile && getBillingState(profile).isExpired) {
      const url = request.nextUrl.clone();
      url.pathname = "/pricing";
      url.searchParams.set("expired", "true");
      return withSupabaseCookies(
        supabaseResponse,
        NextResponse.redirect(url)
      );
    }
  }

  if (user && isAuthPage && !isAuthCallback) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return withSupabaseCookies(
      supabaseResponse,
      NextResponse.redirect(url)
    );
  }

  const isOnboarding = pathname.startsWith("/onboarding");
  if (user && isOnboarding) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, trial_ends_at, onboarding_completed")
      .eq("user_id", user.id)
      .single();

    if (profile && getBillingState(profile).isExpired) {
      const url = request.nextUrl.clone();
      url.pathname = "/pricing";
      url.searchParams.set("expired", "true");
      return withSupabaseCookies(
        supabaseResponse,
        NextResponse.redirect(url)
      );
    }
  }

  return supabaseResponse;
}

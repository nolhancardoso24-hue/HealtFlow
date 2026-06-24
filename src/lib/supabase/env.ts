export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const isConfigured =
    Boolean(url) &&
    Boolean(anonKey) &&
    url !== "your-supabase-url" &&
    anonKey !== "your-anon-key";

  return { url: url ?? "", anonKey: anonKey ?? "", isConfigured };
}

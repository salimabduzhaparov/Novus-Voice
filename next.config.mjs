/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // The Vercel <-> Supabase integration injects SUPABASE_URL and
  // SUPABASE_PUBLISHABLE_KEY automatically. Next.js only exposes vars
  // prefixed NEXT_PUBLIC_ to the browser, so map them here at build time.
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const supabaseHostname = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
        "https://sznijvkpueolrayyynmq.supabase.co",
    ).hostname;
  } catch {
    return "sznijvkpueolrayyynmq.supabase.co";
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
        port: "",
        protocol: "https",
      },
      {
        hostname: "lh3.googleusercontent.com",
        port: "",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;

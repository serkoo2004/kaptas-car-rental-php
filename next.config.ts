import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "42mb",
    },
  },
  async rewrites() {
    const sekoRoutes = [
      "/",
      "/arac-filosu",
      "/hakkimizda",
      "/kiralama-kosullari",
      "/iletisim",
    ];

    return {
      beforeFiles: sekoRoutes.map((source) => ({
        destination: "/seko-front/index.html",
        source,
      })),
    };
  },
  async redirects() {
    return [
      {
        destination: "/?account=rentals",
        permanent: false,
        source: "/panel/basvurularim",
      },
      {
        destination: "/?account=rentals",
        permanent: false,
        source: "/panel/tekliflerim",
      },
      {
        destination: "/?account=rentals",
        permanent: false,
        source: "/panel/belgelerim",
      },
      {
        destination: "/?account=profile",
        permanent: false,
        source: "/panel/profil",
      },
      {
        destination: "/?account=overview",
        permanent: false,
        source: "/panel/:path*",
      },
      {
        destination: "/login",
        permanent: false,
        source: "/giris",
      },
      {
        destination: "/arac-filosu",
        permanent: false,
        source: "/araclar",
      },
      {
        destination: "/arac-filosu",
        permanent: false,
        source: "/araclar/:path*",
      },
      {
        destination: "/",
        permanent: false,
        source: "/hizmetler",
      },
      {
        destination: "/",
        permanent: false,
        source: "/hizmetler/:path*",
      },
      {
        destination: "/",
        permanent: false,
        source: "/lokasyonlar",
      },
      {
        destination: "/",
        permanent: false,
        source: "/haberler/:path*",
      },
      {
        destination: "/",
        permanent: false,
        source: "/kampanyalar",
      },
      {
        destination: "/",
        permanent: false,
        source: "/filo-satis",
      },
      {
        destination: "/",
        permanent: false,
        source: "/kurumsal-kiralama",
      },
      {
        destination: "/hakkimizda",
        permanent: false,
        source: "/misyon-ve-vizyon",
      },
      {
        destination: "/kiralama-kosullari",
        permanent: false,
        source: "/kira-kosullari",
      },
      {
        destination: "/iletisim",
        permanent: false,
        source: "/iletisim-formu",
      },
      {
        destination: "/",
        permanent: false,
        source: "/insan-kaynaklari",
      },
      {
        destination: "/",
        permanent: false,
        source: "/blog/:path*",
      },
      {
        destination: "/",
        permanent: false,
        source: "/maliyet-hesaplayici",
      },
      {
        destination: "/",
        permanent: false,
        source: "/teklif-al/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;

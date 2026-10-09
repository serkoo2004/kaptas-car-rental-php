import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      const pathname = req.nextUrl.pathname;

      if (!token) {
        return false;
      }

      if (token.status !== "ACTIVE") {
        return false;
      }

      if (pathname.startsWith("/admin")) {
        return ["ADMIN", "SUPER_ADMIN"].includes(String(token.role));
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/admin/:path*"],
};

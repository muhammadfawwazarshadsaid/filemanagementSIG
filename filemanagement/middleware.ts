import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "./stack";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  try {
    const user = await stackServerApp.getUser();

    if (!user?.currentSession) {
      // Jika user belum login, redirect ke /masuk kecuali halaman /masuk atau /daftar
      if (url.pathname !== "/masuk" && url.pathname !== "/daftar") {
        url.pathname = "/masuk";
        return NextResponse.redirect(url);
      }
    } else {
      // Jika user sudah login, redirect ke /selesaikanpendaftaran
      if (url.pathname === "/masuk" || url.pathname === "/daftar") {
        url.pathname = "/selesaikanpendaftaran";
        return NextResponse.redirect(url);
      }
    }

  } catch (error) {
    console.error("Error fetching user:", error);
    url.pathname = "/masuk";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/masuk', '/daftar', '/selesaikanpendaftaran']
};
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stackServerApp } from './stack';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  try {
    const user = await stackServerApp.getUser();
    const currentSession = user?.currentSession;

    // AKAN DIISI DENGAN URL SEMUA HAL DI DASHBOARD (MENGHENTIKAN PROSES PASCA SESSION KARENA TIDAK ADA YANG LOGIN)
    if (!currentSession && ["/", "/dashboard", "/aturpassword"].includes(url.pathname)) {
      url.pathname = "/masuk";
      return NextResponse.redirect(url);
    }


    // AKAN DIISI DENGAN URL SEMUA HAL ONBOARDING (SEBELUM DASHBOARD DIMUNCULKAN)
    const hasPassword = user?.hasPassword; // Cek apakah user sudah punya password
    // Jika user belum memiliki password, redirect ke /setpassword
    if (!hasPassword && currentSession && url.pathname !== "/aturpassword") {
      url.pathname = "/aturpassword";
      return NextResponse.redirect(url);
    }

    // AKAN DIISI DENGAN URL SEMUA HAL PASCALOGIN (MENGHENTIKAN PROSES TO AUTH KARENA SUDAH LOGIN)
    // Jika user sudah login dan mencoba akses halaman login/daftar/lupa password, redirect ke home
    if (currentSession && ["/masuk", "/daftar", "/lupapasword"].includes(url.pathname)) {
      url.pathname = "/"; 
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    url.pathname = "/masuk";
    return NextResponse.redirect(url);
  }


  return NextResponse.next();
}

export const config = {
  matcher: '/:path*', // Berlaku untuk semua halaman
};

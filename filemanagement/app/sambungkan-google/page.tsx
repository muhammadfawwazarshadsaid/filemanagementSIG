'use client'

import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SambungkanGoogle() {
  const router = useRouter();
  const stackframeUser = useUser();
  const account = stackframeUser?.useConnectedAccount?.('google', {
    or: 'redirect',
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  const { accessToken } = account?.useAccessToken?.() || { accessToken: null };

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
      router.push('/');
    }
  }, [accessToken, router]);

  return <div>Menyambungkan ke Google...</div>;
}

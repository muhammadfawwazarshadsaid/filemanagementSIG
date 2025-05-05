// // src/hooks/useGoogleDriveAccount.ts (Perbaikan Overload)
// "use client";

// import { useState, useEffect } from 'react';
// import { useUser as useStackframeUserHook } from "@stackframe/stack";

// const GOOGLE_DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive'];

// interface UseGoogleDriveAccountResult {
//     account: any | null;
//     accessToken: string | null;
//     isLoading: boolean;
//     error: Error | null;
// }

// // <<< Hapus parameter 'options' untuk menyederhanakan dan memperbaiki error type >>>
// export function useGoogleDriveAccount(): UseGoogleDriveAccountResult {
//     const stackframeUser = useStackframeUserHook();
//     // <<< Langsung definisikan options yang valid sesuai overload library >>>
//     // Opsi 1: Selalu gunakan 'redirect' secara eksplisit (cocok dengan overload 1)
//     const hookOptions = {
//         or: 'redirect' as const, // Gunakan 'as const' untuk tipe literal
//         scopes: GOOGLE_DRIVE_SCOPES
//     };
//     // Opsi 2: Gunakan default library (cocok dengan overload 2, hapus 'or') - mungkin lebih aman jika defaultnya bukan redirect
//     // const hookOptions = {
//     //     scopes: GOOGLE_DRIVE_SCOPES
//     // };

//     const [result, setResult] = useState<UseGoogleDriveAccountResult>({
//         account: null, accessToken: null, isLoading: true, error: null,
//     });

//     useEffect(() => {
//         if (!stackframeUser) {
//              setResult(prev => ({ ...prev, isLoading: true, account: null, accessToken: null, error: null }));
//              return;
//         }
//         if(!result.isLoading) {
//              setResult({ account: null, accessToken: null, isLoading: true, error: null });
//         }

//         try {
//              // Panggil dengan hookOptions yang tipenya sudah pasti valid
//             const connectedAccount = stackframeUser.useConnectedAccount('google', hookOptions);

//             // Penanganan null jika 'or' diizinkan return-null (tapi kita pakai redirect)
//             if (!connectedAccount && hookOptions.or !== 'redirect') {
//                  setResult({ account: null, accessToken: null, isLoading: false, error: null });
//                  return;
//             }
//             // Jika 'or' adalah 'redirect', connectedAccount seharusnya tidak pernah null di sini
//             // kecuali ada error atau user membatalkan redirect. Error ditangani di catch.
//             // Kita asumsikan jika tidak error dan or:'redirect', connectedAccount selalu ada.

//             if (connectedAccount && typeof connectedAccount.useAccessToken === 'function') {
//                  try {
//                     const tokenInfo = connectedAccount.useAccessToken();
//                     const token = tokenInfo?.accessToken ?? null;
//                     setResult({ account: connectedAccount, accessToken: token, isLoading: false, error: null });
//                  } catch (tokenError: any) {
//                      console.error("useGoogleDriveAccount: Error getting access token:", tokenError);
//                      setResult({ account: connectedAccount, accessToken: null, isLoading: false, error: tokenError instanceof Error ? tokenError : new Error(String(tokenError)) });
//                  }
//             } else if (connectedAccount) {
//                  console.warn("useGoogleDriveAccount: connectedAccount object does not have useAccessToken method.");
//                  setResult({ account: connectedAccount, accessToken: null, isLoading: false, error: new Error("Struktur objek akun tidak sesuai.") });
//             }
//              // Jika or:'redirect', kita mungkin tidak akan pernah mencapai titik ini jika redirect terjadi.
//              // State akan tetap loading sampai redirect selesai & komponen dirender ulang.


//         } catch (accountError: any) {
//             // Menangani error jika useConnectedAccount throw (misal jika or: 'throw')
//             console.error("useGoogleDriveAccount: Error connecting Google account:", accountError);
//             setResult({ account: null, accessToken: null, isLoading: false, error: accountError instanceof Error ? accountError : new Error(String(accountError)) });
//         }

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [stackframeUser]); // Hapus hookOptions dari dependency jika sudah tidak dinamis

//     return result;
// }
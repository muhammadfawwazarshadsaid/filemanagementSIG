// import GoogleDriveManager from '@/components/google-drive-manager';
// import WorkspaceSelector from '@/components/workspace-selector';
// import { StackProvider } from '@stackframe/stack'; // Impor StackProvider jika belum ada di layout utama

// // Jika StackProvider sudah ada di layout.tsx global Anda, Anda tidak perlu membungkusnya lagi di sini.
// // Jika belum, Anda perlu membungkus komponen Anda dengan StackProvider.

// export default function GoogleDriveManagerPage() {
//   return (
//     <div>
//       <h1>Google Drive Manager Page</h1>
//       <p>Ini adalah halaman untuk mengelola file Google Drive Anda.</p>
//       {/*
//         PENTING: Jika Anda BELUM memiliki <StackProvider> di file layout.tsx
//         utama (src/app/layout.tsx), Anda perlu menambahkannya di sini atau di layout.
//         Jika sudah ada di layout utama, baris <StackProvider> di bawah ini TIDAK diperlukan.
//       */}
//       {/* <StackProvider> */}
//         <WorkspaceSelector />
//       {/* </StackProvider> */}
//     </div>
//   );
// }

// // Tambahan: Metadata halaman (Opsional)
// export const metadata = {
//   title: 'Google Drive Manager',
//   description: 'Manage your Google Drive files.',
// };
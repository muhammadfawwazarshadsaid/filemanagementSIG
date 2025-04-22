// app/workspace/[workspaceId]/page.tsx
"use client"; // Perlu client component untuk useParams

import { WorkspaceView } from "@/components/view-homepage";
import { useParams } from "next/navigation";
// --- Konfigurasi Worker PDF.js ---
// --- IMPOR react-pdf ---
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
try {
     pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
     console.log(`PDF.js worker src set to: ${pdfjs.GlobalWorkerOptions.workerSrc}`);
} catch (error) {
     console.error("Gagal mengkonfigurasi worker pdf.js.", error);
     // Fallback jika versi tidak terdeteksi (meskipun seharusnya jarang)
     pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`; // Ganti versi jika perlu
     console.warn(`Fallback PDF.js worker src: ${pdfjs.GlobalWorkerOptions.workerSrc}`);
}
// --------------------------------

export default function FolderPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string | undefined;
  const folderId = params.folderId as string | undefined;

  // Render komponen view dan berikan workspaceId dari URL
  return <WorkspaceView workspaceId={(workspaceId)}  folderId={(folderId) }/>;
}
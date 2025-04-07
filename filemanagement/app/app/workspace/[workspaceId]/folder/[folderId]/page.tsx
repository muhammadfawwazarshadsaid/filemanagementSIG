// app/workspace/[workspaceId]/page.tsx
"use client"; // Perlu client component untuk useParams

import { WorkspaceView } from "@/components/view-homepage";
import { useParams } from "next/navigation";

export default function FolderPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string | undefined;
  const folderId = params.folderId as string | undefined;

  // Render komponen view dan berikan workspaceId dari URL
  return <WorkspaceView workspaceId={(workspaceId)}  folderId={(folderId) }/>;
}
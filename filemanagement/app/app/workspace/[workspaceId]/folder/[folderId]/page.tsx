// app/workspace/[workspaceId]/page.tsx
"use client"; // Perlu client component untuk useParams

import { WorkspaceView } from "@/components/view-homepage";
import { useParams } from "next/navigation";

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string | undefined;

  // Render komponen view dan berikan workspaceId dari URL
  return <WorkspaceView workspaceId={(workspaceId)} />;
}
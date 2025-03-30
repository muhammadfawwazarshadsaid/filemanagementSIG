// actions.ts
"use server";

import fs from "fs";
import path from "path";

export async function fetchFilesFromServer() {
  try {
    const filePath = path.join(
      process.cwd(),
      "components/recentfiles",
      "data.json"
    );
    console.log("File path:", filePath); // Tambahkan ini
    const fileContents = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContents);
  } catch (error) {
    console.error("Error reading file:", error);
    return null;
  }
}
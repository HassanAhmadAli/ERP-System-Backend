import { existsSync } from "node:fs";
import path from "node:path";

export function resolveUploadPath(storedPath: string): string | undefined {
  const candidates = path.isAbsolute(storedPath)
    ? [storedPath, path.join(process.cwd(), storedPath.replace(/^[/\\]/, ""))]
    : [path.join(process.cwd(), storedPath), storedPath];
  return candidates.find((candidate) => existsSync(candidate));
}

export function normalizeUploadPath(filePath: string, filename: string): string {
  const relative = path.isAbsolute(filePath) ? path.relative(process.cwd(), filePath) : filePath;

  if (relative && !relative.startsWith("..") && existsSync(path.join(process.cwd(), relative))) {
    return relative.split(path.sep).join(path.posix.sep);
  }

  return path.posix.join("uploads", filename);
}

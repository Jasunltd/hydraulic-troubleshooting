import fs from "node:fs";
import path from "node:path";
import { decode } from "../domain/decode.js";
import { ProjectSpecSchema, type ProjectSpec } from "../domain/project.js";

export function loadProject(projectDir: string): ProjectSpec {
  const pathname = path.join(projectDir, "project.json");
  const input: unknown = JSON.parse(fs.readFileSync(pathname, "utf8"));
  return decode(ProjectSpecSchema, input);
}

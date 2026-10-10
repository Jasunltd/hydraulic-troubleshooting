import { Schema } from "effect";
import { ProblemDefinitionSchema } from "./problem.js";

const NonEmpty = Schema.String.pipe(Schema.minLength(1));

export const ProjectStatusSchema = Schema.Literal(
  "research",
  "modeling",
  "verification",
  "presentation-ready",
  "archived",
);

export const ProjectOutputsSchema = Schema.Struct({
  landing: NonEmpty,
  html: NonEmpty,
  pdf: NonEmpty,
  video: NonEmpty,
  interactive3d: NonEmpty,
  researchPack: NonEmpty,
  sourceArchive: NonEmpty,
});

export const ProjectSpecSchema = Schema.Struct({
  schemaVersion: Schema.Literal(2),
  slug: NonEmpty,
  title: NonEmpty,
  companyOrDomain: NonEmpty,
  created: NonEmpty,
  status: ProjectStatusSchema,
  cleanRoom: Schema.Literal(true),
  dataPolicy: Schema.Literal("public-or-synthetic-only"),
  problem: ProblemDefinitionSchema,
  outputs: ProjectOutputsSchema,
});

export type ProjectSpec = typeof ProjectSpecSchema.Type;
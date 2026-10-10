import { Schema } from "effect";

export class DomainError extends Error {
  readonly code = "INVALID_RESEARCH_PROGRAM_INPUT";
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export function decode<A, I>(schema: Schema.Schema<A, I, never>, input: unknown): A {
  try {
    return Schema.decodeUnknownSync(schema)(input, { onExcessProperty: "error" });
  } catch (error) {
    throw new DomainError(error instanceof Error ? error.message : "Input does not match schema");
  }
}

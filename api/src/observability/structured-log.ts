export type StructuredLogFields = Record<string, unknown>;

export function structuredLog(event: string, fields: StructuredLogFields = {}) {
  return JSON.stringify({ event, ...fields });
}

export function errorLogFields(error: unknown) {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
    };
  }

  return {
    errorMessage: String(error),
  };
}

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { isoDateTime } from './iso-datetime';

// ADR 0008 keeps one exit open: the day a second consumer wants a spec,
// `z.toJSONSchema(schema, { io: 'input' })` emits the wire shape of every route
// with no rewrite. A codec that cannot render — a `z.date()` reached on the
// output side, a `z.transform` with no input-side counterpart — closes it
// silently, because nothing in either app calls the emitter. This suite is the
// only thing that does.
//
// It discovers modules instead of listing them, so a module added later is
// covered the day its file lands.
const moduleNames = readdirSync(join(__dirname))
  .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'))
  .map((file) => file.replace(/\.ts$/, ''))
  .sort();

type SchemaEntry = [moduleName: string, exportName: string, schema: z.ZodType];

const exportedSchemas: SchemaEntry[] = moduleNames.flatMap((moduleName) => {
  const moduleExports = require(`./${moduleName}`) as Record<string, unknown>;

  return Object.entries(moduleExports)
    .filter((entry): entry is [string, z.ZodType] => entry[1] instanceof z.ZodType)
    .map(([exportName, schema]): SchemaEntry => [moduleName, exportName, schema]);
});

describe('@arena/contracts JSON Schema emission', () => {
  it('discovers the exported schemas', () => {
    // Guards the discovery itself: a rename that empties the list would
    // otherwise turn every case below into a vacuous pass.
    expect(moduleNames).toContain('matches');
    expect(exportedSchemas.length).toBeGreaterThan(40);
  });

  it.each(exportedSchemas)('%s: %s renders input-side', (_moduleName, _exportName, schema) => {
    expect(() => z.toJSONSchema(schema, { io: 'input' })).not.toThrow();
  });

  it('renders a timestamp as the ISO string the wire carries', () => {
    expect(z.toJSONSchema(isoDateTime, { io: 'input' })).toMatchObject({
      type: 'string',
      format: 'date-time',
    });
  });

  it('refuses the output side, which is why `io: input` is the rule', () => {
    // `z.date()` has no JSON representation. Emitting without `io: 'input'`
    // does not degrade — it throws, so the rule cannot be forgotten quietly.
    expect(() => z.toJSONSchema(isoDateTime)).toThrow();
  });
});

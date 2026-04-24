import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
});

const journalPath = resolve(process.cwd(), 'drizzle', 'meta', '_journal.json');

type JournalEntry = {
  idx: number;
  when: number;
  tag: string;
  breakpoints: boolean;
};

async function main() {
  const journalRaw = await readFile(journalPath, 'utf-8');
  const journal = JSON.parse(journalRaw) as { entries: JournalEntry[] };

  await sql`create schema if not exists drizzle`;
  await sql.unsafe(`
    create table if not exists drizzle.__drizzle_migrations (
      id serial primary key,
      hash text not null,
      created_at bigint
    )
  `);

  const [existingLog] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from drizzle.__drizzle_migrations
  `;

  if ((existingLog?.count ?? 0) > 0) {
    console.log('Drizzle migrations journal already populated. No baseline needed.');
    return;
  }

  const [publicTables] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
  `;

  if ((publicTables?.count ?? 0) === 0) {
    console.log('Fresh database detected. Skipping baseline so db:migrate can apply everything normally.');
    return;
  }

  await sql.begin(async (tx) => {
    for (const entry of journal.entries) {
      const migrationPath = resolve(process.cwd(), 'drizzle', `${entry.tag}.sql`);
      const query = await readFile(migrationPath, 'utf-8');
      const hash = createHash('sha256').update(query).digest('hex');

        await tx.unsafe(
          'insert into drizzle.__drizzle_migrations ("hash", "created_at") values ($1, $2)',
          [hash, entry.when],
        );
    }
  });

  console.log(`Baselined ${journal.entries.length} migrations in drizzle.__drizzle_migrations.`);
}

try {
  await main();
} finally {
  await sql.end({ timeout: 1 }).catch(() => undefined);
}

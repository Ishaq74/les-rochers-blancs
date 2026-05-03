import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const maxAttempts = Number.parseInt(process.env.DB_WAIT_MAX_ATTEMPTS ?? '30', 10);
const delayMs = Number.parseInt(process.env.DB_WAIT_DELAY_MS ?? '2000', 10);

if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
  console.error('DB_WAIT_MAX_ATTEMPTS must be a positive integer');
  process.exit(1);
}

if (!Number.isFinite(delayMs) || delayMs < 0) {
  console.error('DB_WAIT_DELAY_MS must be a non-negative integer');
  process.exit(1);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  const sql = postgres(connectionString, {
    max: 1,
    connect_timeout: 5,
    idle_timeout: 5,
    prepare: false,
  });

  try {
    await sql`select 1`;
    console.log(`Database reachable after ${attempt} attempt(s).`);
    await sql.end({ timeout: 1 }).catch(() => undefined);
    process.exit(0);
  } catch (error) {
    await sql.end({ timeout: 1 }).catch(() => undefined);

    if (attempt === maxAttempts) {
      const err = error as NodeJS.ErrnoException;
      console.error(`Database did not become reachable after ${maxAttempts} attempt(s).`);
      console.error(err.message || String(err));
      process.exit(1);
    }

    console.log(`Waiting for database... (${attempt}/${maxAttempts})`);
    await sleep(delayMs);
  }
}
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is missing in .env');
  process.exit(1);
}

const url = new URL(connectionString);
const dbName = url.pathname.replace(/^\//, '') || '(unknown)';

console.log('🔎 Checking PostgreSQL connection...');
console.log(`Host: ${url.hostname}`);
console.log(`Port: ${url.port || '5432'}`);
console.log(`Database: ${dbName}`);
console.log(`User: ${decodeURIComponent(url.username || '(none)')}`);

const sql = postgres(connectionString, {
  max: 1,
  connect_timeout: 5,
  idle_timeout: 5,
  prepare: false,
});

try {
  const result = await sql`select current_database() as database, current_user as username, version() as version`;
  const tableCount = await sql`
    select count(*)::int as count
    from information_schema.tables
    where table_schema = 'public'
  `;

  console.log('\n✅ PostgreSQL connection OK');
  console.log(`Connected to: ${result[0].database}`);
  console.log(`Authenticated as: ${result[0].username}`);
  console.log(`Public tables found: ${tableCount[0].count}`);
} catch (error) {
  console.error('\n❌ PostgreSQL connection failed');

  if (error instanceof AggregateError) {
    for (const [index, individualError] of error.errors.entries()) {
      const err = individualError as NodeJS.ErrnoException;
      console.error(`  Cause ${index + 1}: ${err.code || 'UNKNOWN'} - ${err.message}`);
    }
  } else {
    const err = error as NodeJS.ErrnoException;
    console.error(`  Code: ${err.code || 'UNKNOWN'}`);
    console.error(`  Message: ${err.message || String(err)}`);
  }

  process.exit(1);
} finally {
  await sql.end({ timeout: 1 }).catch(() => undefined);
}

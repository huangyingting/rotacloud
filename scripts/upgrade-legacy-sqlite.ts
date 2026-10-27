import './environment';
import { execFileSync } from 'node:child_process';
import { chmod, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';

const schema = 'prisma/schema.prisma';
const baseline = '20260720000000_initial';

function statements(sql: string) {
  return sql
    .replace(/--[^\n]*/g, '')
    .split(';')
    .map((s) => s.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
}

function cli(args: string[]) {
  return execFileSync('npx', ['prisma', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function diff() {
  return statements(
    cli(['migrate', 'diff', '--from-config-datasource', '--to-schema', schema, '--script'])
  );
}

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url?.startsWith('file:') || url === 'file::memory:') {
    throw new Error('This upgrade supports an existing file-backed SQLite installation only.');
  }
  const file = url.slice(5);
  const database = path.isAbsolute(file) ? file : path.resolve('prisma', file);
  const changes = diff();
  const historyExists = await prisma.$queryRaw<{ name: string }[]>`
    SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_prisma_migrations'
  `;

  if (!process.argv.includes('--apply')) {
    console.log(
      JSON.stringify({
        apply: false,
        statements: changes,
        baselineRequired: !historyExists.length,
      })
    );
    return;
  }

  let backup: string | null = null;
  if (changes.length || !historyExists.length) {
    const storageDir = process.env.ROTACLOUD_STORAGE_DIR || './storage';
    const directory = path.resolve(storageDir, 'database-backups');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    backup = path.join(
      directory,
      `${path.basename(database)}-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`
    );
    await prisma.$executeRawUnsafe('VACUUM INTO ?', backup);
    await chmod(backup, 0o600);
  }

  for (const statement of changes) {
    await prisma.$executeRawUnsafe(statement);
  }

  if (!historyExists.length) {
    cli(['migrate', 'resolve', '--applied', baseline]);
  }

  await chmod(database, 0o600).catch(() => undefined);
  console.log(
    JSON.stringify({
      ok: true,
      appliedStatements: changes.length,
      rowsPreserved: true,
      backup,
      baseline,
    })
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

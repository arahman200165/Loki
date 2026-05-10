import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaDir = path.join(__dirname, 'schema');

export const ensureAuthSchema = async () => {
  const schemaFiles = (await fs.readdir(schemaDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (schemaFiles.length === 0) {
    throw new Error(`No schema files found in ${schemaDir}`);
  }

  for (const fileName of schemaFiles) {
    const filePath = path.join(schemaDir, fileName);
    const sql = await fs.readFile(filePath, 'utf8');

    if (!sql.trim()) {
      continue;
    }

    await query(sql);
  }
};

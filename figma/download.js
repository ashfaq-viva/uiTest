// figma/download.js

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { figmaConfig } from './figma.config.js';

const { token, fileKey, nodes, outputDir } = figmaConfig;
const delay = (ms) => new Promise(res => setTimeout(res, ms));

function chunkEntries(entries, size) {
  const chunks = [];
  for (let i = 0; i < entries.length; i += size) {
    chunks.push(entries.slice(i, i + size));
  }
  return chunks;
}

/**
 * Convert user-friendly dash IDs like "5605-21876" to Figma's "5605:21876".
 * If already colon-based, returned as-is. Tries to be conservative.
 */
function normalizeNodeId(id) {
  if (typeof id !== 'string') return id;
  if (id.includes(':')) return id;

  // Prefer the common "digits-digits" pattern
  const m = id.match(/^(\d+)-(\d+)$/);
  if (m) return `${m[1]}:${m[2]}`;

  // Fallback: replace only the first '-' with ':' (keeps any others intact)
  return id.replace('-', ':');
}

/**
 * Normalize a node ref that might be:
 * - string: '5605-21876' or '5605:21876'
 * - object: { within: '5605-21876' } or { node: '5605-21876' }
 */
function normalizeNodeRef(value) {
  if (typeof value === 'string') return normalizeNodeId(value);

  if (value && typeof value === 'object') {
    if ('within' in value) {
      return normalizeNodeId(value.within);
    }
    if ('node' in value) {
      return normalizeNodeId(value.node);
    }
  }
  throw new Error(`❌ Invalid node format: ${JSON.stringify(value)}`);
}

function getDirAndFilename(name /*, nodeRef */) {
  const section = name.replace(/(Desktop|Laptop|Tablet|Mobile)$/, '');
  const dir = path.resolve(outputDir, section);
  const filename = `${name}Figma.png`;
  return { dir, filename };
}

async function downloadBatch(batch) {
  // Normalize all node ids up-front
  const normalized = batch.map(([name, nodeRef]) => [name, normalizeNodeRef(nodeRef)]);
  const ids = normalized.map(([, id]) => id).join(',');

  const headers = { 'X-Figma-Token': token };

  // 1) Ask figma for image urls
  const imageRes = await fetch(
    `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=png&scale=1`,
    { headers }
  );
  const imageJson = await imageRes.json();

  if (!imageJson.images) {
    console.error(`❌ API returned no images. Raw: ${JSON.stringify(imageJson)}`);
    return;
  }

  // 2) Get node metadata in the same order
  const metaRes = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(ids)}`,
    { headers }
  );
  const metaJson = await metaRes.json();

  for (let i = 0; i < normalized.length; i++) {
    const [name, normalizedId] = normalized[i];
    const imageUrl = imageJson.images[normalizedId];
    const metadata = metaJson.nodes?.[normalizedId];

    if (!imageUrl || !metadata) {
      console.warn(`⚠️ Missing image or metadata for ${name} (${normalizedId})`);
      continue;
    }

    try {
      const { dir, filename } = getDirAndFilename(name);
      fs.mkdirSync(dir, { recursive: true });

      // Save PNG
      const imageBuffer = await (await fetch(imageUrl)).buffer();
      fs.writeFileSync(path.join(dir, filename), imageBuffer);

      // Save node JSON
      const jsonPath = path.join(dir, `${name}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(metadata, null, 2));

      console.log(`✅ Saved: ${path.join(path.basename(dir), filename)} & JSON`);
    } catch (err) {
      console.error(`❌ Failed to save ${name}: ${err.message}`);
    }
  }
}

// Main
(async () => {
  if (!token || !fileKey) {
    console.error('❌ Missing FIGMA_TOKEN or FIGMA_FILE_KEY in environment.');
    process.exit(1);
  }

  const entries = Object.entries(nodes);
  if (entries.length === 0) {
    console.warn('ℹ️ No nodes provided in figma.config.js');
    return;
  }

  const batches = chunkEntries(entries, 8);
  for (const batch of batches) {
    await downloadBatch(batch);
    await delay(800);
  }
})();

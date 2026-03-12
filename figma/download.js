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

/* -----------------------------
   ⭐ NEW: FETCH WITH RETRY
----------------------------- */
async function fetchWithRetry(url, options, maxRetries = 5) {
  for (let i = 0; i <= maxRetries; i++) {
    const res = await fetch(url, options);

    if (res.status !== 429) {
      return res;
    }

    const wait = 1000 * Math.pow(2, i); // exponential backoff
    console.warn(`⚠️ Figma rate limit hit (429). Retry ${i + 1}/${maxRetries}. Waiting ${wait}ms...`);
    await delay(wait);
  }

  throw new Error("❌ Too many 429 responses from Figma API.");
}

/* ---------------------------------------- */

function normalizeNodeId(id) {
  if (typeof id !== 'string') return id;
  if (id.includes(':')) return id;

  const m = id.match(/^(\d+)-(\d+)$/);
  if (m) return `${m[1]}:${m[2]}`;

  return id.replace('-', ':');
}

function normalizeNodeRef(value) {
  if (typeof value === 'string') return normalizeNodeId(value);
  if (value && typeof value === 'object') {
    if ('within' in value) return normalizeNodeId(value.within);
    if ('node' in value) return normalizeNodeId(value.node);
  }
  throw new Error(`❌ Invalid node format: ${JSON.stringify(value)}`);
}

function getDirAndFilename(name) {
  const section = name.replace(/(Desktop|Laptop|Tablet|Mobile)$/, '');
  const dir = path.resolve(outputDir, section);
  const filename = `${name}Figma.png`;
  return { dir, filename };
}

/* ---------------------------------------- */

async function downloadBatch(batch) {
  const normalized = batch.map(([name, nodeRef]) => [name, normalizeNodeRef(nodeRef)]);
  const ids = normalized.map(([, id]) => id).join(',');
  const headers = { 'X-Figma-Token': token };

  // --- 1) IMAGES API ---
  const imageRes = await fetchWithRetry(
    `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=png&scale=1`,
    { headers }
  );
  const imageJson = await imageRes.json();

  if (!imageJson.images) {
    console.error(`❌ API returned no images. Raw: ${JSON.stringify(imageJson)}`);
    return;
  }

  // --- 2) NODES API ---
  const metaRes = await fetchWithRetry(
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

      const imgRes = await fetchWithRetry(imageUrl);
      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      fs.writeFileSync(path.join(dir, filename), buffer);

      const jsonPath = path.join(dir, `${name}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(metadata, null, 2));

      console.log(`✅ Saved: ${path.join(path.basename(dir), filename)} & JSON`);
    } catch (err) {
      console.error(`❌ Failed to save ${name}: ${err.message}`);
    }
  }
}

/* ---------------------------------------- */

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
    await delay(800); // small cooldown
  }
})();

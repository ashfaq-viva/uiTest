// global-setup.js
import fs from 'fs';
import path from 'path';


async function globalSetup() {
  const dir = path.resolve('./diff_output');

  // Delete the whole directory first
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log('🗑️ Completely deleted diff_output directory');
  }

  // Recreate the directory from scratch
  fs.mkdirSync(dir);
  console.log('📂 Created fresh diff_output directory');
}

// async function globalSetup() {
//   const dir = path.resolve('./diff_output');
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//     console.log('📂 Created diff_output directory');
//   }
// }

export default globalSetup;

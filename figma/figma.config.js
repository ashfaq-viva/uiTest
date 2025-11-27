// /figma/figma.config.js

import dotenv from 'dotenv';
dotenv.config();

export const figmaConfig = {
  token: process.env.FIGMA_TOKEN,
  fileKey: process.env.FIGMA_FILE_KEY,
  nodes: {
    // landingLaptop: '4614-48742',
    // landingDesktop: '4614-49797',
    // landingTablet: '4614-51777',
    // landingMobile: '4614-53716',
    videoCardLaptop: '6040-23125',
    // demoHeroLaptop: '4648-62616',
  },
  outputDir: './expected_screenshots'
};

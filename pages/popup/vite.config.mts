import { resolve } from 'path';
import { withPageConfig } from '@extension/vite-config';
import { nodePolyfills } from 'vite-plugin-node-polyfills'
const rootDir = resolve(__dirname);
const srcDir = resolve(rootDir, 'src');

export default withPageConfig({
  resolve: {
    alias: {
      '@src': srcDir,
    },
  },
  plugins: [nodePolyfills()],
  publicDir: resolve(rootDir, 'public'),
  build: {
    outDir: resolve(rootDir, '..', '..', 'dist', 'popup'),
  },
});

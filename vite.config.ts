import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const nanobrowserRoot = path.resolve(__dirname, 'vendor/nanobrowser');
  const openuiRoot = path.resolve(__dirname, 'openui');
  const hasOpenuiWorkspace = fs.existsSync(path.resolve(openuiRoot, 'packages/react-lang/src/index.ts'));
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      fs: {
        allow: [__dirname, nanobrowserRoot, openuiRoot],
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@src': path.resolve(nanobrowserRoot, 'chrome-extension/src'),
        '@src/background/services/analytics': path.resolve(__dirname, 'services/nanobrowser/analytics.ts'),
        ...(hasOpenuiWorkspace ? {
          '@openuidev/lang-core': path.resolve(openuiRoot, 'packages/lang-core/src/index.ts'),
          '@openuidev/lang-core/': path.resolve(openuiRoot, 'packages/lang-core/src/'),
          '@openuidev/react-lang': path.resolve(openuiRoot, 'packages/react-lang/src/index.ts'),
          '@openuidev/react-lang/': path.resolve(openuiRoot, 'packages/react-lang/src/'),
        } : {}),
        [path.resolve(nanobrowserRoot, 'chrome-extension/src/background/services/analytics.ts')]:
          path.resolve(__dirname, 'services/nanobrowser/analytics.ts'),
        'posthog-js/dist/module.no-external': path.resolve(
          __dirname,
          'services/nanobrowser/posthogStub.ts',
        ),
        '@puppeteer/browsers': path.resolve(
          __dirname,
          'services/nanobrowser/puppeteerBrowsersStub.ts',
        ),
        '@extension/storage': path.resolve(nanobrowserRoot, 'packages/storage'),
        '@extension/i18n': path.resolve(__dirname, 'services/nanobrowser/i18n.ts'),
        '@extension': path.resolve(nanobrowserRoot, 'packages'),
      }
    },
    base: './',
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          sidebar: path.resolve(__dirname, 'sidebar.html'),
          background: path.resolve(__dirname, 'background.ts')
        },
        output: {
          entryFileNames: '[name].js',
        }
      }
    }
  };
});

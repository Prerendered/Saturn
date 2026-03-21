import { defineConfig, type Plugin } from 'vite'
import { rename, readFile, writeFile } from 'node:fs/promises' // Bun implements node: built-ins natively
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { crx, defineManifest } from '@crxjs/vite-plugin'

const manifest = defineManifest({
  manifest_version: 3,
  name: 'Saturn',
  description: 'Automatically sets YouTube video quality to the highest resolution your monitor supports.',
  version: '0.1.0',
  permissions: ['storage', 'scripting', 'activeTab'],
  host_permissions: ['*://*.youtube.com/*'],
  content_security_policy: {
    // 'self' only — no inline scripts, no eval, no external sources.
    // Never weaken this: no 'unsafe-inline', no 'unsafe-eval', no CDN origins.
    extension_pages: "script-src 'self'; object-src 'self';",
  },
  background: {
    service_worker: 'background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['*://*.youtube.com/*'],
      js: ['content/index.ts'],
      run_at: 'document_idle',
    },
  ],
  action: {
    default_popup: 'popup/index.html',
    default_icon: {
      16: 'icons/png/saturn-planet-16.png',
      48: 'icons/png/saturn-planet-48.png',
      128: 'icons/png/saturn-planet-128.png',
    },
  },
  icons: {
    16: 'icons/png/saturn-planet-16.png',
    48: 'icons/png/saturn-planet-48.png',
    128: 'icons/png/saturn-planet-128.png',
  },
})

/**
 * @crxjs emits background and content scripts as internal assets, bypassing
 * Rollup's entryFileNames option entirely. This plugin runs after all files
 * are written to disk (writeBundle), renames them to clean names, and patches
 * every reference in manifest.json so nothing goes out of sync.
 */
function renameExtensionChunks(): Plugin {
  return {
    name: 'saturn-rename-chunks',
    apply: 'build',
    async writeBundle(opts) {
      const outDir = opts.dir ?? 'dist'
      const manifestPath = resolve(outDir, 'manifest.json')

      let manifestText = await readFile(manifestPath, 'utf-8')
      const mf = JSON.parse(manifestText) as Record<string, unknown>

      async function renameAndPatch(oldName: string, newName: string): Promise<void> {
        await rename(resolve(outDir, oldName), resolve(outDir, newName))
        manifestText = manifestText.replaceAll(oldName, newName)
      }

      const bg = (mf['background'] as Record<string, string> | undefined)?.['service_worker']
      if (typeof bg === 'string' && bg !== 'background.js') {
        await renameAndPatch(bg, 'background.js')
      }

      const contentFile = (
        (mf['content_scripts'] as Array<Record<string, unknown>> | undefined)
          ?.[0]?.['js'] as string[] | undefined
      )?.[0]
      if (typeof contentFile === 'string' && contentFile !== 'content.js') {
        await renameAndPatch(contentFile, 'content.js')
      }

      await writeFile(manifestPath, manifestText)
    },
  }
}

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  plugins: [
    react(),
    crx({ manifest }),
    renameExtensionChunks(),
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'esnext',
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})

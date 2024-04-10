import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { vueDsfrAutoimportPreset, ohVueIconAutoimportPreset, vueDsfrComponentResolver } from '@gouvminint/vue-dsfr'

const isCypress = process.env.CYPRESS === 'true'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [
    vue(),
    vueJsx(),
    AutoImport({
      include: [
        /\.[tj]sx?$/,
        /\.vue$/, /\.vue\?vue/,
      ],
      imports: [
        'vue',
        'vue-router',
        ...(isCypress ? [] : ['vitest']),
        vueDsfrAutoimportPreset,
        ohVueIconAutoimportPreset,
      ],
      vueTemplate: true,
      dts: './src/auto-imports.d.ts',
      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json',
        globalsPropValue: true,
      },
    }),
    // https://github.com/antfu/unplugin-vue-components
    Components({
      extensions: ['vue'],
      // allow auto import and register components
      include: [/\.vue$/, /\.vue\?vue/],
      dts: './src/components.d.ts',
      resolvers: [
        vueDsfrComponentResolver,
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

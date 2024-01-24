// vite.config.ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///C:/Users/thomas.bouchardon/Documents/Developpement/Projets/02_GMCD/tchap-bot/frontend/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/thomas.bouchardon/Documents/Developpement/Projets/02_GMCD/tchap-bot/frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///C:/Users/thomas.bouchardon/Documents/Developpement/Projets/02_GMCD/tchap-bot/frontend/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import AutoImport from "file:///C:/Users/thomas.bouchardon/Documents/Developpement/Projets/02_GMCD/tchap-bot/frontend/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///C:/Users/thomas.bouchardon/Documents/Developpement/Projets/02_GMCD/tchap-bot/frontend/node_modules/unplugin-vue-components/dist/vite.js";
import { vueDsfrAutoimportPreset, ohVueIconAutoimportPreset, vueDsfrComponentResolver } from "file:///C:/Users/thomas.bouchardon/Documents/Developpement/Projets/02_GMCD/tchap-bot/frontend/node_modules/@gouvminint/vue-dsfr/dist/vue-dsfr.js";
var __vite_injected_original_import_meta_url = "file:///C:/Users/thomas.bouchardon/Documents/Developpement/Projets/02_GMCD/tchap-bot/frontend/vite.config.ts";
var isCypress = process.env.CYPRESS === "true";
var vite_config_default = defineConfig({
  base: process.env.BASE_URL || "/",
  plugins: [
    vue(),
    vueJsx(),
    AutoImport({
      include: [
        /\.[tj]sx?$/,
        /\.vue$/,
        /\.vue\?vue/
      ],
      imports: [
        "vue",
        "vue-router",
        ...isCypress ? [] : ["vitest"],
        vueDsfrAutoimportPreset,
        ohVueIconAutoimportPreset
      ],
      vueTemplate: true,
      dts: "./src/auto-imports.d.ts",
      eslintrc: {
        enabled: true,
        filepath: "./.eslintrc-auto-import.json",
        globalsPropValue: true
      }
    }),
    // https://github.com/antfu/unplugin-vue-components
    Components({
      extensions: ["vue"],
      // allow auto import and register components
      include: [/\.vue$/, /\.vue\?vue/],
      dts: "./src/components.d.ts",
      resolvers: [
        vueDsfrComponentResolver
      ]
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx0aG9tYXMuYm91Y2hhcmRvblxcXFxEb2N1bWVudHNcXFxcRGV2ZWxvcHBlbWVudFxcXFxQcm9qZXRzXFxcXDAyX0dNQ0RcXFxcdGNoYXAtYm90XFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx0aG9tYXMuYm91Y2hhcmRvblxcXFxEb2N1bWVudHNcXFxcRGV2ZWxvcHBlbWVudFxcXFxQcm9qZXRzXFxcXDAyX0dNQ0RcXFxcdGNoYXAtYm90XFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy90aG9tYXMuYm91Y2hhcmRvbi9Eb2N1bWVudHMvRGV2ZWxvcHBlbWVudC9Qcm9qZXRzLzAyX0dNQ0QvdGNoYXAtYm90L2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnXG5cbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcbmltcG9ydCB2dWVKc3ggZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlLWpzeCdcbmltcG9ydCBBdXRvSW1wb3J0IGZyb20gJ3VucGx1Z2luLWF1dG8taW1wb3J0L3ZpdGUnXG5pbXBvcnQgQ29tcG9uZW50cyBmcm9tICd1bnBsdWdpbi12dWUtY29tcG9uZW50cy92aXRlJ1xuaW1wb3J0IHsgdnVlRHNmckF1dG9pbXBvcnRQcmVzZXQsIG9oVnVlSWNvbkF1dG9pbXBvcnRQcmVzZXQsIHZ1ZURzZnJDb21wb25lbnRSZXNvbHZlciB9IGZyb20gJ0Bnb3V2bWluaW50L3Z1ZS1kc2ZyJ1xuXG5jb25zdCBpc0N5cHJlc3MgPSBwcm9jZXNzLmVudi5DWVBSRVNTID09PSAndHJ1ZSdcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJhc2U6IHByb2Nlc3MuZW52LkJBU0VfVVJMIHx8ICcvJyxcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIHZ1ZUpzeCgpLFxuICAgIEF1dG9JbXBvcnQoe1xuICAgICAgaW5jbHVkZTogW1xuICAgICAgICAvXFwuW3RqXXN4PyQvLFxuICAgICAgICAvXFwudnVlJC8sIC9cXC52dWVcXD92dWUvLFxuICAgICAgXSxcbiAgICAgIGltcG9ydHM6IFtcbiAgICAgICAgJ3Z1ZScsXG4gICAgICAgICd2dWUtcm91dGVyJyxcbiAgICAgICAgLi4uKGlzQ3lwcmVzcyA/IFtdIDogWyd2aXRlc3QnXSksXG4gICAgICAgIHZ1ZURzZnJBdXRvaW1wb3J0UHJlc2V0LFxuICAgICAgICBvaFZ1ZUljb25BdXRvaW1wb3J0UHJlc2V0LFxuICAgICAgXSxcbiAgICAgIHZ1ZVRlbXBsYXRlOiB0cnVlLFxuICAgICAgZHRzOiAnLi9zcmMvYXV0by1pbXBvcnRzLmQudHMnLFxuICAgICAgZXNsaW50cmM6IHtcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgZmlsZXBhdGg6ICcuLy5lc2xpbnRyYy1hdXRvLWltcG9ydC5qc29uJyxcbiAgICAgICAgZ2xvYmFsc1Byb3BWYWx1ZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FudGZ1L3VucGx1Z2luLXZ1ZS1jb21wb25lbnRzXG4gICAgQ29tcG9uZW50cyh7XG4gICAgICBleHRlbnNpb25zOiBbJ3Z1ZSddLFxuICAgICAgLy8gYWxsb3cgYXV0byBpbXBvcnQgYW5kIHJlZ2lzdGVyIGNvbXBvbmVudHNcbiAgICAgIGluY2x1ZGU6IFsvXFwudnVlJC8sIC9cXC52dWVcXD92dWUvXSxcbiAgICAgIGR0czogJy4vc3JjL2NvbXBvbmVudHMuZC50cycsXG4gICAgICByZXNvbHZlcnM6IFtcbiAgICAgICAgdnVlRHNmckNvbXBvbmVudFJlc29sdmVyLFxuICAgICAgXSxcbiAgICB9KSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICB9LFxuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBbWMsU0FBUyxlQUFlLFdBQVc7QUFFdGUsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sWUFBWTtBQUNuQixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLGdCQUFnQjtBQUN2QixTQUFTLHlCQUF5QiwyQkFBMkIsZ0NBQWdDO0FBUHNNLElBQU0sMkNBQTJDO0FBU3BWLElBQU0sWUFBWSxRQUFRLElBQUksWUFBWTtBQUcxQyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNLFFBQVEsSUFBSSxZQUFZO0FBQUEsRUFDOUIsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLElBQ0osT0FBTztBQUFBLElBQ1AsV0FBVztBQUFBLE1BQ1QsU0FBUztBQUFBLFFBQ1A7QUFBQSxRQUNBO0FBQUEsUUFBVTtBQUFBLE1BQ1o7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0EsR0FBSSxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVE7QUFBQSxRQUM5QjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxhQUFhO0FBQUEsTUFDYixLQUFLO0FBQUEsTUFDTCxVQUFVO0FBQUEsUUFDUixTQUFTO0FBQUEsUUFDVCxVQUFVO0FBQUEsUUFDVixrQkFBa0I7QUFBQSxNQUNwQjtBQUFBLElBQ0YsQ0FBQztBQUFBO0FBQUEsSUFFRCxXQUFXO0FBQUEsTUFDVCxZQUFZLENBQUMsS0FBSztBQUFBO0FBQUEsTUFFbEIsU0FBUyxDQUFDLFVBQVUsWUFBWTtBQUFBLE1BQ2hDLEtBQUs7QUFBQSxNQUNMLFdBQVc7QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssY0FBYyxJQUFJLElBQUksU0FBUyx3Q0FBZSxDQUFDO0FBQUEsSUFDdEQ7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K

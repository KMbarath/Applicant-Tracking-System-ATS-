import {defineConfig} from 'vite';
export default defineConfig({esbuild:{jsxInject:"import React from 'react'"},test:{environment:'jsdom',globals:true,setupFiles:'./src/testSetup.js'}});

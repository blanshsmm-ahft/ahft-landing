import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    // Относительный base — чтобы сайт работал на GitHub Pages
    // (https://user.github.io/repo/) с любым именем репозитория.
    base: './',
    plugins: [tailwindcss()],
    preview: {
        allowedHosts: ['.local'],
    },
});
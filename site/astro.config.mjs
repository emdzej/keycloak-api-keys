// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://emdzej.github.io',
	base: '/keycloak-api-keys',
	integrations: [
		starlight({
			title: 'Keycloak API Keys',
			logo: {
				src: './src/assets/logo.svg',
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/emdzej/keycloak-api-keys' },
			],
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
					],
				},
				{
					label: 'Configuration',
					items: [
						{ label: 'SPI Configuration', slug: 'configuration/spi' },
						{ label: 'Client Settings', slug: 'configuration/client' },
						{ label: 'Key Prefixes', slug: 'configuration/prefixes' },
					],
				},
				{
					label: 'Middleware',
					items: [
						{ label: 'Java / Spring Boot', slug: 'middleware/java' },
						{ label: 'Node.js / Express', slug: 'middleware/node' },
						{ label: '.NET / ASP.NET Core', slug: 'middleware/dotnet' },
					],
				},
				{
					label: 'API Reference',
					autogenerate: { directory: 'api' },
				},
			],
		}),
	],
});

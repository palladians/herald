import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'
import { useRouter } from 'next/router';

const config: DocsThemeConfig = {
	logo: <span>Herald</span>,
	project: {
		link: "https://github.com/palladians/herald",
	},
	chat: {
		link: "https://t.me/",
	},
	docsRepositoryBase: "https://github.com/palladians/herald-docs/tree/main",
	footer: {
		text: (
			<span>MIT {new Date().getFullYear()} © Herald - Credential Creation & Proving</span>
		),
	},
	editLink: {
		text: (
			<span>Contribute to Herald | Edit on GitHub</span>
		),
	},
	primaryHue: 10,
	useNextSeoProps() {
		const { asPath } = useRouter();
		if (asPath !== "/") {
			return {
				titleTemplate: "%s",
			};
		}
	},
	themeSwitch: {
		useOptions() {
			return {
				light: "Light",
				dark: "Dark",
				system: "System",
			};
		},
	},
};

export default config

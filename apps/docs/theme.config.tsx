import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'
import { useRouter } from 'next/router';



const config: DocsThemeConfig = {
	logo: <span>Herald</span>,
	project: {
		link: "https://github.com/palladians/herald",
	},
	chat: {
		link: "https://discord.com/channels/1127906495409958953/1137446548469448805",
	},
	docsRepositoryBase: "https://github.com/palladians/herald/tree/main/apps/docs",
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
	primaryHue: {light: 45, dark: 45},
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

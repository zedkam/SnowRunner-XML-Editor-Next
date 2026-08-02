import type { ViteDevServer } from 'vite'
import type VitePlugin from '@electron-forge/plugin-vite'

export { }

declare global {
	const RENDERER_VITE_DEV_SERVER_URL: string
	
	namespace NodeJS {
		interface Process {
			viteDevServers: Record<string, ViteDevServer>
		}
	}

	type VitePluginConfig = ConstructorParameters<typeof VitePlugin>[0]

	interface VitePluginRuntimeKeys {
		VITE_DEV_SERVER_URL: `${string}_VITE_DEV_SERVER_URL`
		VITE_NAME: `${string}_VITE_NAME`
	}
}

declare module 'vite' {
	interface ConfigEnv<K extends 'build' | 'renderer' = 'build' | 'renderer'> {
		root: string
		forgeConfig: VitePluginConfig
		forgeConfigSelf: VitePluginConfig[K][number]
	}
}

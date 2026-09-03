import { api } from '@electron-forge/core'

try {
	await api.package({
		dir: process.cwd(),
		interactive: false,
		platform: 'win32',
		arch: 'x64',
	})
} catch (error) {
	console.error(error)
	process.exitCode = 1
}

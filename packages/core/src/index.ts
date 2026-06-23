import type { PluginOption, UserConfig } from 'vite'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import type { PluginOptions } from './types'
import { PLUGIN_NAME } from './constants'
import { getGlobalConfig, setGlobalConfig } from './config/resolve'
import { generateAll } from './generate'
import { getCharFilePaths } from './core/chars'
import { clearCache } from './core/cache'
import { debounce, isFileUnderDir, resolveRoot } from './utils'
import { logError, logInfo } from './log'

export type { PluginOptions, FontRule } from './types'

/**
 * @en Vite font subsetting plugin. Trims fonts to a character whitelist, outputs
 *     multiple formats and generates @font-face CSS. Optional auto chunking with
 *     unicode-range. Runs in both dev (watch + rebuild) and build.
 * @zh Vite 字体裁剪插件。按字符白名单裁剪字体，输出多格式并生成 @font-face CSS。
 *     可选自动分包（unicode-range）。dev（监听重建）与 build 均运行。
 */
export default function FontSplit(
    options: Partial<Omit<PluginOptions, 'viteConfig' | 'isBuild'>> = {}
): PluginOption {
    setGlobalConfig(options)

    const { cacheDir, enableDev } = getGlobalConfig()
    const cachePath = resolveRoot(cacheDir)
    if (!existsSync(cachePath)) {
        mkdirSync(cachePath, { recursive: true })
    }

    let isBuild = false
    let viteConfig: UserConfig

    return {
        name: PLUGIN_NAME,

        config(config, { command }) {
            viteConfig = config
            isBuild = command === 'build'
            const global = getGlobalConfig()
            global.viteConfig = viteConfig
            global.isBuild = isBuild
        },

        async buildStart() {
            try {
                await generateAll(true)
            } catch (err) {
                logError('Font generation failed', err)
            }
        },

        configureServer(server) {
            if (!enableDev) return
            const { rules } = getGlobalConfig()

            // Files to watch: source fonts + char files. Output dirs/styles are excluded.
            const fontPaths = rules.map((r) => resolveRoot(r.fontPath))
            const charPaths = rules.flatMap((r) => getCharFilePaths(r))
            const watchTargets = [...new Set([...fontPaths, ...charPaths])]

            // Ignore self-produced files to avoid rebuild loops.
            const outputDirs = rules.map((r) => resolveRoot(r.outputDir))
            const stylePaths = new Set(rules.map((r) => resolveRoot(r.stylePath)))

            const rebuild = debounce(() => {
                clearCache()
                generateAll(true)
                    .then((changed) => {
                        if (changed) {
                            server.moduleGraph.invalidateAll()
                            server.ws.send({ type: 'full-reload' })
                        }
                    })
                    .catch((err) => logError('Font rebuild failed', err))
            }, 150)

            watchTargets.forEach((p) => server.watcher.add(p))

            const onChange = (file: string) => {
                const abs = path.resolve(file)
                if (stylePaths.has(abs)) return
                if (outputDirs.some((dir) => isFileUnderDir(abs, dir))) return
                const hit =
                    watchTargets.includes(abs) ||
                    charPaths.some((p) => p === abs)
                if (hit) rebuild()
            }

            server.watcher.on('add', onChange)
            server.watcher.on('change', onChange)
            server.watcher.on('unlink', onChange)

            if (rules.length) {
                logInfo(`watching ${watchTargets.length} font/char source(s)`)
            }
        }
    }
}

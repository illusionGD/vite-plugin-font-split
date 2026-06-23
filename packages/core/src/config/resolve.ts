import type {
    FontFormat,
    FontRule,
    PluginOptions,
    SplitConfig
} from '../types'
import {
    DEFAULT_CACHE_DIR,
    DEFAULT_FILENAME,
    DEFAULT_FILENAME_SPLIT,
    DEFAULT_FORMATS
} from '../constants'
import { inferStyleLang } from '../utils'

/** @en Resolved per-rule config with defaults filled. @zh 填充默认值后的规则配置。 */
export type ResolvedFontRule = Omit<FontRule, 'split' | 'formats'> & {
    formats: FontFormat[]
    fileName: string
    split: false | Required<Pick<SplitConfig, 'formats'>> & SplitConfig
    styleLang: 'css' | 'scss'
}

/** @en Resolved plugin config. @zh 解析后的插件配置。 */
export type InternalConfig = Required<
    Pick<PluginOptions, 'enableDev' | 'cacheDir' | 'log'>
> & {
    rules: ResolvedFontRule[]
    styleLang?: 'css' | 'scss'
    viteConfig?: PluginOptions['viteConfig']
    isBuild?: boolean
}

const VALID_FORMATS: FontFormat[] = ['woff2', 'woff', 'ttf', 'otf']

function normalizeFormats(
    formats: FontFormat[] | undefined,
    fallback: FontFormat[]
): FontFormat[] {
    if (!formats || !formats.length) return [...fallback]
    const seen = new Set<FontFormat>()
    for (const f of formats) {
        if (VALID_FORMATS.includes(f)) seen.add(f)
    }
    return seen.size ? [...seen] : [...fallback]
}

/** @en Source font format from extension, for split default. @zh 由后缀推断源格式（分包默认用）。 */
function sourceFormat(fontPath: string): FontFormat {
    const ext = fontPath.split('.').pop()?.toLowerCase()
    if (ext === 'woff2') return 'woff2'
    if (ext === 'woff') return 'woff'
    if (ext === 'otf') return 'otf'
    return 'ttf'
}

function resolveSplit(
    rule: FontRule
): ResolvedFontRule['split'] {
    if (!rule.split) return false
    const cfg: SplitConfig = rule.split === true ? {} : rule.split
    return {
        ...cfg,
        formats: normalizeFormats(cfg.formats, [sourceFormat(rule.fontPath)])
    }
}

function resolveRule(
    rule: FontRule,
    styleLang?: 'css' | 'scss'
): ResolvedFontRule {
    const split = resolveSplit(rule)
    return {
        ...rule,
        formats: normalizeFormats(rule.formats, DEFAULT_FORMATS),
        fileName:
            rule.fileName ||
            (split ? DEFAULT_FILENAME_SPLIT : DEFAULT_FILENAME),
        split,
        styleLang: styleLang || inferStyleLang(rule.stylePath)
    }
}

/**
 * @en Resolve user options into a stable internal config.
 * @zh 将用户配置解析为稳定的内部配置。
 */
export function resolveInternalConfig(
    options: Partial<PluginOptions> = {}
): InternalConfig {
    const rules = (options.rules || []).map((r) =>
        resolveRule(r, options.styleLang)
    )
    return {
        enableDev: options.enableDev ?? true,
        cacheDir: options.cacheDir || DEFAULT_CACHE_DIR,
        log: options.log ?? true,
        styleLang: options.styleLang,
        rules,
        viteConfig: options.viteConfig,
        isBuild: options.isBuild
    }
}

let globalConfig: InternalConfig = resolveInternalConfig({})

/** @en Get global config. @zh 获取全局配置。 */
export function getGlobalConfig(): InternalConfig {
    return globalConfig
}

/** @en Set global config from user options. @zh 由用户配置设置全局配置。 */
export function setGlobalConfig(options: Partial<PluginOptions>): void {
    globalConfig = resolveInternalConfig(options)
}

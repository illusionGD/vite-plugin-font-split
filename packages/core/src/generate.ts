import { promises as fs } from 'fs'
import path from 'path'
import type { ResolvedFontRule } from './config/resolve'
import { getGlobalConfig } from './config/resolve'
import { resolveCharset } from './core/chars'
import { runSubset } from './core/subset'
import { renderFontFaces } from './css-gen'
import { getCacheEntry, setCacheEntry } from './core/cache'
import { baseName, hashContent, resolveRoot } from './utils'
import { logError, logSubset } from './log'

/** @en Stable cache key for a rule (by output target). @zh 规则的稳定缓存 key（按输出目标）。 */
function ruleKey(rule: ResolvedFontRule): string {
    return `${rule.fontPath}=>${rule.outputDir}|${rule.stylePath}|${rule.fontFamily || ''}`
}

/** @en Signature of the inputs that affect the output. @zh 影响产物的输入签名。 */
function ruleSignature(
    rule: ResolvedFontRule,
    fontBuffer: Uint8Array,
    charset: string[]
): string {
    const config = JSON.stringify({
        formats: rule.formats,
        split: rule.split,
        fileName: rule.fileName,
        fontFamily: rule.fontFamily,
        fontFaceOptions: rule.fontFaceOptions,
        outputDir: rule.outputDir,
        stylePath: rule.stylePath
    })
    
    return hashContent(fontBuffer, charset.join(''), config)
}

/** @en Remove stale font files previously produced for a rule's family. @zh 清理某规则旧产物。 */
async function cleanOutputDir(
    outputAbsDir: string,
    fontBase: string,
    keep: Set<string>
): Promise<void> {
    let entries: string[] = []
    try {
        entries = await fs.readdir(outputAbsDir)
    } catch {
        return
    }
    const re = new RegExp(
        `^${fontBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(_[0-9]+)?(\\.[^.]+)*\\.(woff2|woff|ttf|otf)$`
    )
    await Promise.all(
        entries.map(async (name) => {
            if (re.test(name) && !keep.has(name)) {
                await fs.unlink(path.join(outputAbsDir, name)).catch(() => {})
            }
        })
    )
}

/** @en Result of processing one rule: its rendered CSS fragment + change flag. @zh 单规则处理结果。 */
type RuleOutput = {
    /** @en Rendered @font-face fragment for this rule. @zh 该规则渲染的 @font-face 片段。 */
    css: string
    /** @en Whether the rule's font artifacts changed this run. @zh 本次该规则产物是否变化。 */
    changed: boolean
}

/**
 * @en Process one rule: subset + write font files. Returns the rendered CSS
 *     fragment (does NOT write the stylesheet — that happens after merging by
 *     stylePath). On a cache hit, returns the cached fragment without re-subsetting.
 * @zh 处理一条规则：裁剪 + 写字体文件。返回渲染好的 CSS 片段（不写样式文件，
 *     写入在按 stylePath 合并后进行）。命中缓存时直接返回缓存片段，不重复裁剪。
 */
async function processRule(
    rule: ResolvedFontRule,
    cacheDir: string,
    force = false
): Promise<RuleOutput> {
    const fontAbs = resolveRoot(rule.fontPath)
    const fontBuffer = new Uint8Array(await fs.readFile(fontAbs))
    const charset = await resolveCharset(rule)

    const signature = ruleSignature(rule, fontBuffer, charset)
    const key = ruleKey(rule)
    const cached = getCacheEntry(key)
    if (!force && cached && cached.signature === signature) {
        return { css: cached.css, changed: false }
    }

    const result = await runSubset(rule, fontBuffer, charset, cacheDir)

    const outputAbs = resolveRoot(rule.outputDir)
    await fs.mkdir(outputAbs, { recursive: true })

    // Write font files.
    const written = new Set<string>()
    let outputSize = 0
    for (const group of result.groups) {
        for (const art of group.artifacts) {
            await fs.writeFile(path.join(outputAbs, art.fileName), art.data)
            written.add(art.fileName)
            outputSize += art.data.byteLength
        }
    }

    // Drop stale files from previous runs.
    await cleanOutputDir(outputAbs, baseName(rule.fontPath), written)

    const family = rule.fontFamily || baseName(rule.fontPath)
    const css = renderFontFaces(rule, result, family)

    setCacheEntry(key, { signature, css })

    if (getGlobalConfig().log) {
        logSubset(
            family,
            charset.length,
            fontBuffer.byteLength,
            outputSize,
            result.groups.length
        )
    }
    return { css, changed: true }
}

/**
 * @en Write a merged stylesheet from CSS fragments. Returns whether the file changed.
 * @zh 由多个 CSS 片段写出合并后的样式文件。返回文件是否变化。
 */
async function writeStylesheet(
    styleAbs: string,
    fragments: string[]
): Promise<boolean> {
    const css = fragments.filter(Boolean).join('\n\n')
    await fs.mkdir(path.dirname(styleAbs), { recursive: true })
    let current = ''
    try {
        current = await fs.readFile(styleAbs, 'utf8')
    } catch {
        current = ''
    }
    if (current !== css) {
        await fs.writeFile(styleAbs, css, 'utf8')
        return true
    }
    return false
}

/**
 * @en Generate artifacts + stylesheet for a single rule (no merging).
 * @zh 为单条规则生成产物 + 样式（不合并）。
 */
export async function generateRule(
    rule: ResolvedFontRule,
    cacheDir: string,
    force = false
): Promise<boolean> {
    const { css, changed } = await processRule(rule, cacheDir, force)
    const styleChanged = await writeStylesheet(resolveRoot(rule.stylePath), [css])
    return changed || styleChanged
}

/**
 * @en Generate all rules. Rules sharing the same `stylePath` are merged into one
 *     stylesheet (in rule declaration order). Returns whether any output changed.
 * @zh 生成所有规则。共用同一 `stylePath` 的规则会按声明顺序合并写入同一样式文件。
 *     返回是否有任意产物发生变化。
 */
export async function generateAll(force = false): Promise<boolean> {
    const { rules, cacheDir } = getGlobalConfig()
    let changed = false

    // Group fragments by resolved stylesheet path, preserving rule order.
    const byStyle = new Map<string, string[]>()

    for (const rule of rules) {
        try {
            const { css, changed: ruleChanged } = await processRule(
                rule,
                cacheDir,
                force
            )
            changed = changed || ruleChanged
            const styleAbs = resolveRoot(rule.stylePath)
            if (!byStyle.has(styleAbs)) byStyle.set(styleAbs, [])
            byStyle.get(styleAbs)!.push(css)
        } catch (err) {
            logError(`Failed to process font: ${rule.fontPath}`, err)
        }
    }

    for (const [styleAbs, fragments] of byStyle.entries()) {
        try {
            const styleChanged = await writeStylesheet(styleAbs, fragments)
            changed = changed || styleChanged
        } catch (err) {
            logError(`Failed to write stylesheet: ${styleAbs}`, err)
        }
    }

    return changed
}

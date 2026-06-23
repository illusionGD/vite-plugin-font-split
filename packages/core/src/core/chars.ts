import { promises as fs } from 'fs'
import type { CharsSource, FontRule } from '../types'
import { matchChar, resolveRoot } from '../utils'

/**
 * @en Code points that should never be kept (whitespace / invisible / control / zero-width).
 * @zh 永远不保留的码点（空白 / 不可见 / 控制符 / 零宽字符）。
 */
function isInvisible(char: string): boolean {
    const cp = char.codePointAt(0)
    if (cp === undefined) return true
    // C0/C1 controls, space, DEL
    if (cp <= 0x20 || (cp >= 0x7f && cp <= 0xa0)) return true
    // Common whitespace & zero-width & BOM & line/para separators
    if (
        cp === 0x200b || // zero width space
        cp === 0x200c || // zero width non-joiner
        cp === 0x200d || // zero width joiner
        cp === 0x2028 || // line separator
        cp === 0x2029 || // paragraph separator
        cp === 0x3000 || // ideographic space
        cp === 0xfeff // BOM / zero width no-break space
    ) {
        return true
    }
    return false
}

/**
 * @en Recursively collect characters from every string VALUE of a JSON structure
 *     (object values, array items, nested). Keys are ignored.
 * @zh 递归收集 JSON 结构里所有 string 类型 VALUE 的字符（对象值、数组项、嵌套）。忽略 key。
 */
function collectFromJson(value: unknown, sink: Set<string>): void {
    if (typeof value === 'string') {
        for (const ch of value) sink.add(ch)
        return
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        for (const ch of String(value)) sink.add(ch)
        return
    }
    if (Array.isArray(value)) {
        for (const item of value) collectFromJson(item, sink)
        return
    }
    if (value && typeof value === 'object') {
        for (const v of Object.values(value)) collectFromJson(v, sink)
    }
}

/** @en Resolve a CharsSource (string / array / factory) to a flat string. @zh 求值字符来源为字符串。 */
async function resolveCharsSource(source: CharsSource): Promise<string> {
    const value = typeof source === 'function' ? await source() : source
    return Array.isArray(value) ? value.join('') : value
}

/** @en Read one character file (.json recursive values / .txt whole file). @zh 读取单个字符文件。 */
async function readCharsFile(filePath: string, sink: Set<string>): Promise<void> {
    const abs = resolveRoot(filePath)
    const raw = await fs.readFile(abs, 'utf8')
    if (/\.json$/i.test(filePath)) {
        try {
            collectFromJson(JSON.parse(raw), sink)
        } catch {
            // Malformed JSON: fall back to treating the file as raw text.
            for (const ch of raw) sink.add(ch)
        }
    } else {
        for (const ch of raw) sink.add(ch)
    }
}

/**
 * @en Build the final character set for a rule: merge `chars` + `charsPath`,
 *     drop invisible chars, then apply include/exclude. Returns sorted unique chars.
 * @zh 构建规则最终字符集：合并 `chars` + `charsPath`，剔除不可见字符，再做 include/exclude。
 */
export async function resolveCharset(rule: FontRule): Promise<string[]> {
    const sink = new Set<string>()

    if (rule.chars !== undefined) {
        const text = await resolveCharsSource(rule.chars)
        for (const ch of text) sink.add(ch)
    }

    if (rule.charsPath) {
        const paths = Array.isArray(rule.charsPath)
            ? rule.charsPath
            : [rule.charsPath]
        for (const p of paths) {
            await readCharsFile(p, sink)
        }
    }

    const result: string[] = []
    for (const ch of sink) {
        if (isInvisible(ch)) continue
        if (rule.include && !matchChar(rule.include, ch)) continue
        if (rule.exclude && matchChar(rule.exclude, ch)) continue
        result.push(ch)
    }
    // Stable order so the content hash is deterministic.
    result.sort()
    return result
}

/** @en Absolute paths of char files for a rule (for watching). @zh 规则的字符文件绝对路径（用于监听）。 */
export function getCharFilePaths(rule: FontRule): string[] {
    if (!rule.charsPath) return []
    const paths = Array.isArray(rule.charsPath) ? rule.charsPath : [rule.charsPath]
    return paths.map(resolveRoot)
}

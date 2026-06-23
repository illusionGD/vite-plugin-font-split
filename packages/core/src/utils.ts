import { createHash } from 'crypto'
import path from 'path'
import type { FontFormat, PatternType } from './types'
import { FORMAT_EXT } from './constants'

/**
 * @en Match a single character against a pattern. For string/string[] the match
 *     is "character is included in the pattern text" (substring of the pattern).
 * @zh 判断单个字符是否命中规则。string/string[] 语义为"该字符出现在规则文本中"。
 */
export function matchChar(pattern: PatternType, char: string): boolean {
    if (typeof pattern === 'function') {
        return pattern(char)
    }
    if (Array.isArray(pattern)) {
        return pattern.some((p) => p.includes(char))
    }
    if (typeof pattern === 'string') {
        return pattern.includes(char)
    }
    return pattern.test(char)
}

/** @en Short content hash. @zh 内容短哈希。 */
export function hashContent(...parts: (string | Uint8Array)[]): string {
    const hash = createHash('md5')
    for (const part of parts) {
        hash.update(part as any)
    }
    return hash.digest('hex').slice(0, 10)
}

/** @en Resolve a path relative to project root. @zh 相对项目根解析路径。 */
export function resolveRoot(p: string): string {
    return path.resolve(process.cwd(), p)
}

/** @en Base name without extension. @zh 去扩展名的文件名。 */
export function baseName(filePath: string): string {
    return path.parse(filePath).name
}

/**
 * @en Fill a filename template. Placeholders: [name] [hash] [index] [ext].
 * @zh 填充文件名模板。占位符：[name] [hash] [index] [ext]。
 */
export function fillFileName(
    template: string,
    vars: { name: string; hash: string; index: number; format: FontFormat }
): string {
    return template
        .replace(/\[name\]/g, vars.name)
        .replace(/\[hash\]/g, vars.hash)
        .replace(/\[index\]/g, String(vars.index))
        .replace(/\[ext\]/g, FORMAT_EXT[vars.format])
}

/**
 * @en Compute the import URL used inside the generated stylesheet:
 *     a path relative from the stylesheet dir to the font file.
 * @zh 计算生成样式里引用字体用的相对路径（从样式目录到字体文件）。
 */
export function relativeFontUrl(
    styleAbsPath: string,
    fontAbsPath: string
): string {
    const rel = path
        .relative(path.dirname(styleAbsPath), fontAbsPath)
        .replace(/\\/g, '/')
    return rel.startsWith('.') ? rel : `./${rel}`
}

/** @en Whether the path looks like a font file. @zh 是否字体文件路径。 */
export function isFontFile(p: string): boolean {
    return /\.(ttf|otf|woff2?|ttc)$/i.test(p)
}

/** @en Infer style language from a stylesheet path. @zh 根据样式路径推断语言。 */
export function inferStyleLang(stylePath: string): 'css' | 'scss' {
    return /\.s[ac]ss$/i.test(stylePath) ? 'scss' : 'css'
}

/** @en Debounce a zero-arg async/void function. @zh 防抖一个无参函数。 */
export function debounce(fn: () => void, wait: number): () => void {
    let timer: ReturnType<typeof setTimeout> | undefined
    return () => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(fn, wait)
    }
}

/** @en Whether `file` is inside `dir`. @zh 判断 file 是否在 dir 之内。 */
export function isFileUnderDir(file: string, dir: string): boolean {
    const f = path.resolve(file)
    const d = path.resolve(dir)
    if (f === d) return true
    const rel = path.relative(d, f)
    return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)
}

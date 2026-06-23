import { fontSplit, decodeReporter } from 'cn-font-split'
import path from 'path'
import type { ResolvedFontRule } from '../config/resolve'
import type {
    FontArtifact,
    FontFaceGroup,
    FontFormat,
    SubsetResult
} from '../types'
import {
    convertToFormats,
    convertToTtf,
    subsetToFormat,
    subsetToFormats
} from './convert'
import { baseName, fillFileName, hashContent, resolveRoot } from '../utils'

/** @en Convert sorted code points into a CSS `unicode-range` value. @zh 码点数组转 CSS unicode-range。 */
export function toUnicodeRange(codepoints: number[]): string {
    const sorted = [...new Set(codepoints)].sort((a, b) => a - b)
    if (!sorted.length) return ''
    const hex = (n: number) => n.toString(16).toUpperCase()
    const ranges: string[] = []
    let start = sorted[0]
    let prev = sorted[0]
    for (let i = 1; i <= sorted.length; i++) {
        const cur = sorted[i]
        if (cur === prev + 1) {
            prev = cur
            continue
        }
        ranges.push(
            start === prev ? `U+${hex(start)}` : `U+${hex(start)}-${hex(prev)}`
        )
        start = cur
        prev = cur
    }
    return ranges.join(',')
}

function buildArtifacts(
    formatsMap: Record<FontFormat, Uint8Array>,
    formats: FontFormat[],
    fontBase: string,
    fileNameTpl: string,
    index: number
): FontArtifact[] {
    return formats.map((format) => {
        const data = formatsMap[format]
        const hash = hashContent(data)
        const fileName = fillFileName(fileNameTpl, {
            name: fontBase,
            hash,
            index,
            format
        })
        return { fileName, data, format, index }
    })
}

/**
 * @en Subset a font into one group (no split). With a charset: trim to it and
 *     output each format. Without a charset: don't trim, only re-encode each format.
 * @zh 非分包单组。配了字符集：裁剪到字符集并输出各格式；未配字符集：不裁剪，仅转各格式。
 */
async function subsetSingle(
    rule: ResolvedFontRule,
    fontBuffer: Uint8Array,
    charset: string[]
): Promise<SubsetResult> {
    const formatsMap = charset.length
        ? await subsetToFormats(fontBuffer, charset.join(''), rule.formats)
        : await convertToFormats(fontBuffer, rule.formats)
    const fontBase = baseName(rule.fontPath)
    const artifacts = buildArtifacts(
        formatsMap,
        rule.formats,
        fontBase,
        rule.fileName,
        0
    )
    return {
        groups: [{ index: 0, unicodeRange: '', artifacts }]
    }
}

type ChunkDetail = { chars: number[] }

/**
 * @en Run cn-font-split on the trimmed font and return per-chunk code points.
 * @zh 对裁剪后的字体跑 cn-font-split，返回每个分包的码点集合。
 */
async function splitIntoChunks(
    trimmed: Uint8Array,
    cacheDir: string,
    chunkSize?: number
): Promise<ChunkDetail[]> {
    let reporterBin: Uint8Array | null = null
    const outDir = resolveRoot(path.join(cacheDir, '.cnfs-tmp'))
    await fontSplit({
        input: trimmed,
        outDir,
        autoSubset: true,
        targetType: 'woff2',
        reporter: true,
        testHtml: false,
        silent: true,
        ...(chunkSize ? { chunkSize } : {}),
        // Intercept every write so nothing is persisted to outDir.
        outputFile: async (file: string, data: Uint8Array | string) => {
            const base = file.split(/[\\/]/).pop() || ''
            if (base === 'reporter.bin') {
                reporterBin =
                    data instanceof Uint8Array
                        ? data
                        : new Uint8Array(Buffer.from(data))
            }
        }
    })
    if (!reporterBin) return []
    const report = decodeReporter(reporterBin).toObject()
    return (report.subsetDetail || [])
        .map((d) => ({ chars: (d.chars || []) as number[] }))
        .filter((c) => c.chars.length > 0)
}

/**
 * @en Subset a font into multiple chunks. With a charset, trim to it first; without
 *     one, split the whole font. cn-font-split chunks it, then each chunk is re-subset
 *     into every requested format with its own unicode-range.
 * @zh 分包。配了字符集先裁剪到字符集，未配则对整字体分包。cn-font-split 分包后，
 *     按每包码点重新生成各格式与 unicode-range。
 */
async function subsetSplit(
    rule: ResolvedFontRule,
    fontBuffer: Uint8Array,
    charset: string[],
    cacheDir: string
): Promise<SubsetResult> {
    const split = rule.split as Exclude<ResolvedFontRule['split'], false>
    // Feed cn-font-split an sfnt: trimmed to the charset, or the full font when
    // no charset is configured ("don't trim, just split the whole font").
    const base = charset.length
        ? await subsetToFormat(fontBuffer, charset.join(''), 'ttf')
        : await convertToTtf(fontBuffer)
    const chunks = await splitIntoChunks(base, cacheDir, split.chunkSize)

    // Fallback: if splitting yielded nothing, behave like single subset.
    if (!chunks.length) {
        return subsetSingle({ ...rule, formats: split.formats }, fontBuffer, charset)
    }

    const fontBase = baseName(rule.fontPath)
    const groups: FontFaceGroup[] = []
    for (let index = 0; index < chunks.length; index++) {
        const codepoints = chunks[index].chars
        const chunkText = codepoints
            .map((cp) => String.fromCodePoint(cp))
            .join('')
        const formatsMap = await subsetToFormats(
            base,
            chunkText,
            split.formats
        )
        const artifacts = buildArtifacts(
            formatsMap,
            split.formats,
            fontBase,
            rule.fileName,
            index
        )
        groups.push({
            index,
            unicodeRange: toUnicodeRange(codepoints),
            artifacts
        })
    }
    return { groups }
}

/**
 * @en Produce the full subset result for a rule.
 * @zh 产出一条规则的完整裁剪结果。
 */
export async function runSubset(
    rule: ResolvedFontRule,
    fontBuffer: Uint8Array,
    charset: string[],
    cacheDir: string
): Promise<SubsetResult> {
    if (rule.split) {
        return subsetSplit(rule, fontBuffer, charset, cacheDir)
    }
    return subsetSingle(rule, fontBuffer, charset)
}

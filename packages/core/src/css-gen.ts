import path from 'path'
import type { ResolvedFontRule } from './config/resolve'
import type { FontFaceGroup, SubsetResult } from './types'
import { FORMAT_HINT } from './constants'
import { relativeFontUrl, resolveRoot } from './utils'

/**
 * @en Build the `src:` value for one @font-face group, ordering formats so that
 *     woff2 comes first (browsers pick the first they support).
 * @zh 构建一组 @font-face 的 `src:`，woff2 优先（浏览器取首个支持的）。
 */
function buildSrc(
    group: FontFaceGroup,
    styleAbsPath: string,
    outputAbsDir: string
): string {
    const order = ['woff2', 'woff', 'ttf', 'otf']
    const sorted = [...group.artifacts].sort(
        (a, b) => order.indexOf(a.format) - order.indexOf(b.format)
    )
    return sorted
        .map((art) => {
            const fontAbs = path.join(outputAbsDir, art.fileName)
            const url = relativeFontUrl(styleAbsPath, fontAbs)
            return `url("${url}") format("${FORMAT_HINT[art.format]}")`
        })
        .join(',\n         ')
}

/**
 * @en Render the @font-face blocks for one rule's subset result.
 * @zh 将一条规则的裁剪结果渲染为 @font-face 代码块。
 */
export function renderFontFaces(
    rule: ResolvedFontRule,
    result: SubsetResult,
    family: string
): string {
    const styleAbs = resolveRoot(rule.stylePath)
    const outputAbs = resolveRoot(rule.outputDir)
    const face = rule.fontFaceOptions || {}
    const display = face.display || 'swap'
    const weight = face.weight || 'normal'
    const style = face.style || 'normal'

    const blocks = result.groups.map((group) => {
        const lines = [
            '@font-face {',
            `    font-family: "${family}";`,
            `    font-style: ${style};`,
            `    font-weight: ${weight};`,
            `    font-display: ${display};`,
            `    src: ${buildSrc(group, styleAbs, outputAbs)};`
        ]
        if (group.unicodeRange) {
            lines.push(`    unicode-range: ${group.unicodeRange};`)
        }
        lines.push('}')
        return lines.join('\n')
    })
    return blocks.join('\n\n')
}

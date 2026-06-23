import subsetFont from 'subset-font'
import { convert } from 'fontverter'
import type { FontFormat } from '../types'
import { SUBSET_TARGET } from '../constants'

function toUint8(buf: Buffer): Uint8Array {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
}

function toBuffer(input: Uint8Array): Buffer {
    return Buffer.isBuffer(input) ? input : Buffer.from(input)
}

/** @en fontverter target per output format (no subsetting). @zh 各格式对应 fontverter 目标（不裁剪）。 */
const CONVERT_TARGET: Record<FontFormat, 'woff2' | 'woff' | 'truetype'> = {
    woff2: 'woff2',
    woff: 'woff',
    ttf: 'truetype',
    otf: 'truetype'
}

/**
 * @en Subset a font buffer to `text` and output the requested format, using harfbuzz
 *     (subset-font). This both trims glyphs to the whitelist AND converts format.
 *     Passing empty `text` keeps (essentially) no glyphs, so callers must pass the
 *     full charset to keep everything.
 * @zh 用 harfbuzz（subset-font）把字体裁剪到 `text` 并输出目标格式：既裁字形也转格式。
 *     `text` 为空时几乎不保留字形，因此"保留全部"需由调用方传入全量字符集。
 */
export async function subsetToFormat(
    input: Uint8Array,
    text: string,
    format: FontFormat
): Promise<Uint8Array> {
    const result = await subsetFont(toBuffer(input), text, {
        targetFormat: SUBSET_TARGET[format]
    })
    return toUint8(result)
}

/**
 * @en Subset one font buffer into multiple formats in parallel.
 * @zh 将一个字体缓冲并行裁剪为多种格式。
 */
export async function subsetToFormats(
    input: Uint8Array,
    text: string,
    formats: FontFormat[]
): Promise<Record<FontFormat, Uint8Array>> {
    const entries = await Promise.all(
        formats.map(
            async (format) =>
                [format, await subsetToFormat(input, text, format)] as const
        )
    )
    return Object.fromEntries(entries) as Record<FontFormat, Uint8Array>
}

/**
 * @en Convert a font buffer to a format WITHOUT subsetting (keeps all glyphs).
 *     Used when no charset is configured: "don't trim, only re-encode".
 * @zh 仅转格式、不裁剪（保留全部字形）。未配置字符集时使用："不裁剪，只转格式"。
 */
export async function convertToFormat(
    input: Uint8Array,
    format: FontFormat
): Promise<Uint8Array> {
    const result = await convert(toBuffer(input), CONVERT_TARGET[format])
    return toUint8(result)
}

/**
 * @en Convert one font buffer into multiple formats (no subsetting), in parallel.
 * @zh 将一个字体缓冲并行转为多种格式（不裁剪）。
 */
export async function convertToFormats(
    input: Uint8Array,
    formats: FontFormat[]
): Promise<Record<FontFormat, Uint8Array>> {
    const entries = await Promise.all(
        formats.map(
            async (format) =>
                [format, await convertToFormat(input, format)] as const
        )
    )
    return Object.fromEntries(entries) as Record<FontFormat, Uint8Array>
}

/**
 * @en Convert a font buffer to TrueType (sfnt) for feeding cn-font-split.
 * @zh 将字体转为 TrueType（sfnt）以喂给 cn-font-split。
 */
export async function convertToTtf(input: Uint8Array): Promise<Uint8Array> {
    const result = await convert(toBuffer(input), 'truetype')
    return toUint8(result)
}

import type { FontFormat } from './types'

/** @en Plugin name. @zh 插件名。 */
export const PLUGIN_NAME = 'vite-plugin-font-split'

/** @en Default output font formats. @zh 默认输出字体格式。 */
export const DEFAULT_FORMATS: FontFormat[] = ['woff2', 'woff', 'ttf', 'otf']

/** @en Default cache dir. @zh 默认缓存目录。 */
export const DEFAULT_CACHE_DIR = 'node_modules/.cache/vite-plugin-font-split'

/** @en Default filename templates. @zh 默认文件名模板。 */
export const DEFAULT_FILENAME = '[name].[ext]'
export const DEFAULT_FILENAME_SPLIT = '[name]_[index].[ext]'

/** @en MIME / format hint used in `src: url() format(...)`. @zh `src` 中 format() 用的格式提示。 */
export const FORMAT_HINT: Record<FontFormat, string> = {
    woff2: 'woff2',
    woff: 'woff',
    ttf: 'truetype',
    otf: 'opentype'
}

/** @en File extension per format. @zh 各格式文件后缀。 */
export const FORMAT_EXT: Record<FontFormat, string> = {
    woff2: 'woff2',
    woff: 'woff',
    ttf: 'ttf',
    otf: 'otf'
}

/**
 * @en subset-font targetFormat per output format.
 *     ttf/otf both map to 'sfnt' (glyf for TrueType source, OTTO/CFF for CFF source).
 * @zh 各输出格式对应 subset-font 的 targetFormat。
 *     ttf/otf 都映射到 'sfnt'（TrueType 源出 glyf，CFF 源出 OTTO/CFF）。
 */
export const SUBSET_TARGET: Record<FontFormat, 'woff2' | 'woff' | 'sfnt'> = {
    woff2: 'woff2',
    woff: 'woff',
    ttf: 'sfnt',
    otf: 'sfnt'
}

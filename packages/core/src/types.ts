import type { UserConfig } from 'vite'

export type AnyObject = {
    [key: string | number | symbol]: any
}

/**
 * @en Path matching pattern. Supports:
 * - `string`: substring match
 * - `RegExp`: regex test
 * - `string[]`: matches if ANY substring is included
 * - `(path: string) => boolean`: custom predicate
 * @zh 路径匹配规则。支持字符串子串、正则、字符串数组、自定义函数。
 */
export type PatternType =
    | string
    | RegExp
    | string[]
    | ((path: string) => boolean)

/**
 * @en Output font formats. `otf` falls back to truetype/sfnt subset (CFF outlines kept as OTTO).
 * @zh 输出字体格式。`otf` 走 truetype/sfnt 子集（CFF 轮廓保留 OTTO 头）。
 */
export type FontFormat = 'woff2' | 'woff' | 'ttf' | 'otf'

/**
 * @en Character whitelist source: literal string / array / sync or async factory.
 * @zh 字符白名单来源：字符串 / 数组 / 同步或异步函数。
 */
export type CharsSource =
    | string
    | string[]
    | (() => string | string[] | Promise<string | string[]>)

/**
 * @en @font-face descriptors that are appended to every generated rule.
 * @zh 追加到每条生成 @font-face 上的描述符。
 */
export type FontFaceOptions = {
    /** @en font-display, default: 'swap'. @zh font-display，默认 'swap'。 */
    display?: string
    /** @en font-weight descriptor, default: 'normal'. @zh font-weight 描述符，默认 'normal'。 */
    weight?: string
    /** @en font-style descriptor, default: 'normal'. @zh font-style 描述符，默认 'normal'。 */
    style?: string
}

/**
 * @en Split (chunking) config. When enabled, the trimmed font is split into
 *     multiple subset files keyed by unicode-range for on-demand loading.
 * @zh 分包配置。启用后，裁剪后的字体会被切分为多个带 unicode-range 的子集文件，浏览器按需加载。
 */
export type SplitConfig = {
    /**
     * @en Target byte size per chunk, passed to cn-font-split chunkSize.
     * @zh 单个分包目标字节数，透传给 cn-font-split 的 chunkSize。
     */
    chunkSize?: number
    /**
     * @en Output formats for split chunks, default: source font format only.
     * @zh 分包输出格式，默认仅输出源字体格式。
     */
    formats?: FontFormat[]
}

/**
 * @en A single font subsetting rule.
 * @zh 单条字体裁剪规则。
 */
export type FontRule = {
    /**
     * @en Source font file path, relative to project root (`process.cwd()`). ttf/otf/woff/woff2.
     * @zh 源字体文件路径，相对项目根目录。支持 ttf/otf/woff/woff2。
     */
    fontPath: string
    /**
     * @en Inline character whitelist. Merged with `charsPath`. Omit both to keep all glyphs.
     * @zh 内联字符白名单，与 `charsPath` 合并。两者都不传则保留全部字形。
     */
    chars?: CharsSource
    /**
     * @en Character file path(s). `.json` (recursively collect all values) / `.txt` (whole file).
     * @zh 字符文件路径，支持 `.json`（递归收集所有 value）/ `.txt`（整文件取字符）。
     */
    charsPath?: string | string[]
    /**
     * @en Output directory for subset font files, relative to project root.
     * @zh 裁剪产物输出目录，相对项目根目录。
     */
    outputDir: string
    /**
     * @en Generated stylesheet path (.css/.scss), relative to project root.
     * @zh 生成的样式文件路径（.css/.scss），相对项目根目录。
     */
    stylePath: string
    /**
     * @en @font-face font-family, default: source font file base name.
     * @zh @font-face 的 font-family，默认取源字体文件名。
     */
    fontFamily?: string
    /**
     * @en Output filename template. Placeholders: [name] [hash] [index] [ext].
     *     Default: '[name].[ext]' (non-split) or '[name]_[index].[ext]' (split).
     * @zh 输出文件名模板。占位符：[name] [hash] [index] [ext]。
     *     默认：不分包 '[name].[ext]'；分包 '[name]_[index].[ext]'。
     */
    fileName?: string
    /**
     * @en Keep only characters matching the pattern (applied on the merged charset).
     * @zh 仅保留命中规则的字符（作用于合并后的字符集）。
     */
    include?: PatternType
    /**
     * @en Drop characters matching the pattern (applied after `include`).
     * @zh 剔除命中规则的字符（在 `include` 之后执行）。
     */
    exclude?: PatternType
    /**
     * @en Output formats, default: ['woff2', 'woff', 'ttf', 'otf'].
     * @zh 输出格式，默认：['woff2', 'woff', 'ttf', 'otf']。
     */
    formats?: FontFormat[]
    /**
     * @en Enable chunking. `true` for defaults, or an object for fine control.
     * @zh 启用分包。`true` 使用默认值，或传对象做精细控制。
     */
    split?: boolean | SplitConfig
    /**
     * @en Extra @font-face descriptors.
     * @zh 额外的 @font-face 描述符。
     */
    fontFaceOptions?: FontFaceOptions
}

export type PluginOptions = {
    /**
     * @en Font subsetting rules.
     * @zh 字体裁剪规则列表。
     */
    rules: FontRule[]
    /**
     * @en Whether to run in dev (watch + rebuild), default: true.
     * @zh 是否在开发环境运行（监听 + 热重建），默认：true。
     */
    enableDev?: boolean
    /**
     * @en Generated stylesheet language. Default: inferred from stylePath extension.
     * @zh 生成样式语言。默认根据 stylePath 后缀推断。
     */
    styleLang?: 'css' | 'scss'
    /**
     * @en Cache directory, default: node_modules/.cache/vite-plugin-font-split.
     * @zh 缓存目录，默认：node_modules/.cache/vite-plugin-font-split。
     */
    cacheDir?: string
    /**
     * @en Whether to print logs, default: true.
     * @zh 是否打印日志，默认：true。
     */
    log?: boolean

    /** @en Vite config (internal). @zh Vite 配置（内部）。 */
    viteConfig?: UserConfig
    /** @en Whether current env is build (internal). @zh 是否构建环境（内部）。 */
    isBuild?: boolean
}

/**
 * @en One emitted font file for a rule (one format, one chunk).
 * @zh 一条规则产出的单个字体文件（一种格式、一个分包）。
 */
export type FontArtifact = {
    /** @en Output filename (no dir). @zh 输出文件名（不含目录）。 */
    fileName: string
    /** @en File bytes. @zh 文件字节内容。 */
    data: Uint8Array
    /** @en Format of this file. @zh 该文件格式。 */
    format: FontFormat
    /** @en Chunk index (0 for non-split). @zh 分包序号（非分包为 0）。 */
    index: number
}

/**
 * @en One @font-face group: same family, one unicode-range, multiple format sources.
 * @zh 一组 @font-face：同 family、同 unicode-range、多格式 src。
 */
export type FontFaceGroup = {
    /** @en Chunk index. @zh 分包序号。 */
    index: number
    /** @en unicode-range string, empty for non-split. @zh unicode-range 字符串，非分包为空。 */
    unicodeRange: string
    /** @en Artifacts of this group keyed by format. @zh 该组各格式产物。 */
    artifacts: FontArtifact[]
}

/**
 * @en Full subset result for a rule.
 * @zh 一条规则的完整裁剪结果。
 */
export type SubsetResult = {
    groups: FontFaceGroup[]
}

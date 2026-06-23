declare module 'subset-font' {
    type TargetFormat = 'sfnt' | 'woff' | 'woff2'
    interface SubsetFontOptions {
        targetFormat?: TargetFormat
        preserveNameIds?: number[]
        variationAxes?: Record<string, number | { min?: number; max?: number; default?: number }>
        noLayoutClosure?: boolean
    }
    /**
     * Create a subset of `font` containing only the glyphs needed for `text`,
     * optionally converting to another format.
     */
    export default function subsetFont(
        font: Buffer | Uint8Array,
        text: string,
        options?: SubsetFontOptions
    ): Promise<Buffer>
}

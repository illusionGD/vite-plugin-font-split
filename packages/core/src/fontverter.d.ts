declare module 'fontverter' {
    type Format = 'sfnt' | 'truetype' | 'woff' | 'woff2'
    /** Convert a font buffer to another container format without subsetting. */
    export function convert(
        buffer: Buffer | Uint8Array,
        toFormat: Format,
        fromFormat?: Format
    ): Promise<Buffer>
    /** Detect the format of a font buffer. */
    export function detectFormat(buffer: Buffer | Uint8Array): Format | undefined
}

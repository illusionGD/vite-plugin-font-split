import pc from 'picocolors'
import { PLUGIN_NAME } from './constants'

/** @en Format byte size to human-readable. @zh 字节数转可读字符串。 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const prefix = pc.cyan(`[${PLUGIN_NAME}]`)

export function logInfo(msg: string): void {
    console.log(`${prefix} ${msg}`)
}

export function logSuccess(msg: string): void {
    console.log(`${prefix} ${pc.green(msg)}`)
}

export function logWarn(msg: string): void {
    console.warn(`${prefix} ${pc.yellow(msg)}`)
}

export function logError(msg: string, err?: unknown): void {
    console.error(`${prefix} ${pc.red(msg)}`)
    if (err) console.error(err)
}

/**
 * @en Log a subset result line: family, char count, size reduction.
 * @zh 打印裁剪结果：family、字符数、体积变化。
 */
export function logSubset(
    family: string,
    charCount: number,
    originSize: number,
    outputSize: number,
    chunks: number
): void {
    const ratio =
        originSize > 0
            ? `${((1 - outputSize / originSize) * 100).toFixed(1)}%`
            : '-'
    const chunkInfo = chunks > 1 ? pc.dim(` (${chunks} chunks)`) : ''
    logInfo(
        `${pc.bold(family)} ${pc.dim(`${charCount} chars`)} ` +
            `${formatFileSize(originSize)} ${pc.dim('→')} ` +
            `${pc.green(formatFileSize(outputSize))} ${pc.dim(`(-${ratio})`)}${chunkInfo}`
    )
}

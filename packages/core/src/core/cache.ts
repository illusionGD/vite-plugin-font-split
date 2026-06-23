/**
 * @en In-memory incremental cache keyed by `hash(font bytes + charset + config)`.
 *     Stores the rendered @font-face fragment too, so a cache hit can still
 *     contribute its CSS when multiple rules are merged into one stylesheet.
 * @zh 基于 `hash(字体内容 + 字符集 + 配置)` 的内存增量缓存，同时缓存渲染好的 @font-face 片段，
 *     以便多个规则合并到同一样式文件时，命中缓存的规则仍能提供其 CSS。
 */
type CacheEntry = {
    signature: string
    css: string
}

const cache = new Map<string, CacheEntry>()

/** @en Get the cached entry for a rule key. @zh 取规则 key 的缓存条目。 */
export function getCacheEntry(key: string): CacheEntry | undefined {
    return cache.get(key)
}

/** @en Store the entry for a rule key. @zh 写入规则 key 的缓存条目。 */
export function setCacheEntry(key: string, entry: CacheEntry): void {
    cache.set(key, entry)
}

/** @en Clear all cache (e.g. on dev rebuild). @zh 清空缓存。 */
export function clearCache(): void {
    cache.clear()
}

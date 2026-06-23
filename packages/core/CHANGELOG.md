# vite-plugin-font-split

## 1.0.2

### Patch Changes

- 1.0.2

## 1.0.1

### Patch Changes

- 1.0.1

## 1.0.0

### Minor Changes

- e69d87c: 首个公开版本：Vite 字体裁剪 / 分包插件。

  - 按字符白名单裁剪字体（基于 harfbuzz / `subset-font`），中文大字体可压到几 KB
  - 可选自动分包（基于 `cn-font-split`，生成带 `unicode-range` 的 `@font-face`）
  - 多格式输出（woff2 / woff / ttf / otf）、自定义文件名模板、include / exclude 过滤
  - 灵活的字符来源（字符串 / 数组 / 函数 / `.json` / `.txt`）
  - dev 热重建（监听字体与字符文件变化）与内容 hash 增量缓存

### Patch Changes

- 1.0.0

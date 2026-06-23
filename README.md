# vite-plugin-font-split

Vite 字体裁剪 / 分包插件。根据字符集对字体文件进行裁剪压缩，输出多种格式字体并生成 `@font-face` 样式；可选自动分包（按 `unicode-range` 按需加载）。开发态（dev）与构建态（build）均运行，dev 下监听字体 / 字符文件变化自动重建。

## 特性

- 🎯 **按字符白名单裁剪**：基于 harfbuzz（`subset-font`）只保留用到的字符，中文大字体可从数 MB 压到几 KB
- 🌍 **全语言支持**：按 Unicode 码点裁剪，中、日、韩、拉丁、西里尔、阿拉伯等皆可
- 📦 **可选分包**：基于 `cn-font-split` 自动分包，生成多条带 `unicode-range` 的 `@font-face`
- 🎨 **多格式输出**：`woff2` / `woff` / `ttf` / `otf`，可配置
- 🔤 **灵活的字符来源**：直接传字符串 / 数组 / 函数，或读取 `.json`（递归取所有 value）/ `.txt` 文件
- 🔍 **包含 / 排除过滤**：对字符集做 include / exclude
- 📝 **自定义文件名**：`[name] [hash] [index] [ext]` 模板
- ⚡ **dev 热重建**：监听字体与字符文件变化自动重新裁剪
- 💾 **增量缓存**：内容 hash 缓存，无变化不重复裁剪

## 安装

```bash
pnpm add -D vite-plugin-font-split
```

> 依赖 `cn-font-split`，其安装时会下载平台原生库。若使用 pnpm，请在根 `package.json` 的 `pnpm.onlyBuiltDependencies` 中加入 `"cn-font-split"`，确保 postinstall 正常执行。

## 使用

```ts
// vite.config.ts
import FontSplit from 'vite-plugin-font-split'

export default defineConfig({
    plugins: [
        FontSplit({
            rules: [
                // 1. 裁剪：仅保留指定字符，输出多格式
                {
                    fontPath: './src/assets/fonts/zh-Hans.woff',
                    chars: '你好世界中文字体裁剪',
                    outputDir: './src/assets/fonts/output',
                    stylePath: './src/assets/style/fonts.scss',
                    fontFamily: 'my-zh-font',
                    formats: ['woff2', 'woff', 'ttf']
                },
                // 2. 分包：自动按 unicode-range 切分，浏览器按需加载
                {
                    fontPath: './src/assets/fonts/source.otf',
                    charsPath: './src/assets/fonts/chars.json',
                    outputDir: './src/assets/fonts/output',
                    stylePath: './src/assets/style/fonts-split.scss',
                    split: { chunkSize: 50 * 1024, formats: ['woff2'] }
                }
            ]
        })
    ]
})
```

然后在样式入口引入生成的样式：

```scss
@use './assets/style/fonts.scss';
```

## 配置项

### `PluginOptions`

| 字段        | 类型                 | 默认值  | 说明                                  |
| ----------- | -------------------- | ------- | ------------------------------------- |
| `rules`     | `FontRule[]`         | `[]`    | 字体裁剪规则列表                      |
| `enableDev` | `boolean`            | `true`  | 是否在开发环境运行（监听 + 热重建）   |
| `styleLang` | `'css' \| 'scss'`    | 按后缀  | 生成样式语言，默认按 `stylePath` 后缀 |
| `cacheDir`  | `string`             | `node_modules/.cache/vite-plugin-font-split` | 缓存目录 |
| `log`       | `boolean`            | `true`  | 是否打印日志                          |

### `FontRule`

| 字段              | 类型                                              | 默认值                            | 说明 |
| ----------------- | ------------------------------------------------- | --------------------------------- | ---- |
| `fontPath`        | `string`                                          | —（必填）                         | 源字体文件路径，相对项目根。支持 ttf/otf/woff/woff2 |
| `outputDir`       | `string`                                          | —（必填）                         | 裁剪产物输出目录，相对项目根 |
| `stylePath`       | `string`                                          | —（必填）                         | 生成的样式文件路径（.css/.scss） |
| `chars`           | `string \| string[] \| () => string \| string[]` | —                                 | 内联字符白名单（与 `charsPath` 合并） |
| `charsPath`       | `string \| string[]`                              | —                                 | 字符文件：`.json` 递归取所有 value / `.txt` 整文件取字符 |
| `fontFamily`      | `string`                                          | 源文件名                          | `@font-face` 的 font-family |
| `fileName`        | `string`                                          | `[name].[ext]`（分包 `[name]_[index].[ext]`） | 输出文件名模板 |
| `include`         | `PatternType`                                     | —                                 | 仅保留命中规则的字符 |
| `exclude`         | `PatternType`                                     | —                                 | 剔除命中规则的字符（在 include 之后） |
| `formats`         | `('woff2'\|'woff'\|'ttf'\|'otf')[]`               | `['woff2','woff','ttf','otf']`    | 输出格式 |
| `split`           | `boolean \| { chunkSize?, formats? }`             | `false`                           | 分包配置，`formats` 默认仅源字体格式 |
| `fontFaceOptions` | `{ display?, weight?, style? }`                   | `{ display:'swap' }`              | 额外 `@font-face` 描述符 |

`PatternType` 支持：`string`（子串包含）/ `RegExp` / `string[]` / `(char: string) => boolean`。

## 字符文件解析

- `.json`：**递归遍历所有 value**（对象值、数组项、嵌套），收集每个字符串值里的字符（不收集 key）
- `.txt`：整文件按字符收集
- `chars` 为函数时，dev 每次重建都会重新求值（动态字符场景）
- 合并去重后，自动**剔除不可见字符**（空格、换行、制表、零宽等），再做 include / exclude

## 不配置字符集

当一条规则既不配 `chars` 也不配 `charsPath`（字符集为空）时：

- **不裁剪**，保留字体全部字形，仅转换为配置的格式输出
- 若开启 `split`，直接对**整个字体**分包（按 `chunkSize` 切分并生成 `unicode-range`）

适合"只想转格式 / 只想分包，但不裁字符"的场景。

## 多规则合并样式

多个 `rule` 若配置了**相同的 `stylePath`**，它们生成的 `@font-face` 会按声明顺序**合并写入同一个样式文件**（不会相互覆盖）。常用于多语言字体共用一个入口样式：

```ts
FontSplit({
    rules: [
        { fontPath: './fonts/zh-Hans.woff', charsPath: './locales/zh-hans.json', outputDir: './fonts/output', stylePath: './style/fonts.scss', fontFamily: 'zh' },
        { fontPath: './fonts/ja.otf',       charsPath: './locales/ja.json',      outputDir: './fonts/output', stylePath: './style/fonts.scss', fontFamily: 'ja' }
    ]
})
// → fonts.scss 同时包含 zh、ja 两段 @font-face
```

## 工作原理

- **裁剪**：用 `subset-font`（harfbuzz）把字体裁剪到白名单字符并输出目标格式
- **分包**：先裁剪，再用 `cn-font-split` 自动分包得到各包码点，按码点重新裁剪出各格式并生成带 `unicode-range` 的 `@font-face`

> 说明：源字体为 OTF（CFF 轮廓）时，转 ttf/woff 走 sfnt 输出（保留 OTTO 头），可能存在失真；优先使用 `woff2`。

## 示例

仓库内置一个可运行示例 [packages/example](packages/example)，演示对中文字体（ZCOOL XiaoWei，约 6MB）的裁剪与分包：

```bash
pnpm install          # 在仓库根目录安装（会构建 cn-font-split 原生库）
pnpm example:dev      # 启动示例，dev 下改字符/字体自动热重建
pnpm example:build    # 或构建示例
```

## 本地开发与发布

本仓库是 pnpm + changesets monorepo，插件源码在 [packages/core](packages/core)。

```bash
pnpm install          # 安装全部 workspace 依赖
pnpm build            # 构建插件（packages/core -> dist）

pnpm release          # 添加 changeset 并 bump 版本 + 生成 CHANGELOG
pnpm publish:release  # 构建并发布到 npm（changeset publish）
```

提交建议用 `pnpm commit`（commitizen 规范化提交信息）；提交前 husky + lint-staged 会自动 `eslint --fix`。

## License

MIT

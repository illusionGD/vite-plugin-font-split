# vite-plugin-font-split · example

最小可运行示例：演示用 `vite-plugin-font-split` **裁剪** 与 **分包** 中文字体。

字体使用 [ZCOOL XiaoWei](https://github.com/googlefonts/zcool-xiaowei)（SIL OFL 1.1，约 6MB），
裁剪到页面真正用到的几十个字后，产物只有几 KB。

## 运行

```bash
# 在仓库根目录先安装依赖（会构建本地插件用到的原生库）
pnpm install

# 启动示例（开发态，改字符 / 字体会自动热重建）
pnpm example:dev

# 或构建
pnpm example:build
```

也可进入本目录单独运行：

```bash
cd packages/example
pnpm dev
```

## 说明

- [vite.config.ts](vite.config.ts) 配置了两条规则：
    - **规则 1（裁剪）**：`chars` 内联字符 + [src/data/chars.json](src/data/chars.json) 合并，
      输出 `woff2/woff`，生成 [src/assets/style/fonts.scss](src/assets/style/fonts.scss)
    - **规则 2（分包）**：`split` 自动按 `unicode-range` 切分，
      生成 [src/assets/style/fonts-split.scss](src/assets/style/fonts-split.scss)
- 生成的字体产物输出到 `src/assets/fonts/output/`（裁剪）与 `src/assets/fonts/output-split/`（分包），均已 gitignore。
- 生成的 `*.scss` 由插件写入，页面在 [src/main.ts](src/main.ts) 中直接 `import` 使用。

> 生成的样式文件与 `output/` 产物是插件自动生成的，已被忽略，无需手动维护。

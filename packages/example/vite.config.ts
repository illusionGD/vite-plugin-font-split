import { defineConfig } from 'vite'
import FontSplit from 'vite-plugin-font-split'

// 演示两种用法：
// 1) subset 规则：按字符白名单裁剪中文大字体（6MB -> 几 KB），输出多格式
// 2) split  规则：对同一字体自动分包，按 unicode-range 浏览器按需加载
export default defineConfig({
    plugins: [
        FontSplit({
            rules: [
                // —— 规则 1：裁剪 ——
                {
                    fontPath: './src/assets/fonts/ZCOOLXiaoWei-Regular.ttf',
                    // 字符来源：内联 + JSON 文件（递归取所有 value 里的字符）合并
                    chars: '字体裁剪分包',
                    charsPath: './src/data/chars.json',
                    outputDir: './src/assets/fonts/output',
                    stylePath: './src/assets/style/fonts.scss',
                    fontFamily: 'ZCOOL-Subset',
                    formats: ['woff2', 'woff']
                },
                // —— 规则 2：分包 ——
                {
                    fontPath: './src/assets/fonts/ZCOOLXiaoWei-Regular.ttf',
                    chars: '欢迎使用字体分包按需加载的演示文案',
                    outputDir: './src/assets/fonts/output-split',
                    stylePath: './src/assets/style/fonts-split.scss',
                    fontFamily: 'ZCOOL-Split',
                    split: { chunkSize: 30 * 1024, formats: ['woff2'] }
                }
            ]
        })
    ]
})

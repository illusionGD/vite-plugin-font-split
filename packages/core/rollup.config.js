import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import terser from '@rollup/plugin-terser'
/** @type {import('rollup').RollupOptions[]} */

export default {
    input: `src/index.ts`,
    output: [
        {
            dir: 'dist',
            entryFileNames: 'esm/[name].js',
            format: 'esm',
            sourcemap: true
        },
        {
            dir: 'dist',
            entryFileNames: 'cjs/[name].js',
            format: 'cjs',
            sourcemap: true
        }
    ],
    plugins: [
        json(),
        commonjs(),
        resolve({
            preferBuiltins: true
        }),
        babel({ babelHelpers: 'bundled' }),
        typescript({
            tsconfig: './tsconfig.json'
        }),
        terser()
    ],
    // Keep all bare imports (node builtins + deps) external; only our own
    // source is bundled. Transitive deps like fontverter rely on CJS-only
    // globals (__dirname) and must not be bundled into the ESM output.
    external: (id) =>
        id !== 'src/index.ts' && !/^[./]|^[A-Za-z]:[\\/]/.test(id)
}

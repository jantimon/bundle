// This plugin lets you use web worker scripts the same way you do with Webpack's worker-loader.
// Based on https://github.com/endreymarcell/esbuild-plugin-webworker/
import path from 'path';
import esbuild from 'esbuild';

const { join, dirname, basename } = path;
export const WEB_WORKER = () => {
    /**
     * @type {import('esbuild').Plugin}
     */
    return {
        name: 'web-worker',
        setup(build) {
            build.onResolve({ filter: /^worker\:/ }, args => {
                // Feel free to remove this logline once you verify that the plugin works for your setup
                console.debug(`The web worker plugin matched an import to ${args.path} from ${args.importer}`);
                return {
                    path: args.path.replace(/^worker\:/, ""),
                    namespace: 'web-worker',
                    pluginData: { importer: args.importer },
                };
            });
            build.onLoad({ filter: /.*/, namespace: 'web-worker' }, async args => {
                const { path: importPath, pluginData: { importer } } = args;

                const workerWithFullPath = join(dirname(importer), importPath);
                const workerFileName = basename(workerWithFullPath);

                // You only need this for TypeScript
                // because the import will refer to a .ts file
                // but the web worker will need to point to a .js file
                const outFileName = workerFileName.replace(/\.ts$/, '.worker.js');

                // This one depends on your file structure
                const outFileWithRelativePath = join('docs', 'js', outFileName);

                try {
                    const __dirname = path.resolve();
                    await esbuild.build({
                        // entryNames: '[name].min',
                        target: ["es2018"],

                        entryPoints: [workerWithFullPath],
                        outfile: outFileWithRelativePath,
                        loader: { '.ttf': 'file' },
                        sourcemap: true,
                        assetNames: "[name]",
                        format: "esm",
                        banner: {
                            js: 'const global = globalThis;'
                        },
                        inject: [path.join(__dirname, './shims/node-shim.js')],
                        // splitting: true,

                        minify: true,
                        bundle: true,
                    });

                    return {
                        contents: `
// This file is generated by esbuild to expose the worker script as a class, like Webpack's worker-loader
export default "./js/${outFileName}"`,
                    };
                } catch (e) {
                    console.error('Could not build worker script:', e);
                }
            });
            // Resolve ".wasm" files to a path with a namespace
            //                 build.onResolve({ filter: /^worker\:/ }, args => {
            //                     let argsPath = args.path.replace(/^worker\:/, "");
            //                   // If this is the import inside the stub module, import the
            //                   // binary itself. Put the path in the "wasm-binary" namespace
            //                   // to tell our binary load callback to load the binary file.
            //                   if (args.namespace === 'resolve-worker') {
            //                     return {
            //                       path: argsPath,
            //                       namespace: 'load-worker',
            //                     }
            //                   }

            //                   // Otherwise, generate the JavaScript stub module for this
            //                   // ".wasm" file. Put it in the "wasm-stub" namespace to tell
            //                   // our stub load callback to fill it with JavaScript.
            //                   //
            //                   // Resolve relative paths to absolute paths here since this
            //                   // resolve callback is given "resolveDir", the directory to
            //                   // resolve imports against.
            //                   if (args.resolveDir === '') {
            //                       return; // Ignore unresolvable paths
            //                   }
            //                   return {
            //                     path: path.isAbsolute(argsPath) ? argsPath : path.join(args.resolveDir, argsPath),
            //                     namespace: 'resolve-worker',
            //                   }
            //                 })

            //                 // Virtual modules in the "wasm-stub" namespace are filled with
            //                 // the JavaScript code for compiling the WebAssembly binary. The
            //                 // binary itself is imported from a second virtual module.
            //                 build.onLoad({ filter: /.*/, namespace: 'worker-build' }, async (args) => ({
            //                     contents: `\
            // import wasm from "worker:${args.path}"
            // export default class {
            //     constructor() {
            //         // This path depends on how you serve your files
            //         return new Worker('${args.path}', { type: "module" });
            //     }
            // }`,
            //                 }))

            //                 // Virtual modules in the "wasm-binary" namespace contain the
            //                 // actual bytes of the WebAssembly file. This uses esbuild's
            //                 // built-in "binary" loader instead of manually embedding the
            //                 // binary data inside JavaScript code ourselves.
            //                 build.onLoad({ filter: /.*/, namespace: 'load-worker' }, async (args) => {
            //                     try {
            //                         await esbuild.build({
            //                             entryNames: '[name].min',
            //                             target: ["es2018"],

            //                             // entryPoints: [workerWithFullPath],
            //                             // outfile: outFileWithRelativePath,
            //                             entryPoints: args.path,
            //                             loader: { '.ttf': 'file' },
            //                             sourcemap: true,
            //                             format: "esm",

            //                             resolveDir: "/docs/js/",
            //                             // splitting: true,

            //                             minify: true,
            //                             bundle: true,
            //                         });

            //                         return ({
            //                             contents: await fs.promises.readFile(args.path),
            //                             loader: 'file',
            //                         })
            //                     } catch {
            //                         console.error('Could not build worker script:', e);
            //                     }
            //                 })
        },
    };
};
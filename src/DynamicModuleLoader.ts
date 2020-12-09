const pMap = require('p-map')

type PromiseFn<T> = () => Promise<T>

type ModuleParam = {
  modules: string | string[]
  loader: PromiseFn<any>
}
// get item type from an Array
type ExtractArrayItem<S, U> = S extends (infer P)[] ? P : U

type ModuleArrayItem<S> = ExtractArrayItem<S, ModuleParam>

type ExtractModule<T> = T extends { modules: any; loader: infer P }
  ? P
  : () => Promise<any>

type LoaderModules<S> = {
  [module: string]: ExtractModule<ModuleArrayItem<S>> | PromiseFn<any>
}

type ExtractPromise<T> = T extends Promise<infer P> ? P : any

type LoaderModuleParms<S> = {
  modules: string[] | string
  loader: ExtractModule<ModuleArrayItem<S>> | PromiseFn<any>
}

type LoadedLoader = {
  loader: () => Promise<any>
  callback: ReturnType<PromiseFn<any>>
}

/**
 *  Dynamic load modules by string types
 *  @example
 *  ```
 *    import { DynamicModuleLoader } from '@21epub/dynamic-loader'
 *
 *    const loaders = [
 *        {
 *           modules: ["module1", "module2"],
 *           loader: async () => {
 *                 await import('url/to/module1');
 *                 await import('url/to/module2')
 *           }
 *        },
 *        {
 *           modules: 'module3',
 *           loader: async () => {
 *                 await import('url/to/module3');
 *           }
 *        }
 *    ]
 *
 *    const dynamicLoader = new DynamicModuleLoader(loaders)
 *  ```
 *  ### You can also register other loaders after init
 *  ```
 *    dynamicLoader.register(['module4'], async () => {
 *        await import('url/to/module4')
 *    })
 *  ```
 *  ### Load modules whenever in need (callbacks are module returns )
 *  #### Return data should be considered by your async function
 *  ```
 *    dynamicLoader.loadAll().then( callbacks =>  console.log(callbacks))
 *  ```
 *  ### Load specific module as you wish
 *  ```
 *    dynamicLoader.load(['module1','module2']).then(callbacks => console.log(callbacks ))
 *  ```
 */
class DynamicModuleLoader<S extends LoaderModuleParms<S>[]> {
  private _modules: LoaderModules<S> = {}
  private _loadedModules: Record<
    string,
    ExtractPromise<ExtractModule<ModuleArrayItem<S>> | PromiseFn<any>>
  > = {}

  private _loadedLoaders: LoadedLoader[] = []
  /**
   *
   * @param loaderModules Initialized module loaders
   */
  constructor(loaderModules?: S) {
    if (loaderModules?.length) {
      loaderModules.forEach((loaderModule) => {
        this.register<typeof loaderModule.loader>(
          loaderModule.modules,
          loaderModule.loader
        )
      })
    }
  }

  private registerModule<T>(module: string, fn: () => Promise<T>) {
    if (!this._modules[module]) this._modules[module] = fn
  }

  private registerModules<T extends PromiseFn<any>>(modules: string[], fn: T) {
    // filter registered modules
    const validModules = modules.filter((module) => !this._modules[module])
    validModules.forEach((module) => {
      if (!this._modules[module]) this._modules[module] = fn
    })
  }

  /**
   * Register one or mutiple lazyload module
   * @param moduleOrModules
   * @param promiseFn
   */
  register<T extends PromiseFn<any>>(
    moduleOrModules: string | string[],
    promiseFn: T
  ) {
    if (typeof moduleOrModules === 'string') {
      this.registerModule<T>(moduleOrModules, promiseFn)
    } else if (moduleOrModules?.length && moduleOrModules[0]) {
      this.registerModules<T>(moduleOrModules, promiseFn)
    }
  }

  private checkModuleForSameLoader(module: string) {
    const moduleLoader = this._loadedModules[module]
    const hasLoadedLoader = this._loadedLoaders.find(
      (loadedLoader) => loadedLoader.loader === moduleLoader
    )
    if (hasLoadedLoader) {
      this._loadedModules[module] = hasLoadedLoader.loader
      return hasLoadedLoader.loader
    }
    return false
  }

  private checkLoaderForSameModule<T>(loader: () => Promise<any>, callback: T) {
    for (const module in this._modules) {
      if (!this._loadedModules[module]) {
        if (this._modules[module] === loader) {
          this._loadedModules[module] = callback
        }
      }
    }
  }

  private async loadModule(module: string) {
    // not load twice for the same module
    const checkLoadedLoader = this.checkModuleForSameLoader(module)
    if (checkLoadedLoader) return checkLoadedLoader
    if (!this._loadedModules[module]) {
      const fn = this._modules[module]
      const result = await (fn as PromiseFn<any>)()
      this._loadedModules[module] = result
      this.checkLoaderForSameModule<typeof result>(fn, result)
      return result
    }
    return this._loadedModules[module]
  }

  /**
   * Load one or mutiple modules
   * @param moduleOrModules
   */
  async load(moduleOrModules: string | string[]) {
    let modules: string[] = []
    if (typeof moduleOrModules === 'string') {
      modules = [moduleOrModules]
    } else if (moduleOrModules?.length && moduleOrModules[0]) {
      modules = moduleOrModules
    }
    modules = modules.filter((module) => this._modules[module])
    const results = await pMap(modules, this.loadModule.bind(this))
    return results
  }

  /**
   *  Load All the modules that have been registered or initialized by this ModuleLoader
   */
  async loadAll() {
    return this.load(Object.keys(this._modules))
  }

  /**
   *  get the list of registered modules
   */
  getLoadList() {
    return this._modules
  }

  /**
   * get a returned data for a specified module
   * Undefined when this module has not finish loading
   * @param module
   */
  get(module: string) {
    return this._loadedModules[module]
  }
}

export default DynamicModuleLoader

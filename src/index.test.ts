import { DynamicModuleLoader } from './'

const sleep = async (ms: number) => {
  return await new Promise((resolve) => setTimeout(resolve, ms))
}

test('should register single module ok', () => {
  const preLoadModules = [
    {
      modules: 'DemoComponent1',
      loader: async () => {
        return await import('./case/Demo1')
      }
    },
    {
      modules: 'DemoComponent2',
      loader: async () => {
        await sleep(1000)
        return await import('./case/Demo2')
      }
    }
  ]
  const dynamicLoader = new DynamicModuleLoader<typeof preLoadModules>(
    preLoadModules
  )
  expect(dynamicLoader.getLoadList().DemoComponent1).toBeTruthy()
  expect(dynamicLoader.getLoadList().DemoComponent2).toBeTruthy()
})

test('should register mutiple keys for same module ok ', () => {
  // support register batch modules to dynamic loader
  const demoLoader = new DynamicModuleLoader()
  demoLoader.register(['DemoComponent1', 'DemoComponent2'], async () => {
    await sleep(1000)
    const result = import('./case/Demo2')
    return result
  })
  expect(demoLoader.getLoadList().DemoComponent1).toBeTruthy()
  expect(demoLoader.getLoadList().DemoComponent2).toBeTruthy()
  expect(demoLoader.getLoadList().DemoComponent2).toBe(
    demoLoader.getLoadList().DemoComponent1
  )
})

test('The same load function should not execute twice ', () => {
  const demoLoader = new DynamicModuleLoader()
  demoLoader.register(['DemoComponent1', 'DemoComponent2'], async () => {
    await sleep(1000)
    const result = await import('./case/Demo2')
    return result
  })
  demoLoader.load('DemoComponent1').then(() => {
    expect(demoLoader.get('DemoComponent1').default).toBeTruthy()
    expect(demoLoader.get('DemoComponent2').default).toBeTruthy()
  })
})

test('should dynamic load modules ok', async () => {
  console.time('test')
  const dynamicLoader = new DynamicModuleLoader()
  dynamicLoader.register('DemoComponent1', async () => {
    await sleep(1000)
    return await import('./case/Demo1')
  })
  dynamicLoader.register('DemoComponent2', async () => {
    await sleep(1000)
    return await import('./case/Demo2')
  })
  dynamicLoader.register('DemoComponent3', async () => {
    await sleep(1000)
    return await import('./case/Demo3')
  })
  await dynamicLoader
    .load(['DemoComponent1', 'DemoComponent2'])
    .then((modules: any[]) => {
      console.timeEnd('test')
      expect(modules.length).toEqual(2)
      expect(dynamicLoader.get('DemoComponent1').default).toBeTruthy()
      expect(dynamicLoader.get('DemoComponent2').default).toBeTruthy()
      expect(dynamicLoader.get('DemoComponent3')?.default).toBeFalsy()
    })
})

test('Should Not reload the same module twice', async () => {
  const dynamicLoader = new DynamicModuleLoader()
  dynamicLoader.register('DemoComponent1', async () => {
    await sleep(1000)
    return await import('./case/Demo1')
  })
  await dynamicLoader.loadAll().then((modules: any[]) => {
    expect(modules[0].default).toEqual(
      dynamicLoader.get('DemoComponent1').default
    )
    expect(dynamicLoader.get('DemoComponent1').default).toBeTruthy()
  })
})

test('should not load a module that not exists in registered modules ', async () => {
  const dynamicLoader = new DynamicModuleLoader()
  dynamicLoader.register('DemoComponent1', async () => {
    await sleep(1000)
    return await import('./case/Demo1')
  })
  await dynamicLoader.load(['Demo1', 'Demo2']).then((modules: any[]) => {
    expect(modules.length).toBe(0)
  })
})

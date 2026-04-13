import { Controller, Get, Module } from '@nestjs/common';

export function createReadModelController(path: string, moduleName: string) {
  @Controller(path)
  class ReadModelController {
    @Get()
    getOverview() {
      return {
        module: moduleName,
        message: `${moduleName} module online`,
      };
    }
  }

  return ReadModelController;
}

export function createFeatureModule(controller: ReturnType<typeof createReadModelController>) {
  @Module({
    controllers: [controller],
  })
  class FeatureModule {}

  return FeatureModule;
}

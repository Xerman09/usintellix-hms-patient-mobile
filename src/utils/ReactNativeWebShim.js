import * as ReactNativeWeb from 'react-native-web';

export * from 'react-native-web';

export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: () => null,
};

export default {
  ...ReactNativeWeb,
  TurboModuleRegistry,
};

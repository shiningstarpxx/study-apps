import { createRepositoryContract } from '../../../shared/lib/repository/createRepositoryContract';

export const REQUIRED_BRIDGE_SETTINGS_REPOSITORY_METHODS = [
  'getSettings',
  'saveSettings',
];

export function createBridgeSettingsRepository(repository) {
  return createRepositoryContract(
    'bridgeSettingsRepository',
    repository,
    REQUIRED_BRIDGE_SETTINGS_REPOSITORY_METHODS,
  );
}

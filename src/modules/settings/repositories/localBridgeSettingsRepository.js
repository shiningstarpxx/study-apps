import { getBridgeSettings, saveBridgeSettings } from '../../../utils/ai';
import { createBridgeSettingsRepository } from './bridgeSettingsRepository';

export const localBridgeSettingsRepository = createBridgeSettingsRepository({
  getSettings: getBridgeSettings,
  saveSettings: saveBridgeSettings,
});

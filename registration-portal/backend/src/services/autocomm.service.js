import { config } from '../config/env.js';
import { AutoCommMockService } from './autocomm.mock.js';
import { AutoCommClient } from './autocomm.client.js';
import { logger } from '../utils/logger.js';

/**
 * Unified AutoComm Service
 * Seamlessly delegates to AutoCommMockService (MOCK_AUTOCOMM=true)
 * or real AutoCommClient (MOCK_AUTOCOMM=false).
 */
export class AutoCommService {
  static getBackendClient() {
    if (config.isMock) {
      return AutoCommMockService;
    }
    return AutoCommClient;
  }

  static async createContact(contactData) {
    const client = this.getBackendClient();
    return client.createContact(contactData);
  }

  static async addContactToGroup(groupData) {
    const client = this.getBackendClient();
    return client.addContactToGroup(groupData);
  }

  static async triggerWhatsAppMessage(waData) {
    const client = this.getBackendClient();
    return client.triggerWhatsAppMessage(waData);
  }

  static async triggerAutoCall(callData) {
    const client = this.getBackendClient();
    return client.triggerAutoCall(callData);
  }

  static isMock() {
    return config.isMock;
  }
}

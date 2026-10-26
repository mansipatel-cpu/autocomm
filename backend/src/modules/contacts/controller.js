import { ContactService } from './service.js';
import { successResponse, createdResponse } from '../../common/utils/response.util.js';

export class ContactController {
  static async list(req, res, next) {
    try {
      const { search, status, channel, groupId, page, limit } = req.query;
      const result = await ContactService.listContacts({
        clientId: req.clientId,
        search,
        status,
        channel,
        groupId,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '10', 10),
      });
      return successResponse(res, result, 'Contacts retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async stats(req, res, next) {
    try {
      const stats = await ContactService.getSummaryStats(req.clientId);
      return successResponse(res, stats, 'Contact summary stats retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const channelId = req.headers['x-channel-id'] || req.body.channelId || 4;
      const contact = await ContactService.createContact({
        clientId: req.clientId,
        channelId: parseInt(channelId, 10) || 4,
        ...req.body,
      });
      return createdResponse(res, contact, 'Contact created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updated = await ContactService.updateContact(req.clientId, req.params.id, req.body);
      return successResponse(res, updated, 'Contact updated');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await ContactService.deleteContact(req.clientId, req.params.id);
      return successResponse(res, result, 'Contact removed');
    } catch (error) {
      next(error);
    }
  }

  static async bulkAction(req, res, next) {
    try {
      const result = await ContactService.bulkAction(req.clientId, req.body);
      return successResponse(res, result, 'Bulk action applied');
    } catch (error) {
      next(error);
    }
  }

  static async importCsv(req, res, next) {
    try {
      const result = await ContactService.importCsv(req.clientId, req.body.contacts || []);
      return successResponse(res, result, 'Contacts imported successfully');
    } catch (error) {
      next(error);
    }
  }
}

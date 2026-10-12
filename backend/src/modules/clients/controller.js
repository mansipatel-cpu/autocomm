import { ClientService } from './service.js';
import { successResponse, createdResponse } from '../../common/utils/response.util.js';

export class ClientController {
  static async create(req, res, next) {
    try {
      const result = await ClientService.createClient(req.body);
      return createdResponse(res, result, 'Client workspace provisioned and credentials dispatched');
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const { search, status, plan, page, limit } = req.query;
      const result = await ClientService.listClients({
        search,
        status,
        plan,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '10', 10),
      });
      return successResponse(res, result, 'Clients retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const client = await ClientService.getClientById(req.params.id);
      return successResponse(res, client, 'Client details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updated = await ClientService.updateClient(req.params.id, req.body);
      return successResponse(res, updated, 'Client updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const updated = await ClientService.updateStatus(req.params.id, req.body.status);
      return successResponse(res, updated, `Client status updated to ${req.body.status}`);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const result = await ClientService.resetPassword(req.params.id);
      return successResponse(res, result, 'Client password reset successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await ClientService.deleteClient(req.params.id);
      return successResponse(res, result, 'Client deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

import { ClientService } from './service.js';
import { AuditLogService } from '../audit-logs/service.js';
import { successResponse, createdResponse } from '../../common/utils/response.util.js';

export class ClientController {
  static async create(req, res, next) {
    try {
      const result = await ClientService.createClient(req.body);
      await AuditLogService.record({
        req,
        action: 'CREATE_CLIENT',
        resourceType: 'CLIENT',
        resourceId: result.client._id || result.client.id,
        details: { companyName: result.client.companyName, plan: result.client.plan, clientCode: result.client.clientCode },
      });
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
      await AuditLogService.record({
        req,
        action: 'UPDATE_CLIENT',
        resourceType: 'CLIENT',
        resourceId: req.params.id,
        details: req.body,
      });
      return successResponse(res, updated, 'Client updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const updated = await ClientService.updateStatus(req.params.id, req.body.status);
      await AuditLogService.record({
        req,
        action: 'UPDATE_CLIENT_STATUS',
        resourceType: 'CLIENT',
        resourceId: req.params.id,
        details: { status: req.body.status },
      });
      return successResponse(res, updated, `Client status updated to ${req.body.status}`);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const result = await ClientService.resetPassword(req.params.id);
      await AuditLogService.record({
        req,
        action: 'RESET_CLIENT_PASSWORD',
        resourceType: 'CLIENT',
        resourceId: req.params.id,
        details: { email: result.email },
      });
      return successResponse(res, result, 'Client password reset successfully');
    } catch (error) {
      next(error);
    }
  }

  static async resendCredentials(req, res, next) {
    try {
      const result = await ClientService.resendCredentials(req.params.id);
      await AuditLogService.record({
        req,
        action: 'RESEND_CLIENT_CREDENTIALS',
        resourceType: 'CLIENT',
        resourceId: req.params.id,
        details: { email: result.email },
      });
      return successResponse(res, result, 'Credentials resent successfully');
    } catch (error) {
      next(error);
    }
  }

  static async manageCredits(req, res, next) {
    try {
      const updated = await ClientService.manageCredits(req.params.id, req.body);
      await AuditLogService.record({
        req,
        action: 'MANAGE_CLIENT_CREDITS',
        resourceType: 'CLIENT',
        resourceId: req.params.id,
        details: { credits: req.body.credits },
      });
      return successResponse(res, updated, 'Client credits updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async managePhoneNumbers(req, res, next) {
    try {
      const updated = await ClientService.managePhoneNumbers(req.params.id, req.body);
      await AuditLogService.record({
        req,
        action: 'MANAGE_CLIENT_PHONE_NUMBERS',
        resourceType: 'CLIENT',
        resourceId: req.params.id,
        details: { assignedPhoneNumbers: req.body.assignedPhoneNumbers },
      });
      return successResponse(res, updated, 'Client phone numbers updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await ClientService.deleteClient(req.params.id);
      await AuditLogService.record({
        req,
        action: 'DELETE_CLIENT',
        resourceType: 'CLIENT',
        resourceId: req.params.id,
      });
      return successResponse(res, result, 'Client deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

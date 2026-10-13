import { IncomingConnection } from './model.js';
import { Client } from '../clients/model.js';
import { AuditLogService } from '../audit-logs/service.js';
import { AppError } from '../../common/errors/app-error.js';
import { successResponse, createdResponse } from '../../common/utils/response.util.js';

export class SuperAdminIncomingController {
  static async list(req, res, next) {
    try {
      const { search, provider, status, clientId, page = '1', limit = '10' } = req.query;
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const filter = {};

      if (provider && provider !== 'all') {
        filter.provider = provider;
      }
      if (status && status !== 'all') {
        filter.status = status;
      }
      if (clientId && clientId !== 'all') {
        filter.clientId = clientId;
      }
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (pageNum - 1) * limitNum;
      const [connections, total] = await Promise.all([
        IncomingConnection.find(filter)
          .populate('clientId', 'companyName clientCode')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        IncomingConnection.countDocuments(filter),
      ]);

      return successResponse(res, {
        connections,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      }, 'Incoming connections retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { name, provider = 'Twilio', phoneNumber, webhookUrl, clientId, status = 'ACTIVE' } = req.body;
      if (!name) throw AppError.badRequest('Connection name is required');

      let clientRef = null;
      if (clientId && clientId !== 'none') {
        const client = await Client.findById(clientId);
        if (!client) throw AppError.notFound('Client not found');
        clientRef = client._id;
      }

      const connection = await IncomingConnection.create({
        name,
        provider,
        phoneNumber: phoneNumber || '',
        webhookUrl: webhookUrl || '',
        clientId: clientRef,
        status,
        lastActivityAt: new Date(),
        logs: [
          {
            timestamp: new Date().toISOString(),
            event: 'CONNECTION_INITIALIZED',
            details: `Trunk provisioned via ${provider}`,
            status: 'SUCCESS',
          },
        ],
      });

      await AuditLogService.record({
        req,
        action: 'CREATE_INCOMING_CONNECTION',
        resourceType: 'INCOMING_CONNECTION',
        resourceId: connection._id,
        details: { name, provider, clientId: clientRef },
      });

      return createdResponse(res, connection, 'Incoming connection created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { name, provider, phoneNumber, webhookUrl } = req.body;
      const updated = await IncomingConnection.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            name,
            provider,
            phoneNumber,
            webhookUrl,
          },
        },
        { new: true, runValidators: true }
      ).populate('clientId', 'companyName clientCode');

      if (!updated) throw AppError.notFound('Incoming connection not found');

      await AuditLogService.record({
        req,
        action: 'UPDATE_INCOMING_CONNECTION',
        resourceType: 'INCOMING_CONNECTION',
        resourceId: req.params.id,
        details: req.body,
      });

      return successResponse(res, updated, 'Incoming connection updated');
    } catch (error) {
      next(error);
    }
  }

  static async assign(req, res, next) {
    try {
      const { clientId } = req.body;
      const connection = await IncomingConnection.findById(req.params.id);
      if (!connection) throw AppError.notFound('Incoming connection not found');

      if (!clientId || clientId === 'none') {
        connection.clientId = null;
        await connection.save();

        await AuditLogService.record({
          req,
          action: 'UNASSIGN_INCOMING_CONNECTION',
          resourceType: 'INCOMING_CONNECTION',
          resourceId: connection._id,
          details: { name: connection.name },
        });

        return successResponse(res, connection, 'Connection unassigned from client');
      }

      const client = await Client.findById(clientId);
      if (!client) throw AppError.notFound('Client not found');

      connection.clientId = client._id;
      await connection.save();

      await AuditLogService.record({
        req,
        action: 'ASSIGN_INCOMING_CONNECTION',
        resourceType: 'INCOMING_CONNECTION',
        resourceId: connection._id,
        details: { name: connection.name, clientId: client._id },
      });

      return successResponse(res, connection, `Connection assigned to ${client.companyName}`);
    } catch (error) {
      next(error);
    }
  }

  static async toggleStatus(req, res, next) {
    try {
      const connection = await IncomingConnection.findById(req.params.id);
      if (!connection) throw AppError.notFound('Incoming connection not found');

      connection.status = connection.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await connection.save();

      await AuditLogService.record({
        req,
        action: 'TOGGLE_INCOMING_CONNECTION_STATUS',
        resourceType: 'INCOMING_CONNECTION',
        resourceId: connection._id,
        details: { status: connection.status },
      });

      return successResponse(res, connection, `Connection status updated to ${connection.status}`);
    } catch (error) {
      next(error);
    }
  }

  static async getLogs(req, res, next) {
    try {
      const connection = await IncomingConnection.findById(req.params.id).lean();
      if (!connection) throw AppError.notFound('Incoming connection not found');
      return successResponse(res, connection.logs || [], 'Connection logs retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const connection = await IncomingConnection.findByIdAndDelete(req.params.id);
      if (!connection) throw AppError.notFound('Incoming connection not found');

      await AuditLogService.record({
        req,
        action: 'DELETE_INCOMING_CONNECTION',
        resourceType: 'INCOMING_CONNECTION',
        resourceId: req.params.id,
        details: { name: connection.name },
      });

      return successResponse(res, { success: true }, 'Incoming connection deleted');
    } catch (error) {
      next(error);
    }
  }
}

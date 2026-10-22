import { PhoneNumber } from './model.js';
import { Client } from '../clients/model.js';
import { AuditLogService } from '../audit-logs/service.js';
import { AppError } from '../../common/errors/app-error.js';
import { successResponse, createdResponse } from '../../common/utils/response.util.js';
import { ensureSchemaAlignment } from '../../config/postgres.js';

const resolveClient = async (clientId) => {
  if (!clientId || clientId === 'none' || clientId === '') return null;
  const str = String(clientId).trim();
  if (/^\d+$/.test(str)) {
    const byId = await Client.findById(Number(str));
    if (byId) return byId;
  }
  const matchCode = str.match(/CLI-\d+/i);
  if (matchCode) {
    const byCode = await Client.findOne({ clientCode: matchCode[0].toUpperCase() });
    if (byCode) return byCode;
  }
  const byName = await Client.findOne({ companyName: str });
  if (byName) return byName;
  return null;
};

export class SuperAdminPhoneController {
  static async list(req, res, next) {
    try {
      const { search, status, type, clientId, page = '1', limit = '10' } = req.query;
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const filter = {};

      if (status && status !== 'all') {
        filter.status = status;
      }
      if (type && type !== 'all') {
        filter.type = type;
      }
      if (clientId && clientId !== 'all') {
        filter.clientId = clientId;
      }
      if (search) {
        filter.$or = [
          { phoneNumber: { $regex: search, $options: 'i' } },
          { friendlyName: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (pageNum - 1) * limitNum;
      const [numbers, total] = await Promise.all([
        PhoneNumber.find(filter)
          .populate('clientId', 'companyName clientCode')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        PhoneNumber.countDocuments(filter),
      ]);

      return successResponse(res, {
        phoneNumbers: numbers,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      }, 'Phone numbers retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const number = await PhoneNumber.findById(req.params.id)
        .populate('clientId', 'companyName clientCode')
        .populate('assignedAgentId', 'name')
        .lean();
      if (!number) throw AppError.notFound('Phone number not found');
      return successResponse(res, number, 'Phone number details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      await ensureSchemaAlignment().catch(() => {});

      const {
        phoneNumber,
        friendlyName,
        country = 'US',
        type = 'Local',
        monthlyRate = 15.0,
        forwardingNumber,
        fallbackNumber,
        clientId,
      } = req.body;

      if (!phoneNumber) {
        throw AppError.badRequest('Phone number is required');
      }

      // Check for global existence
      const existing = await PhoneNumber.findOne({ phoneNumber: phoneNumber.trim() });
      if (existing) {
        throw AppError.conflict(`Phone number ${phoneNumber} is already registered in the system.`);
      }

      let clientRef = null;
      let initialStatus = 'AVAILABLE';

      if (clientId && clientId !== 'none') {
        const client = await resolveClient(clientId);
        if (!client) throw AppError.notFound('Assigned client company not found');
        clientRef = client.id || client._id;
        initialStatus = 'ACTIVE';
      }

      const created = await PhoneNumber.create({
        phoneNumber: phoneNumber.trim(),
        friendlyName: friendlyName || 'Carrier Trunk Number',
        country,
        type,
        monthlyRate: Number(monthlyRate) || 15.0,
        forwardingNumber: forwardingNumber || '',
        fallbackNumber: fallbackNumber || '',
        clientId: clientRef,
        status: initialStatus,
      });

      await AuditLogService.record({
        req,
        action: 'CREATE_PHONE_NUMBER',
        resourceType: 'PHONE_NUMBER',
        resourceId: created._id,
        details: { phoneNumber: created.phoneNumber, clientId: clientRef },
      });

      return createdResponse(res, created, 'Phone number added to platform successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { friendlyName, country, type, monthlyRate, forwardingNumber, fallbackNumber } = req.body;
      const updated = await PhoneNumber.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            friendlyName,
            country,
            type,
            monthlyRate: monthlyRate !== undefined ? Number(monthlyRate) : undefined,
            forwardingNumber,
            fallbackNumber,
          },
        },
        { new: true, runValidators: true }
      ).populate('clientId', 'companyName clientCode');

      if (!updated) throw AppError.notFound('Phone number not found');

      await AuditLogService.record({
        req,
        action: 'UPDATE_PHONE_NUMBER',
        resourceType: 'PHONE_NUMBER',
        resourceId: req.params.id,
        details: req.body,
      });

      return successResponse(res, updated, 'Phone number updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async assign(req, res, next) {
    try {
      const { clientId } = req.body;
      const number = await PhoneNumber.findById(req.params.id);
      if (!number) throw AppError.notFound('Phone number not found');

      if (!clientId || clientId === 'none') {
        // Unassigning
        number.clientId = null;
        number.status = 'AVAILABLE';
        number.assignedAgentId = null;
        number.assignedAgentName = 'Unassigned';
        await number.save();

        await AuditLogService.record({
          req,
          action: 'UNASSIGN_PHONE_NUMBER',
          resourceType: 'PHONE_NUMBER',
          resourceId: number._id,
          details: { phoneNumber: number.phoneNumber },
        });

        return successResponse(res, number, 'Phone number unassigned and made available');
      }

      // Assigning to client: Verify single-tenant exclusivity
      const targetClient = await resolveClient(clientId);
      if (!targetClient) throw AppError.notFound('Target client not found');

      number.clientId = targetClient.id || targetClient._id;
      number.status = 'ACTIVE';
      await number.save();

      // Ensure target client has this number in their assigned list
      if (!targetClient.assignedPhoneNumber) {
        targetClient.assignedPhoneNumber = number.phoneNumber;
        await targetClient.save();
      }

      await AuditLogService.record({
        req,
        action: 'ASSIGN_PHONE_NUMBER',
        resourceType: 'PHONE_NUMBER',
        resourceId: number._id,
        details: { phoneNumber: number.phoneNumber, clientId: targetClient._id },
      });

      return successResponse(res, number, `Phone number successfully assigned to ${targetClient.companyName}`);
    } catch (error) {
      next(error);
    }
  }

  static async toggleStatus(req, res, next) {
    try {
      const number = await PhoneNumber.findById(req.params.id);
      if (!number) throw AppError.notFound('Phone number not found');

      number.status = number.status === 'ACTIVE' ? 'AVAILABLE' : 'ACTIVE';
      await number.save();

      await AuditLogService.record({
        req,
        action: 'TOGGLE_PHONE_NUMBER_STATUS',
        resourceType: 'PHONE_NUMBER',
        resourceId: number._id,
        details: { status: number.status },
      });

      return successResponse(res, number, `Phone number status set to ${number.status}`);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const number = await PhoneNumber.findByIdAndDelete(req.params.id);
      if (!number) throw AppError.notFound('Phone number not found');

      await AuditLogService.record({
        req,
        action: 'DELETE_PHONE_NUMBER',
        resourceType: 'PHONE_NUMBER',
        resourceId: req.params.id,
        details: { phoneNumber: number.phoneNumber },
      });

      return successResponse(res, { success: true }, 'Phone number removed from platform');
    } catch (error) {
      next(error);
    }
  }
}

import { PhoneNumberService } from './service.js';

export class PhoneNumberController {
  static async listNumbers(req, res, next) {
    try {
      const numbers = await PhoneNumberService.listNumbers(req.user.clientId, req.query);
      res.status(200).json({
        success: true,
        data: numbers,
      });
    } catch (err) {
      next(err);
    }
  }

  static async allocateNumber(req, res, next) {
    try {
      const number = await PhoneNumberService.allocateNumber(req.user.clientId, req.body);
      res.status(201).json({
        success: true,
        data: number,
      });
    } catch (err) {
      next(err);
    }
  }

  static async assignAgent(req, res, next) {
    try {
      const number = await PhoneNumberService.assignAgent(req.user.clientId, req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: number,
      });
    } catch (err) {
      next(err);
    }
  }

  static async releaseNumber(req, res, next) {
    try {
      const number = await PhoneNumberService.releaseNumber(req.user.clientId, req.params.id);
      res.status(200).json({
        success: true,
        data: number,
      });
    } catch (err) {
      next(err);
    }
  }
}

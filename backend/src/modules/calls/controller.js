import { CallService } from './service.js';

export class CallController {
  static async listCalls(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId || 3;
      const result = await CallService.listCalls(clientId, req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        stats: result.stats,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCall(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId || 3;
      const call = await CallService.getCall(clientId, req.params.id);
      return res.status(200).json({
        success: true,
        data: call,
        ...call, // spreads call properties for direct unwrapping if client expects root fields
      });
    } catch (err) {
      next(err);
    }
  }

  static async getRecording(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId || 3;
      const call = await CallService.getCall(clientId, req.params.id);

      // If call has external accessible recording URL, redirect
      if (call.recordingUrl && call.recordingUrl.startsWith('http') && !call.recordingUrl.includes('assets.autocomm.io')) {
        return res.redirect(call.recordingUrl);
      }

      // Otherwise serve sample audio buffer with proper WAV headers
      const audioBuffer = CallService.getSampleRecordingBuffer();
      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      });
      return res.send(audioBuffer);
    } catch (err) {
      next(err);
    }
  }

  static async createTestCall(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId || 3;
      const call = await CallService.createTestCall(clientId, req.body);
      return res.status(201).json({
        success: true,
        data: call,
      });
    } catch (err) {
      next(err);
    }
  }
}

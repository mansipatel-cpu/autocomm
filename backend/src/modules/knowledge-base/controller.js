import { KnowledgeBaseService } from './service.js';

export class KnowledgeBaseController {
  static async listSources(req, res, next) {
    try {
      const clientId = req.user?.clientId || req.clientId;
      const data = await KnowledgeBaseService.listSources(clientId, req.query.type);
      const sources = (data.sources || []).map(s => ({
        ...s,
        id: s.id || s._id,
        title: s.name || s.title || s.originalName || 'Knowledge Document',
        ragStatus: s.status ? s.status.toLowerCase() : 'ready',
        chunkCount: s.chunkCount || 0,
      }));
      res.status(200).json(sources);
    } catch (err) {
      next(err);
    }
  }

  static async getStorage(req, res, next) {
    try {
      const clientId = req.user?.clientId || req.clientId;
      const data = await KnowledgeBaseService.listSources(clientId);
      res.status(200).json({
        maxStorageBytes: 50 * 1024 * 1024,
        usedStorageBytes: data.stats?.totalStorageUsed || 0,
        usagePercent: data.stats?.storagePercent || 0,
      });
    } catch (err) {
      next(err);
    }
  }

  static async addUrlSource(req, res, next) {
    try {
      const source = await KnowledgeBaseService.addUrlSource(req.user.clientId, req.body);
      res.status(201).json({
        success: true,
        data: source,
      });
    } catch (err) {
      next(err);
    }
  }

  static async addTextSource(req, res, next) {
    try {
      const source = await KnowledgeBaseService.addTextSource(req.user.clientId, req.body);
      res.status(201).json({
        success: true,
        data: source,
      });
    } catch (err) {
      next(err);
    }
  }

  static async addFileSource(req, res, next) {
    try {
      const source = await KnowledgeBaseService.addFileSource(req.user.clientId, req.body);
      res.status(201).json({
        success: true,
        data: source,
      });
    } catch (err) {
      next(err);
    }
  }

  static async syncSource(req, res, next) {
    try {
      const source = await KnowledgeBaseService.syncSource(req.user.clientId, req.params.id);
      res.status(200).json({
        success: true,
        data: source,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteSource(req, res, next) {
    try {
      await KnowledgeBaseService.deleteSource(req.user.clientId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Knowledge source deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

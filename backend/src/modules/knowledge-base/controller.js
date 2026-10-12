import { KnowledgeBaseService } from './service.js';

export class KnowledgeBaseController {
  static async listSources(req, res, next) {
    try {
      const data = await KnowledgeBaseService.listSources(req.user.clientId, req.query.type);
      res.status(200).json({
        success: true,
        data,
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

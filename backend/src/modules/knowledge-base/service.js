import { KnowledgeSource } from './model.js';
import { AppError } from '../../common/errors/app-error.js';

const MAX_STORAGE_BYTES = 50 * 1024 * 1024; // 50MB per tenant
const MAX_TEXT_CHARS = 300000;

export class KnowledgeBaseService {
  /**
   * List all knowledge sources with summary stats
   */
  static async listSources(clientId, typeFilter) {
    const query = { clientId };
    if (typeFilter && typeFilter !== 'all') {
      query.type = typeFilter;
    }

    const sources = await KnowledgeSource.find(query).sort({ createdAt: -1 });

    const allSources = await KnowledgeSource.find({ clientId });
    let totalBytes = 0;
    let totalChars = 0;
    let indexedCount = 0;

    for (const src of allSources) {
      totalBytes += src.fileSize || 0;
      totalChars += src.characterCount || 0;
      if (src.status === 'INDEXED') indexedCount += 1;
    }

    // Rough conversion: each character is ~1 byte in storage
    const totalStorageUsed = totalBytes + totalChars;

    return {
      sources,
      stats: {
        totalSources: allSources.length,
        indexedCount,
        totalStorageUsed,
        storageLimit: MAX_STORAGE_BYTES,
        storagePercent: Math.min(100, Math.round((totalStorageUsed / MAX_STORAGE_BYTES) * 100)),
        totalCharacters: totalChars,
      },
    };
  }

  /**
   * Add a URL source
   */
  static async addUrlSource(clientId, { title, url }) {
    if (!url || !url.startsWith('http')) {
      throw new AppError('Valid HTTP/HTTPS URL is required', 400);
    }
    const sourceTitle = title || new URL(url).hostname;
    // Simulated crawl character count
    const simulatedCharCount = Math.floor(Math.random() * 4000) + 1200;

    return KnowledgeSource.create({
      clientId,
      title: sourceTitle,
      type: 'url',
      url,
      characterCount: simulatedCharCount,
      status: 'INDEXED',
      lastSyncedAt: new Date(),
    });
  }

  /**
   * Add raw text doc (up to 300k chars)
   */
  static async addTextSource(clientId, { title, content }) {
    if (!title || !title.trim()) {
      throw new AppError('Document title is required', 400);
    }
    if (!content || !content.trim()) {
      throw new AppError('Document content is required', 400);
    }
    if (content.length > MAX_TEXT_CHARS) {
      throw new AppError(`Content exceeds maximum limit of ${MAX_TEXT_CHARS} characters`, 400);
    }

    return KnowledgeSource.create({
      clientId,
      title: title.trim(),
      type: 'text',
      content: content.trim(),
      characterCount: content.length,
      fileSize: Buffer.byteLength(content, 'utf8'),
      status: 'INDEXED',
      lastSyncedAt: new Date(),
    });
  }

  /**
   * Add uploaded file (PDF/DOCX/TXT up to 20MB)
   */
  static async addFileSource(clientId, { title, fileName, fileSize, fileType, characterCount = 0 }) {
    if (!fileName) {
      throw new AppError('File name is required', 400);
    }
    if (fileSize > 20 * 1024 * 1024) {
      throw new AppError('File size exceeds 20MB limit', 400);
    }

    return KnowledgeSource.create({
      clientId,
      title: title || fileName,
      type: 'file',
      fileName,
      fileSize: fileSize || 10240,
      fileType: fileType || 'application/pdf',
      characterCount: characterCount || Math.floor((fileSize || 10240) / 4),
      status: 'INDEXED',
      lastSyncedAt: new Date(),
    });
  }

  /**
   * Sync / re-index source
   */
  static async syncSource(clientId, sourceId) {
    const source = await KnowledgeSource.findOne({ _id: sourceId, clientId });
    if (!source) {
      throw new AppError('Knowledge source not found', 404);
    }
    source.status = 'INDEXED';
    source.lastSyncedAt = new Date();
    await source.save();
    return source;
  }

  /**
   * Delete source
   */
  static async deleteSource(clientId, sourceId) {
    const deleted = await KnowledgeSource.findOneAndDelete({ _id: sourceId, clientId });
    if (!deleted) {
      throw new AppError('Knowledge source not found', 404);
    }
    return { success: true };
  }
}

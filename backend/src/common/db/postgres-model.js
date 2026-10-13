import { pool, query } from '../../config/postgres.js';
import { logger } from '../../config/logger.js';

// Table name mappings from Model Name -> PostgreSQL Table Name
const TABLE_MAPPINGS = {
  Client: 'clients',
  User: 'users',
  Channel: 'channels',
  Contact: 'contacts',
  Group: 'groups',
  Template: 'templates',
  Campaign: 'campaigns',
  CampaignRecipient: 'campaign_recipients',
  Conversation: 'conversations',
  Message: 'messages',
  KnowledgeSource: 'knowledge_sources',
  AiSettings: 'ai_settings',
  Agent: 'agents',
  AIAgent: 'agents',
  PhoneNumber: 'phone_numbers',
  CallRecord: 'call_records',
  CrmLead: 'crm_leads',
  ConversationFlow: 'conversation_flows',
  ApiKey: 'api_keys',
  EmailTemplate: 'email_templates',
  AuditLog: 'audit_logs',
  IncomingConnection: 'incoming_connections',
};

// CamelCase to snake_case converter
export const toSnakeCase = (str) => {
  if (str === '_id') return 'id';
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

// snake_case to camelCase converter
export const toCamelCase = (str) => {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
};

// Map row columns from snake_case to camelCase and attach _id = id and .save() method
export const formatRow = (row, model = null) => {
  if (!row || typeof row !== 'object') return row;
  const doc = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = toCamelCase(key);
    doc[camelKey] = value;
    doc[key] = value;
  }
  if (row.id !== undefined) {
    doc._id = row.id;
    doc.id = row.id;
  }

  // Attach Mongoose-compatible .save() method
  Object.defineProperty(doc, 'save', {
    enumerable: false,
    writable: true,
    value: async function () {
      if (model && doc.id) {
        return model.findByIdAndUpdate(doc.id, doc);
      }
      return doc;
    },
  });

  // Attach .toObject() and .toJSON()
  Object.defineProperty(doc, 'toObject', {
    enumerable: false,
    value: function () {
      return { ...doc };
    },
  });
  Object.defineProperty(doc, 'toJSON', {
    enumerable: false,
    value: function () {
      return { ...doc };
    },
  });

  return doc;
};

export class Schema {
  constructor(definition = {}, options = {}) {
    this.definition = definition;
    this.options = options;
  }

  index() {
    return this;
  }
}

Schema.Types = {
  ObjectId: String,
  Mixed: Object,
};

export class QueryChain {
  constructor(model, filter = {}, isSingle = false) {
    this.model = model;
    this.filter = filter;
    this.isSingle = isSingle;
    this._sort = null;
    this._limit = isSingle ? 1 : null;
    this._skip = null;
    this._fields = null;
  }

  sort(sortObj) {
    this._sort = sortObj;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  skip(n) {
    this._skip = n;
    return this;
  }

  select(fields) {
    this._fields = fields;
    return this;
  }

  populate() {
    return this;
  }

  lean() {
    return this;
  }

  async execute() {
    return this.model._runQuery(this);
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }
}

export class PgModel {
  constructor(name, schema) {
    this.name = name;
    this.schema = schema;
    this.tableName = TABLE_MAPPINGS[name] || toSnakeCase(name).toLowerCase() + 's';
  }

  find(filter = {}) {
    return new QueryChain(this, filter, false);
  }

  findOne(filter = {}) {
    return new QueryChain(this, filter, true);
  }

  findById(id) {
    return this.findOne({ id });
  }

  async create(data) {
    try {
      const keys = [];
      const values = [];
      const placeholders = [];
      let idx = 1;

      for (const [key, val] of Object.entries(data)) {
        if (key === '_id') continue;
        const col = toSnakeCase(key);
        keys.push(col);

        // Convert nested objects/arrays to JSON string for Postgres JSONB
        const formattedVal =
          val !== null && typeof val === 'object' && !(val instanceof Date)
            ? JSON.stringify(val)
            : val;

        values.push(formattedVal);
        placeholders.push(`$${idx++}`);
      }

      const sql = `
        INSERT INTO ${this.tableName} (${keys.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *;
      `;

      const result = await query(sql, values);
      return formatRow(result.rows[0], this);
    } catch (err) {
      logger.error(`[PgModel ${this.name} create error]:`, err.message);
      throw err;
    }
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return this.findOneAndUpdate({ id }, updateData, options);
  }

  async findOneAndUpdate(filter, updateData, options = { new: true }) {
    try {
      const data = updateData.$set || updateData;
      const setClauses = [];
      const values = [];
      const seenCols = new Set(['id', 'updated_at']);
      let idx = 1;

      for (const [key, val] of Object.entries(data)) {
        if (key === '_id' || key === 'id' || key === 'save' || key === 'toObject' || key === 'toJSON') continue;
        const col = toSnakeCase(key);
        if (seenCols.has(col)) continue;
        seenCols.add(col);

        const formattedVal =
          val !== null && typeof val === 'object' && !(val instanceof Date)
            ? JSON.stringify(val)
            : val;

        setClauses.push(`${col} = $${idx++}`);
        values.push(formattedVal);
      }

      setClauses.push(`updated_at = NOW()`);

      const whereClauses = [];
      for (const [key, val] of Object.entries(filter)) {
        const col = key === '_id' ? 'id' : toSnakeCase(key);
        whereClauses.push(`${col} = $${idx++}`);
        values.push(val);
      }

      const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      const sql = `
        UPDATE ${this.tableName}
        SET ${setClauses.join(', ')}
        ${whereStr}
        RETURNING *;
      `;

      const result = await query(sql, values);
      return result.rows.length > 0 ? formatRow(result.rows[0], this) : null;
    } catch (err) {
      logger.error(`[PgModel ${this.name} update error]:`, err.message);
      throw err;
    }
  }

  async updateOne(filter, updateData) {
    return this.findOneAndUpdate(filter, updateData);
  }

  async updateMany(filter, updateData) {
    return this.findOneAndUpdate(filter, updateData);
  }

  async deleteOne(filter) {
    try {
      const whereClauses = [];
      const values = [];
      let idx = 1;

      for (const [key, val] of Object.entries(filter)) {
        const col = key === '_id' ? 'id' : toSnakeCase(key);
        whereClauses.push(`${col} = $${idx++}`);
        values.push(val);
      }

      const sql = `
        DELETE FROM ${this.tableName}
        WHERE ${whereClauses.join(' AND ')};
      `;

      const result = await query(sql, values);
      return { deletedCount: result.rowCount };
    } catch (err) {
      logger.error(`[PgModel ${this.name} delete error]:`, err.message);
      throw err;
    }
  }

  async findOneAndDelete(filter) {
    try {
      const doc = await this.findOne(filter);
      if (!doc) return null;
      await this.deleteOne(filter);
      return doc;
    } catch (err) {
      logger.error(`[PgModel ${this.name} findOneAndDelete error]:`, err.message);
      throw err;
    }
  }

  async findByIdAndDelete(id) {
    return this.findOneAndDelete({ id });
  }

  async deleteMany(filter) {
    return this.deleteOne(filter);
  }

  async countDocuments(filter = {}) {
    try {
      const whereClauses = [];
      const values = [];
      let idx = 1;

      for (const [key, val] of Object.entries(filter)) {
        if (key.startsWith('$')) continue;
        const col = key === '_id' ? 'id' : toSnakeCase(key);
        whereClauses.push(`${col} = $${idx++}`);
        values.push(val);
      }

      const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      const sql = `SELECT COUNT(*) AS total FROM ${this.tableName} ${whereStr};`;

      const result = await query(sql, values);
      return parseInt(result.rows[0]?.total || '0', 10);
    } catch (err) {
      return 0;
    }
  }

  async _runQuery(chain) {
    try {
      const whereClauses = [];
      const values = [];
      let idx = 1;

      for (const [key, val] of Object.entries(chain.filter || {})) {
        if (key === '$or' && Array.isArray(val)) {
          const orConditions = [];
          for (const subFilter of val) {
            const subConds = [];
            for (const [sKey, sVal] of Object.entries(subFilter)) {
              const col = sKey === '_id' ? 'id' : toSnakeCase(sKey);
              if (sVal === null) {
                subConds.push(`${col} IS NULL`);
              } else {
                subConds.push(`${col} = $${idx++}`);
                values.push(sVal);
              }
            }
            if (subConds.length > 0) {
              orConditions.push(`(${subConds.join(' AND ')})`);
            }
          }
          if (orConditions.length > 0) {
            whereClauses.push(`(${orConditions.join(' OR ')})`);
          }
        } else if (val && typeof val === 'object' && val.$in) {
          const col = key === '_id' ? 'id' : toSnakeCase(key);
          const inPlaceholders = val.$in.map(() => `$${idx++}`).join(', ');
          values.push(...val.$in);
          whereClauses.push(`${col} IN (${inPlaceholders})`);
        } else if (val && typeof val === 'object' && (val.$gte || val.$lte)) {
          const col = key === '_id' ? 'id' : toSnakeCase(key);
          if (val.$gte) {
            whereClauses.push(`${col} >= $${idx++}`);
            values.push(val.$gte);
          }
          if (val.$lte) {
            whereClauses.push(`${col} <= $${idx++}`);
            values.push(val.$lte);
          }
        } else {
          const col = key === '_id' ? 'id' : toSnakeCase(key);
          if (val === null) {
            whereClauses.push(`${col} IS NULL`);
          } else {
            whereClauses.push(`${col} = $${idx++}`);
            values.push(val);
          }
        }
      }

      const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      let orderStr = '';
      if (chain._sort) {
        const orderParts = [];
        for (const [sKey, sDir] of Object.entries(chain._sort)) {
          const col = sKey === '_id' ? 'id' : toSnakeCase(sKey);
          orderParts.push(`${col} ${sDir === -1 || sDir === 'desc' ? 'DESC' : 'ASC'}`);
        }
        orderStr = `ORDER BY ${orderParts.join(', ')}`;
      }

      const limitStr = chain._limit ? `LIMIT ${chain._limit}` : '';
      const offsetStr = chain._skip ? `OFFSET ${chain._skip}` : '';

      const sql = `
        SELECT * FROM ${this.tableName}
        ${whereStr}
        ${orderStr}
        ${limitStr}
        ${offsetStr};
      `;

      const result = await query(sql, values);
      const rows = result.rows.map((r) => formatRow(r, this));

      if (chain.isSingle) {
        return rows[0] || null;
      }
      return rows;
    } catch (err) {
      logger.error(`[PgModel ${this.name} query error]:`, err.message);
      return chain.isSingle ? null : [];
    }
  }
}

export const Types = {
  ObjectId: function (id) {
    if (this instanceof Types.ObjectId) {
      this.id = id || String(Math.floor(Math.random() * 100000));
      this.toString = () => String(this.id);
      return this;
    }
    return String(id);
  },
};

export const connection = {
  readyState: 1,
  on: () => {},
  once: () => {},
};

export const mongoose = {
  Schema,
  Types,
  connection,
  model(name, schema) {
    return new PgModel(name, schema);
  },
};

export default mongoose;

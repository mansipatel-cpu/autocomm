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
    if (typeof value === 'string' && (camelKey === 'temperature' || camelKey === 'voiceSpeed' || camelKey === 'voiceStability' || camelKey === 'voiceSimilarityBoost')) {
      const num = parseFloat(value);
      doc[camelKey] = isNaN(num) ? value : num;
    } else {
      doc[camelKey] = value;
    }

    // Provide snake_case alias as non-enumerable so it does not duplicate in JSON response
    if (camelKey !== key) {
      Object.defineProperty(doc, key, {
        get() {
          return this[camelKey];
        },
        set(val) {
          this[camelKey] = val;
        },
        enumerable: false,
        configurable: true,
      });
    }
  }

  if (doc.body !== undefined && doc.bodyText === undefined) {
    doc.bodyText = doc.body;
  }
  if (doc.footer !== undefined && doc.footerText === undefined) {
    doc.footerText = doc.footer;
  }
  if (doc.header !== undefined && doc.headerText === undefined) {
    doc.headerText = typeof doc.header === 'object' ? doc.header?.text || '' : doc.header;
  }

  if (row.id !== undefined) {
    doc.id = row.id;

    // Provide _id alias as non-enumerable for Mongoose compatibility without duplicate key in JSON
    Object.defineProperty(doc, '_id', {
      get() {
        return this.id;
      },
      set(val) {
        this.id = val;
      },
      enumerable: false,
      configurable: true,
    });
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

const tableColumnsCache = new Map();

async function getValidColumns(tableName) {
  if (tableColumnsCache.has(tableName)) {
    return tableColumnsCache.get(tableName);
  }
  try {
    const res = await query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [tableName]
    );
    if (res && res.rows && res.rows.length > 0) {
      const colSet = new Set(res.rows.map((r) => r.column_name));
      tableColumnsCache.set(tableName, colSet);
      return colSet;
    }
  } catch (err) {
    // If table inspection fails, allow insert to proceed
  }
  return null;
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

  async insertMany(docs) {
    if (!Array.isArray(docs) || docs.length === 0) {
      return [];
    }
    try {
      const validCols = await getValidColumns(this.tableName);
      const colSet = new Set();
      for (const doc of docs) {
        if (!doc || typeof doc !== 'object') continue;
        for (const [key, val] of Object.entries(doc)) {
          if (key === '_id' || val === undefined) continue;
          const col = toSnakeCase(key);
          if (!validCols || validCols.has(col)) {
            colSet.add(col);
          }
        }
      }
      const cols = Array.from(colSet);
      if (cols.length === 0) {
        return [];
      }

      const values = [];
      const rowPlaceholders = [];
      let idx = 1;

      for (const doc of docs) {
        const itemPlaceholders = [];
        for (const col of cols) {
          const camelKey = toCamelCase(col);
          let val = doc[camelKey] !== undefined ? doc[camelKey] : doc[col];
          if (val === undefined) val = null;

          const formattedVal =
            val !== null && typeof val === 'object' && !(val instanceof Date)
              ? JSON.stringify(val)
              : val;

          values.push(formattedVal);
          itemPlaceholders.push(`$${idx++}`);
        }
        rowPlaceholders.push(`(${itemPlaceholders.join(', ')})`);
      }

      const sql = `
        INSERT INTO ${this.tableName} (${cols.join(', ')})
        VALUES ${rowPlaceholders.join(', ')}
        RETURNING *;
      `;

      const result = await query(sql, values);
      return result.rows.map((r) => formatRow(r, this));
    } catch (err) {
      logger.error(`[PgModel ${this.name} insertMany error, falling back to sequential]:`, err.message);
      const results = [];
      for (const doc of docs) {
        const r = await this.create(doc);
        results.push(r);
      }
      return results;
    }
  }

  async create(data) {
    if (Array.isArray(data)) {
      return this.insertMany(data);
    }
    try {
      const keys = [];
      const values = [];
      const placeholders = [];
      let idx = 1;
      const validCols = await getValidColumns(this.tableName);

      for (const [key, val] of Object.entries(data)) {
        if (key === '_id' || val === undefined) continue;
        const col = toSnakeCase(key);

        // Filter out columns that do not exist in the database table
        if (validCols && !validCols.has(col)) {
          continue;
        }

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
      const validCols = await getValidColumns(this.tableName);

      for (const [key, val] of Object.entries(data)) {
        if (key === '_id' || key === 'id' || key === 'save' || key === 'toObject' || key === 'toJSON' || val === undefined) continue;
        const col = toSnakeCase(key);
        if (seenCols.has(col)) continue;
        if (validCols && !validCols.has(col)) continue;
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
        if (val && typeof val === 'object' && Array.isArray(val.$nin)) {
          if (val.$nin.length > 0) {
            const ninPlaceholders = val.$nin.map(() => `$${idx++}`).join(', ');
            values.push(...val.$nin);
            whereClauses.push(`${col} NOT IN (${ninPlaceholders})`);
          }
        } else if (val && typeof val === 'object' && val.$ne !== undefined) {
          if (val.$ne === null) {
            whereClauses.push(`${col} IS NOT NULL`);
          } else {
            whereClauses.push(`${col} != $${idx++}`);
            values.push(val.$ne);
          }
        } else {
          whereClauses.push(`${col} = $${idx++}`);
          values.push(val);
        }
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
        } else if (val && typeof val === 'object' && Array.isArray(val.$nin)) {
          const col = key === '_id' ? 'id' : toSnakeCase(key);
          if (val.$nin.length > 0) {
            const ninPlaceholders = val.$nin.map(() => `$${idx++}`).join(', ');
            values.push(...val.$nin);
            whereClauses.push(`${col} NOT IN (${ninPlaceholders})`);
          }
        } else if (val && typeof val === 'object' && val.$ne !== undefined) {
          const col = key === '_id' ? 'id' : toSnakeCase(key);
          if (val.$ne === null) {
            whereClauses.push(`${col} IS NOT NULL`);
          } else {
            whereClauses.push(`${col} != $${idx++}`);
            values.push(val.$ne);
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
  on: () => { },
  once: () => { },
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

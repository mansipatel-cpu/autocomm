import { query } from '../../config/database.js';
import { Agent } from '../agents/model.js';
import { AppError } from '../../common/errors/app-error.js';

export class CallService {
  /**
   * Format call record row from Postgres for client frontend
   */
  static formatCall(row) {
    if (!row) return null;

    let parsedTranscripts = [];
    if (row.transcripts) {
      if (Array.isArray(row.transcripts)) {
        parsedTranscripts = row.transcripts;
      } else if (typeof row.transcripts === 'string') {
        try {
          parsedTranscripts = JSON.parse(row.transcripts);
        } catch {
          parsedTranscripts = [];
        }
      }
    }

    const transcriptText = parsedTranscripts.length > 0
      ? parsedTranscripts.map((t) => `${t.speaker === 'agent' ? 'Agent' : 'User'}: ${t.text}`).join('\n')
      : '';

    const dir = String(row.direction || 'outbound').toLowerCase();
    const isIncoming = dir === 'inbound' || dir === 'incoming';
    const rawStatus = String(row.status || 'completed').toLowerCase();
    const normalizedStatus = rawStatus === 'completed' ? 'completed'
      : rawStatus === 'failed' ? 'failed'
      : rawStatus === 'in_progress' || rawStatus === 'in-progress' ? 'in_progress'
      : rawStatus;

    const contactName = row.contact_name || 'Contact';
    const phone = row.contact_phone_number || '';
    const fromNum = isIncoming ? phone : (row.from_number || '+17372508034');
    const toNum = isIncoming ? (row.to_number || '+17372508034') : phone;
    const durationSec = parseInt(row.duration_seconds || '0', 10);
    const sentiment = row.sentiment || 'Positive';
    const classification = sentiment.toLowerCase() === 'positive' ? 'hot'
      : sentiment.toLowerCase() === 'neutral' ? 'warm'
      : 'cold';

    return {
      id: row.id,
      _id: row.id,
      callId: row.call_id || `call_${row.id}`,
      clientId: row.client_id,
      agentId: row.agent_id,
      agentName: row.agent_name || 'Rachel (AgentLab)',
      agent: {
        id: row.agent_id,
        name: row.agent_name || 'Rachel (AgentLab)',
      },
      campaign: {
        id: row.campaign_id || null,
        name: row.summary?.match(/campaign "([^"]+)"/)?.[1] || 'Outbound Calling Campaign',
      },
      contactPhoneNumber: phone,
      contactName,
      contact: {
        firstName: contactName.split(' ')[0] || contactName,
        lastName: contactName.split(' ').slice(1).join(' ') || '',
        phone,
      },
      phoneNumber: phone || toNum || fromNum,
      fromNumber: fromNum,
      toNumber: toNum,
      direction: isIncoming ? 'incoming' : 'outgoing',
      callDirection: isIncoming ? 'incoming' : 'outgoing',
      status: normalizedStatus,
      duration: durationSec,
      durationSeconds: durationSec,
      recordingUrl: row.recording_url || `/api/calls/${row.id}/recording`,
      sentiment,
      classification,
      summary: row.summary || '',
      aiSummary: row.summary || '',
      transcripts: parsedTranscripts,
      transcript: transcriptText,
      creditsUsed: parseFloat(row.credits_used || '1.0'),
      engine: 'twilio-openai',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async listCalls(clientId, queryParams = {}) {
    const page = Math.max(1, parseInt(queryParams.page || '1', 10));
    const pageSize = Math.max(1, parseInt(queryParams.pageSize || queryParams.limit || '10', 10));
    const offset = (page - 1) * pageSize;

    const whereConditions = ['client_id = $1'];
    const values = [clientId];
    let paramIdx = 2;

    // Filter by tab
    if (queryParams.tab === 'transcribed') {
      whereConditions.push(`transcripts IS NOT NULL AND transcripts::text != '[]'`);
    } else if (queryParams.tab === 'recordings') {
      whereConditions.push(`recording_url IS NOT NULL AND recording_url != ''`);
    }

    // Filter by direction
    if (queryParams.direction && queryParams.direction !== 'all') {
      const dir = queryParams.direction.toLowerCase();
      if (dir === 'incoming' || dir === 'inbound') {
        whereConditions.push(`direction IN ('inbound', 'incoming')`);
      } else if (dir === 'outgoing' || dir === 'outbound') {
        whereConditions.push(`direction IN ('outbound', 'outgoing')`);
      }
    }

    // Filter by status (case-insensitive)
    if (queryParams.status && queryParams.status !== 'all') {
      whereConditions.push(`LOWER(status) = $${paramIdx}`);
      values.push(queryParams.status.toLowerCase());
      paramIdx++;
    }

    // Filter by sentiment (case-insensitive)
    if (queryParams.sentiment && queryParams.sentiment !== 'all') {
      whereConditions.push(`LOWER(sentiment) = $${paramIdx}`);
      values.push(queryParams.sentiment.toLowerCase());
      paramIdx++;
    }

    // Filter by search query
    if (queryParams.search && queryParams.search.trim()) {
      const term = `%${queryParams.search.trim()}%`;
      whereConditions.push(
        `(contact_name ILIKE $${paramIdx} OR contact_phone_number ILIKE $${paramIdx} OR call_id ILIKE $${paramIdx} OR summary ILIKE $${paramIdx})`
      );
      values.push(term);
      paramIdx++;
    }

    const whereSql = whereConditions.join(' AND ');

    // 1. Fetch filtered items & total count in parallel with stats
    const [callsResult, countResult, statsResult] = await Promise.all([
      query(
        `SELECT * FROM call_records
         WHERE ${whereSql}
         ORDER BY created_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...values, pageSize, offset]
      ),
      query(
        `SELECT COUNT(*) AS total FROM call_records WHERE ${whereSql}`,
        values
      ),
      query(
        `SELECT
           COUNT(*) AS total_calls,
           COUNT(*) FILTER (WHERE UPPER(status) = 'COMPLETED') AS completed_calls,
           COUNT(*) FILTER (WHERE direction IN ('inbound', 'incoming')) AS incoming_calls,
           COUNT(*) FILTER (WHERE direction IN ('outbound', 'outgoing')) AS outgoing_calls,
           COUNT(*) FILTER (WHERE transcripts IS NOT NULL AND transcripts::text != '[]') AS transcribed_count,
           COUNT(*) FILTER (WHERE recording_url IS NOT NULL AND recording_url != '') AS recordings_count
         FROM call_records
         WHERE client_id = $1`,
        [clientId]
      ),
    ]);

    const totalItems = parseInt(countResult.rows[0]?.total || '0', 10);
    const statsRow = statsResult.rows[0] || {};
    const totalCalls = parseInt(statsRow.total_calls || '0', 10);
    const completedCalls = parseInt(statsRow.completed_calls || '0', 10);
    const incomingCalls = parseInt(statsRow.incoming_calls || '0', 10);
    const outgoingCalls = parseInt(statsRow.outgoing_calls || '0', 10);
    const transcribedCount = parseInt(statsRow.transcribed_count || '0', 10);
    const recordingsCount = parseInt(statsRow.recordings_count || '0', 10);

    const formattedCalls = (callsResult.rows || []).map((row) => CallService.formatCall(row));

    return {
      data: formattedCalls,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
        page,
        pageSize,
      },
      stats: {
        totalCalls,
        completedCalls,
        incomingCalls,
        outgoingCalls,
        allCount: totalCalls,
        transcribedCount,
        recordingsCount,
      },
    };
  }

  static async getCall(clientId, callRecordId) {
    const isNumeric = !isNaN(callRecordId);
    let sql = 'SELECT * FROM call_records WHERE id = $1';
    let params = [parseInt(callRecordId, 10)];

    if (!isNumeric) {
      sql = 'SELECT * FROM call_records WHERE call_id = $1';
      params = [callRecordId];
    }

    if (clientId) {
      sql += ' AND client_id = $2';
      params.push(clientId);
    }

    const res = await query(sql, params);
    if (!res.rows || res.rows.length === 0) {
      throw new AppError('Call record not found', 404);
    }

    return CallService.formatCall(res.rows[0]);
  }

  /**
   * Return a playable audio buffer (16-bit PCM WAV)
   */
  static getSampleRecordingBuffer() {
    const sampleRate = 8000;
    const durationSeconds = 3;
    const numSamples = sampleRate * durationSeconds;
    const buffer = Buffer.alloc(44 + numSamples * 2);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write('WAVE', 8);
    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM format
    buffer.writeUInt16LE(1, 22); // Mono
    buffer.writeUInt32LE(sampleRate, 24); // 8000 Hz
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34); // 16-bit
    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    // Soft chime sequence (440Hz -> 554Hz -> 659Hz)
    const freqs = [440, 554, 659];
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const f = freqs[Math.min(Math.floor(t), freqs.length - 1)];
      const envelope = Math.max(0, 1 - (t % 1) * 0.9);
      const sample = Math.sin(2 * Math.PI * f * t) * envelope * 0.25 * 32767;
      buffer.writeInt16LE(Math.floor(sample), 44 + i * 2);
    }

    return buffer;
  }

  /**
   * Initiate a simulated test call for voice agent testing
   */
  static async createTestCall(clientId, { agentId, contactPhoneNumber, contactName }) {
    let agentName = 'Rachel (AgentLab)';
    if (agentId) {
      const agent = await Agent.findOne({ _id: agentId, clientId });
      if (agent) {
        agentName = agent.name;
      }
    }

    const testCallId = `call_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const duration = Math.floor(Math.random() * 90) + 45; // 45s - 135s

    const transcript = [
      {
        speaker: 'agent',
        text: 'Hello! Thank you for speaking with AutoComm support. How may I assist you today?',
        timestampSeconds: 2,
      },
      {
        speaker: 'user',
        text: 'Hi, I received an inquiry notification and wanted to confirm my appointment for tomorrow at 3 PM.',
        timestampSeconds: 8,
      },
      {
        speaker: 'agent',
        text: 'I see your appointment on file for tomorrow at 3:00 PM. Everything is confirmed and your calendar invite has been sent!',
        timestampSeconds: 16,
      },
      {
        speaker: 'user',
        text: 'Great, thank you so much for the quick confirmation!',
        timestampSeconds: 22,
      },
      {
        speaker: 'agent',
        text: 'You are very welcome! Have a wonderful rest of your day. Goodbye!',
        timestampSeconds: 26,
      },
    ];

    const res = await query(
      `INSERT INTO call_records
       (client_id, call_id, agent_id, agent_name, contact_phone_number, contact_name, direction, status, duration_seconds, recording_url, transcripts, summary, sentiment, credits_used, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
       RETURNING *`,
      [
        clientId,
        testCallId,
        agentId || null,
        agentName,
        contactPhoneNumber || '+1 (555) 392-8172',
        contactName || 'Alex Mercer',
        'outbound',
        'COMPLETED',
        duration,
        'https://assets.autocomm.io/recordings/sample_call.mp3',
        JSON.stringify(transcript),
        'Customer verified appointment confirmation for tomorrow at 3 PM. Agent validated records and confirmed status immediately.',
        'Positive',
        1.0,
      ]
    );

    return CallService.formatCall(res.rows[0]);
  }
}

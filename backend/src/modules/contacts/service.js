import { Contact } from './model.js';
import { Group, GroupMember } from '../groups/model.js';
import { AppError } from '../../common/errors/app-error.js';

export class ContactService {
  static async listContacts({ clientId, search, status, channel, groupId, page = 1, limit = 10 }) {
    const filter = { clientId };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (channel && channel !== 'all') {
      filter.channels = channel;
    }

    if (groupId && groupId !== 'all') {
      filter.groups = groupId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .populate('groups', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contact.countDocuments(filter),
    ]);

    return {
      contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async getSummaryStats(clientId) {
    const [total, active, whatsappEnabled, voiceEnabled] = await Promise.all([
      Contact.countDocuments({ clientId }),
      Contact.countDocuments({ clientId, status: 'Active' }),
      Contact.countDocuments({ clientId, channels: 'whatsapp' }),
      Contact.countDocuments({ clientId, channels: 'voice' }),
    ]);

    return {
      total,
      active,
      whatsappEnabled,
      voiceEnabled,
    };
  }

  static async createContact({
    clientId,
    name,
    email,
    phoneNumber,
    whatsappNumber,
    sameAsPrimary = true,
    channels = ['whatsapp', 'voice'],
    groupIds = [],
    customVariables = {},
  }) {
    // Standardize phone numbers
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    const cleanWA = sameAsPrimary ? cleanPhone : (whatsappNumber || cleanPhone).replace(/\s+/g, '');

    const existing = await Contact.findOne({ clientId, phoneNumber: cleanPhone });
    if (existing) {
      throw AppError.conflict(`Contact with phone number '${cleanPhone}' already exists.`);
    }

    const contact = await Contact.create({
      clientId,
      name,
      email: email || '',
      phoneNumber: cleanPhone,
      whatsappNumber: cleanWA,
      channels,
      groups: groupIds,
      customVariables,
      status: 'Active',
    });

    // Update group counts & group members if groups selected
    if (groupIds.length > 0) {
      for (const gid of groupIds) {
        await GroupMember.create({ clientId, groupId: gid, contactId: contact._id });
        await Group.findByIdAndUpdate(gid, { $inc: { contactCount: 1 } });
      }
    }

    return contact;
  }

  static async updateContact(clientId, contactId, data) {
    const contact = await Contact.findOneAndUpdate(
      { _id: contactId, clientId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!contact) throw AppError.notFound('Contact not found');
    return contact;
  }

  static async deleteContact(clientId, contactId) {
    const contact = await Contact.findOneAndDelete({ _id: contactId, clientId });
    if (!contact) throw AppError.notFound('Contact not found');

    // Clean up group memberships
    const members = await GroupMember.find({ contactId, clientId });
    for (const m of members) {
      await Group.findByIdAndUpdate(m.groupId, { $inc: { contactCount: -1 } });
    }
    await GroupMember.deleteMany({ contactId, clientId });

    return { success: true, message: 'Contact deleted' };
  }

  static async bulkAction(clientId, { action, contactIds, targetGroupId }) {
    if (!contactIds || !contactIds.length) {
      throw AppError.badRequest('No contacts selected for bulk action');
    }

    if (action === 'delete') {
      await Contact.deleteMany({ _id: { $in: contactIds }, clientId });
      await GroupMember.deleteMany({ contactId: { $in: contactIds }, clientId });
      return { success: true, message: `${contactIds.length} contacts deleted` };
    }

    if (action === 'add_to_group') {
      if (!targetGroupId) throw AppError.badRequest('Target group ID required');
      const group = await Group.findOne({ _id: targetGroupId, clientId });
      if (!group) throw AppError.notFound('Target group not found');

      let addedCount = 0;
      for (const cid of contactIds) {
        const exists = await GroupMember.findOne({ groupId: targetGroupId, contactId: cid });
        if (!exists) {
          await GroupMember.create({ clientId, groupId: targetGroupId, contactId: cid });
          await Contact.findByIdAndUpdate(cid, { $addToSet: { groups: targetGroupId } });
          addedCount++;
        }
      }
      await Group.findByIdAndUpdate(targetGroupId, { $inc: { contactCount: addedCount } });

      return { success: true, message: `${addedCount} contacts added to ${group.name}` };
    }

    throw AppError.badRequest(`Unsupported bulk action: ${action}`);
  }

  static async importCsv(clientId, contactsList) {
    let imported = 0;
    let skipped = 0;

    for (const row of contactsList) {
      const phone = (row.phone_number || row.phone || '').toString().trim();
      if (!phone) {
        skipped++;
        continue;
      }

      const existing = await Contact.findOne({ clientId, phoneNumber: phone });
      if (existing) {
        skipped++;
        continue;
      }

      const customVariables = {};
      Object.keys(row).forEach((k) => {
        if (!['phone_number', 'phone', 'name', 'email'].includes(k)) {
          customVariables[k] = row[k];
        }
      });

      await Contact.create({
        clientId,
        name: row.name || 'Unknown Contact',
        email: row.email || '',
        phoneNumber: phone,
        whatsappNumber: phone,
        channels: ['whatsapp', 'voice'],
        customVariables,
        status: 'Active',
      });
      imported++;
    }

    return { imported, skipped, total: contactsList.length };
  }
}

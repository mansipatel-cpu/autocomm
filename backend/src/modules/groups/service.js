import { Group, GroupMember } from './model.js';
import { Contact } from '../contacts/model.js';
import { AppError } from '../../common/errors/app-error.js';

export class GroupService {
  static async listGroups({ clientId, search, page = 1, limit = 10 }) {
    const filter = { clientId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [groups, total] = await Promise.all([
      Group.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Group.countDocuments(filter),
    ]);

    return {
      groups,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async createGroup({ clientId, name, category = 'Customer Segments', description = '', contactIds = [] }) {
    const existing = await Group.findOne({ clientId, name });
    if (existing) {
      throw AppError.conflict(`Group '${name}' already exists.`);
    }

    const code = `grp_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    const group = await Group.create({
      clientId,
      name,
      code,
      category,
      description,
      contactCount: contactIds.length,
      status: 'Active',
    });

    if (contactIds.length > 0) {
      for (const cid of contactIds) {
        await GroupMember.create({ clientId, groupId: group._id, contactId: cid });
        await Contact.findOneAndUpdate({ _id: cid, clientId }, { $addToSet: { groups: group._id } });
      }
    }

    return group;
  }

  static async getMembers(clientId, groupId, { search, page = 1, limit = 10 }) {
    const group = await Group.findOne({ _id: groupId, clientId });
    if (!group) throw AppError.notFound('Group not found');

    const skip = (page - 1) * limit;
    const [memberships, total] = await Promise.all([
      GroupMember.find({ groupId, clientId })
        .populate('contactId')
        .skip(skip)
        .limit(limit)
        .lean(),
      GroupMember.countDocuments({ groupId, clientId }),
    ]);

    const members = memberships.map((m) => m.contactId).filter(Boolean);

    return {
      group,
      members,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async deleteGroup(clientId, groupId) {
    const group = await Group.findOneAndDelete({ _id: groupId, clientId });
    if (!group) throw AppError.notFound('Group not found');

    await GroupMember.deleteMany({ groupId, clientId });
    await Contact.updateMany({ clientId }, { $pull: { groups: groupId } });

    return { success: true, message: 'Group deleted successfully' };
  }
}

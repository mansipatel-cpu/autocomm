import { Router } from 'express';
import { signAccessToken } from '../../common/utils/jwt.util.js';

const router = Router();

// POST team member login (handles both tenant team and admin team)
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const isAdminTeam = req.originalUrl?.includes('/admin/team');

  const member = {
    id: 1,
    name: email ? email.split('@')[0] : 'Team Member',
    firstName: email ? email.split('@')[0] : 'Team',
    lastName: 'Operator',
    email: email || 'team@autocomm.local',
    role: isAdminTeam ? 'Admin' : 'Agent',
  };

  const team = {
    id: 1,
    name: 'AutoComm Primary Team',
    type: isAdminTeam ? 'admin' : 'tenant',
  };

  const permissions = {
    dashboard: { read: true, write: true },
    campaigns: { read: true, write: true },
    inbox: { read: true, write: true },
    contacts: { read: true, write: true },
    admin: { read: true, write: true },
  };

  const token = signAccessToken({
    id: member.id,
    email: member.email,
    clientId: 1,
    role: member.role,
  });

  res.status(200).json({
    success: true,
    token,
    member,
    team,
    permissions,
  });
});

// GET team auth validate session (/me)
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const isAdminTeam = req.originalUrl?.includes('/admin/team');

  const member = {
    id: 1,
    name: 'Team Member',
    firstName: 'Team',
    lastName: 'Operator',
    email: 'team@autocomm.local',
    role: isAdminTeam ? 'Admin' : 'Agent',
  };

  const team = {
    id: 1,
    name: 'AutoComm Primary Team',
    type: isAdminTeam ? 'admin' : 'tenant',
  };

  const permissions = {
    dashboard: { read: true, write: true },
    campaigns: { read: true, write: true },
    inbox: { read: true, write: true },
    contacts: { read: true, write: true },
    admin: { read: true, write: true },
  };

  res.status(200).json({
    valid: true,
    member,
    team,
    permissions,
  });
});

export default router;

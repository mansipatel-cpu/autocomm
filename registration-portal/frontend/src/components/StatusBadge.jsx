import { CheckCircle2, Clock, AlertCircle, PhoneCall, MessageSquare, UserCheck } from 'lucide-react';

export function StatusBadge({ status, type }) {
  const norm = (status || 'pending').toLowerCase();

  let badgeClass = 'badge-neutral';
  let Icon = Clock;
  let label = status || 'Pending';

  switch (norm) {
    case 'completed':
    case 'contact_created':
    case 'delivered':
    case 'read':
      badgeClass = 'badge-success';
      Icon = CheckCircle2;
      break;

    case 'sent':
    case 'message_queued':
      badgeClass = 'badge-warning';
      Icon = MessageSquare;
      label = norm === 'message_queued' ? 'Message Queued' : 'Sent';
      break;

    case 'campaign_managed':
      badgeClass = 'badge-neutral';
      Icon = Clock;
      label = 'AutoComm Campaign';
      break;

    case 'initiated':
    case 'call_queued':
      badgeClass = 'badge-warning';
      Icon = PhoneCall;
      label = norm === 'call_queued' ? 'Call Queued' : 'Initiated';
      break;

    case 'registered':
    case 'in_progress':
      badgeClass = 'badge-warning';
      Icon = Clock;
      label = norm === 'in_progress' ? 'In Progress' : 'Registered';
      break;

    case 'failed':
      badgeClass = 'badge-danger';
      Icon = AlertCircle;
      label = 'Failed';
      break;

    default:
      badgeClass = 'badge-neutral';
      Icon = Clock;
      label = status || 'Pending';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" />
      <Icon size={12} style={{ marginRight: '2px' }} />
      <span>{label}</span>
    </span>
  );
}

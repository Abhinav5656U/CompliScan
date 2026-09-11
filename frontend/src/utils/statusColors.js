export const STATUS_COLORS = {
  pass: {
    label: 'Pass',
    bg: 'bg-green-50',
    text: 'text-green-800',
    textStrong: 'text-green-900',
    icon: 'text-green-600',
    accent: 'bg-green-600',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-500',
    softBg: 'bg-green-500/20',
    softText: 'text-green-300',
  },
  fail: {
    label: 'Fail',
    bg: 'bg-red-50',
    text: 'text-red-800',
    textStrong: 'text-red-900',
    icon: 'text-red-600',
    accent: 'bg-red-600',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    dot: 'bg-red-500',
    softBg: 'bg-red-500/20',
    softText: 'text-red-300',
  },
  review: {
    label: 'Review',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    textStrong: 'text-amber-900',
    icon: 'text-amber-600',
    accent: 'bg-amber-600',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
    softBg: 'bg-amber-500/20',
    softText: 'text-amber-300',
  },
  default: {
    label: 'Unknown',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    textStrong: 'text-gray-900',
    icon: 'text-gray-600',
    accent: 'bg-gray-600',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-800',
    dot: 'bg-gray-400',
    softBg: 'bg-gray-500/20',
    softText: 'text-gray-300',
  },
};

export const getStatusTone = (status) => {
  const s = (status || '').toLowerCase().replace(/[\s_-]+/g, '');
  if (['compliant', 'pass', 'passed', 'ok', 'good'].includes(s)) return 'pass';
  if (['noncompliant', 'noncompliance', 'fail', 'failed', 'violation', 'notcompliant'].includes(s)) return 'fail';
  if (['review', 'reviewrequired', 'partial', 'partiallycompliant', 'humanreviewrequired', 'warning'].includes(s)) return 'review';
  return 'default';
};

export default STATUS_COLORS;
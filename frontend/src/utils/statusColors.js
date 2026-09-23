export const STATUS_COLORS = {
  pass: {
    label: 'Compliant',
    bg: 'bg-[#EDF5F1]',
    text: 'text-[#2E6B4F]',
    textStrong: 'text-[#1B4332]',
    icon: 'text-[#2E6B4F]',
    accent: 'bg-[#2E6B4F]',
    border: 'border-[#B3D6C5]',
    badge: 'bg-[#EDF5F1] text-[#2E6B4F] border border-[#B3D6C5]',
    dot: 'bg-[#2E6B4F]',
    softBg: 'bg-[#2E6B4F]/15',
    softText: 'text-[#2E6B4F]',
  },
  fail: {
    label: 'Non-Compliant',
    bg: 'bg-[#FCEDE8]',
    text: 'text-[#B3261E]',
    textStrong: 'text-[#7A1813]',
    icon: 'text-[#B3261E]',
    accent: 'bg-[#B3261E]',
    border: 'border-[#F1B2A5]',
    badge: 'bg-[#FCEDE8] text-[#B3261E] border border-[#F1B2A5]',
    dot: 'bg-[#B3261E]',
    softBg: 'bg-[#B3261E]/15',
    softText: 'text-[#B3261E]',
  },
  review: {
    label: 'Review Required',
    bg: 'bg-[#FDF9F0]',
    text: 'text-[#8C6608]',
    textStrong: 'text-[#614502]',
    icon: 'text-[#A6790A]',
    accent: 'bg-[#A6790A]',
    border: 'border-[#ECCC87]',
    badge: 'bg-[#FDF9F0] text-[#8C6608] border border-[#ECCC87]',
    dot: 'bg-[#A6790A]',
    softBg: 'bg-[#A6790A]/15',
    softText: 'text-[#8C6608]',
  },
  default: {
    label: 'Unverified',
    bg: 'bg-[#F7F5F0]',
    text: 'text-[#4A4A4A]',
    textStrong: 'text-[#1C1C1C]',
    icon: 'text-[#666666]',
    accent: 'bg-[#666666]',
    border: 'border-[#D8D3C7]',
    badge: 'bg-[#F7F5F0] text-[#4A4A4A] border border-[#D8D3C7]',
    dot: 'bg-[#888888]',
    softBg: 'bg-[#888888]/15',
    softText: 'text-[#4A4A4A]',
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
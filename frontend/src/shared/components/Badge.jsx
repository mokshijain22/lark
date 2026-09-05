const statusColors = {
  Pending: { bg: '#FEF0C7', text: '#B54708' },
  Approved: { bg: '#D1FADF', text: '#05603A' },
  Rejected: { bg: '#FEE4E2', text: '#B42318' },
  'To-do': { bg: '#E4E7EC', text: '#344054' },
  'In Progress': { bg: '#D1E9FF', text: '#175CD3' },
  Done: { bg: '#D1FADF', text: '#05603A' },
  Low: { bg: '#E4E7EC', text: '#344054' },
  Medium: { bg: '#FEF0C7', text: '#B54708' },
  High: { bg: '#FEE4E2', text: '#B42318' },
};

export default function Badge({ children }) {
  const colors = statusColors[children] || { bg: '#E4E7EC', text: '#344054' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 100,
        fontSize: 12,
        fontWeight: 600,
        background: colors.bg,
        color: colors.text,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

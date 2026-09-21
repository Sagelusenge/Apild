export default function StatCard({ label, value, hint, icon: Icon, tone = 'green' }) {
  return <article className={`metric-card metric-card--${tone} card`}><div><small>{label}</small><strong>{value}</strong></div><span><Icon /></span><footer>{hint}</footer></article>;
}

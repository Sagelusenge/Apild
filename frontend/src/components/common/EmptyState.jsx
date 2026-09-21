import { Inbox } from 'lucide-react';
import { useUi } from '../../context/UiContext';

export default function EmptyState({ title, text: description }) {
  const { text } = useUi();
  return <div className="empty-state"><Inbox size={30} /><strong>{title || text.common.emptyTitle}</strong><span>{description || text.common.emptyText}</span></div>;
}

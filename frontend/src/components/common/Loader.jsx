import { useUi } from '../../context/UiContext';

export default function Loader({ fullPage = false, label }) {
  const { text } = useUi();
  const displayLabel = label || text.common.loading;
  return <div className={fullPage ? 'loader loader--page' : 'loader'}><span className="spinner" />{displayLabel}</div>;
}

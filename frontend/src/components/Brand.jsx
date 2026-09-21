import { useUi } from '../context/UiContext';

export default function Brand({ inverse = false, compact = false }) {
  const { text } = useUi();
  return <div className={`brand ${inverse ? 'brand--inverse' : ''}`}>
    <img className={compact ? 'brand-logo brand-logo--compact' : 'brand-logo'} src="/images/logo-apild.png" alt={text.brand.alt} />
    <span><strong>APILD</strong>{!compact && <small>{text.brand.subtitle}</small>}</span>
  </div>;
}

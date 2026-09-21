export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return <button className={`button button--${variant} ${className}`} {...props}>{children}</button>;
}

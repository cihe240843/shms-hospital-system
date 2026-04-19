// Shared UI components
export function Badge({ type = 'green', children }) {
  return <span className={`badge badge-${type}`}>{children}</span>
}

export function Spinner() {
  return <div className="spinner" />
}

export function PageHeader({ title, desc, action }) {
  return (
    <div className="page-header">
      <div>
        <h2 className="page-title">{title}</h2>
        {desc && <p className="page-desc">{desc}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export function FormGroup({ label, children }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
    </div>
  )
}

export function Input({ ...props }) {
  return <input className="form-control" {...props} />
}

export function Select({ children, ...props }) {
  return <select className="form-control" {...props}>{children}</select>
}

export function Textarea({ ...props }) {
  return <textarea className="form-control" {...props} />
}

export function BtnPrimary({ children, className = '', ...props }) {
  return <button className={`btn-primary ${className}`.trim()} {...props}>{children}</button>
}

export function BtnSecondary({ children, className = '', ...props }) {
  return <button className={`btn-secondary ${className}`.trim()} {...props}>{children}</button>
}

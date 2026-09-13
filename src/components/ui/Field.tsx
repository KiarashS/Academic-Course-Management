import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useId } from 'react'

interface BaseProps {
  label: string
  hint?: string
  error?: string
  className?: string
}

export function TextField({
  label,
  hint,
  error,
  className,
  ...rest
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div className={`field${className ? ` ${className}` : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="input" aria-invalid={error ? true : undefined} {...rest} />
      {error ? <span className="field__error">{error}</span> : hint && <span className="field__hint">{hint}</span>}
    </div>
  )
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  ...rest
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <div className={`field${className ? ` ${className}` : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <textarea id={id} className="textarea" aria-invalid={error ? true : undefined} {...rest} />
      {error ? <span className="field__error">{error}</span> : hint && <span className="field__hint">{hint}</span>}
    </div>
  )
}

export function SelectField({
  label,
  hint,
  error,
  className,
  children,
  ...rest
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const id = useId()
  return (
    <div className={`field${className ? ` ${className}` : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="select" {...rest}>
        {children}
      </select>
      {error ? <span className="field__error">{error}</span> : hint && <span className="field__hint">{hint}</span>}
    </div>
  )
}

export function CheckboxField({
  label,
  hint,
  ...rest
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="checkbox">
      <input type="checkbox" {...rest} />
      <span className="checkbox__text">
        <strong>{label}</strong>
        {hint && <span>{hint}</span>}
      </span>
    </label>
  )
}

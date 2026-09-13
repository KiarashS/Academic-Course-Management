import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'flat'
  small?: boolean
  icon?: IconName
  iconOnly?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'default',
  small = false,
  icon,
  iconOnly = false,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'btn',
    variant !== 'default' && `btn--${variant}`,
    small && 'btn--small',
    iconOnly && 'btn--icon',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={classes} {...rest}>
      {icon && <Icon name={icon} size={small ? 14 : 16} />}
      {!iconOnly && children}
    </button>
  )
}

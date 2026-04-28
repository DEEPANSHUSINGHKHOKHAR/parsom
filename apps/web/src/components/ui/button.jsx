import { createElement } from 'react';
import clsx from 'clsx';

const variants = {
  primary: 'bg-accent-primary text-background-base hover:bg-white',
  secondary:
    'border border-border-strong bg-transparent text-foreground-primary hover:bg-glass-soft hover:text-foreground-primary',
  ghost: 'text-foreground-secondary hover:bg-glass-soft hover:text-foreground-primary',
};

export default function Button({
  children,
  className,
  variant = 'primary',
  as: Component = 'button',
  ...props
}) {
  return createElement(
    Component,
    {
      className: clsx(
        'inline-flex items-center justify-center px-8 py-4 text-label transition-all duration-300',
        variants[variant],
        className
      ),
      ...props,
    },
    children
  );
}

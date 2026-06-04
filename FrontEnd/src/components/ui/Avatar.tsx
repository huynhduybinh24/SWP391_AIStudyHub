import { cn } from '@/lib/utils'

export interface AvatarProps {
  src?: string
  name: string
  className?: string
}

export function Avatar({ src, name, className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        className={cn('size-10 rounded-full border-2 border-white object-cover', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex size-10 items-center justify-center rounded-full border-2 border-white bg-primary text-sm font-medium text-white',
        className,
      )}
    >
      {initials}
    </div>
  )
}

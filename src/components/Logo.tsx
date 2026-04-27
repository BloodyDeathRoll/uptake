import Image from 'next/image'

interface LogoProps {
  size?: number
  className?: string
}

export default function Logo({ size = 24, className = '' }: LogoProps) {
  return (
    <Image
      src="/uptake-icon.svg"
      alt="Uptake logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  )
}

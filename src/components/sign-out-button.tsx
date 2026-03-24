'use client'

import { signOut } from 'next-auth/react'

type SignOutButtonProps = {
  className: string
  children: string
}

export function SignOutButton({ className, children }: SignOutButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void signOut({ callbackUrl: '/' })
      }}
    >
      {children}
    </button>
  )
}

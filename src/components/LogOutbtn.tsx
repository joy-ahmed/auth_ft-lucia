'use client'

import { signOut } from "@/app/authenticate/auth.action"
import { Button } from "@/components/ui/button"

export const LogOutbtn = ({children}: {children: React.ReactNode}) => {
  return (
    <Button variant="link" onClick={() => signOut()}>{children}</Button>
  )
}
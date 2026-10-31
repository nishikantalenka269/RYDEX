'use client'
import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
function Provider({children}:{children:ReactNode}) {
  return (
    <div>
        <SessionProvider>{children}</SessionProvider>
    </div>
  )
}

export default Provider
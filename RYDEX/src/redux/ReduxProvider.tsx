'use client'
import React, { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { store } from './store'

function ReduxProvider({children}:{children:ReactNode}) {
  return (
    <Provider store={store}> 
    {/* abb hun store ko are component ke andar access kar shakte hain */}
        {children}
    </Provider>
  )
}

export default ReduxProvider

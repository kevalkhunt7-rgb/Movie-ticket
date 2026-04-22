import React, { useEffect } from 'react'
import { useClerk } from '@clerk/react'
import { useNavigate } from 'react-router-dom'
import BlurCircle from '../Component/BlurCircle'

const ForgotPassword = () => {
  const { openSignIn } = useClerk()
  const navigate = useNavigate()

  useEffect(() => {
    // Open Clerk's sign-in modal with forgot password screen
    openSignIn({
      initialPath: '/forgot-password'
    })
    
    // Redirect to home after modal opens
    const timer = setTimeout(() => {
      navigate('/')
    }, 500)

    return () => clearTimeout(timer)
  }, [openSignIn, navigate])

  return (
    <div className='min-h-screen bg-gray-900 flex items-center justify-center relative overflow-hidden'>
      <BlurCircle />
      <div className='text-center relative z-10'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
        <p className='text-white text-lg'>Opening password reset...</p>
      </div>
    </div>
  )
}

export default ForgotPassword

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { MenuIcon, SearchIcon, TicketCheck, TicketPlus, XIcon } from 'lucide-react'
import { useClerk, UserButton, useUser } from '@clerk/react'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const {user} = useUser()
  const { openSignIn } = useClerk()
  const navigate = useNavigate()

  // Open Clerk sign-in with forgot password mode
  const handleForgotPassword = () => {
    openSignIn({
      initialPath: '/forgot-password'
    })
  }
  return (
    <div className='fixed top-0 left-0 z-50 w-full h-20 flex items-center justify-between px-6 md:px-16 lg:px-20'>

      {/* Logo */}
      <Link to='/' className='flex items-center'>
        <img src={assets.logo} alt="" className='h-[150px] md:h-[160px] lg:h-[160px] w-auto object-contain' />
      </Link>

      {/* Center Navbar (Desktop) */}
      <div className='
        hidden lg:flex
        absolute left-1/2 -translate-x-1/2
        items-center justify-center
        gap-8 px-8
        h-12 rounded-full
        backdrop-blur bg-white/10
        border border-gray-300/20
      '>
        <Link to='/'>Home</Link>
        <Link to='/movies'>Movies</Link>
        <Link to='/'>Theaters</Link>
        <Link to='/'>Releases</Link>
        <Link to='/favorite'>Favorites</Link>
      </div>

      {/* Right Section */}
      <div className='flex items-center gap-6'>
        <SearchIcon className='hidden md:block w-6 h-6 cursor-pointer' />
        {
          !user ? ( <button onClick={openSignIn} className='h-10 px-6 bg-primary hover:bg-primary-dull transition rounded-full font-medium'>
          Login
        </button>) :( <UserButton>
          <UserButton.MenuItems >
          <UserButton.Action label='My Bookings' labelIcon={<TicketPlus  width={15}/>} onClick={() => navigate('/my-bookings') } />
        </UserButton.MenuItems>
        </UserButton>)
        }
       
      </div>

      {/* Hamburger */}
      <MenuIcon
        className='ml-4 lg:hidden w-8 h-8 cursor-pointer'
        onClick={() => setIsOpen(true)}
      />

      {/* Mobile Menu */}
      <div className={`
        fixed top-0 left-0 w-full h-screen bg-black/90
        flex flex-col items-center justify-center gap-8 text-lg
        transition-all duration-300
        ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
      `}>

        <XIcon
          className='absolute top-6 right-6 w-6 h-6 cursor-pointer'
          onClick={() => setIsOpen(false)}
        />

        <Link onClick={() => { scrollTo(0,0); setIsOpen(false)}} to='/'>Home</Link>
        <Link onClick={() => { scrollTo(0,0); setIsOpen(false)}} to='/movies'>Movies</Link>
        <Link onClick={() => { scrollTo(0,0); setIsOpen(false)}} to='/'>Theaters</Link>
        <Link onClick={() => { scrollTo(0,0); setIsOpen(false)}} to='/'>Releases</Link>
        <Link onClick={() => { scrollTo(0,0); setIsOpen(false)}} to='/favorite'>Favorites</Link>
      </div>

    </div>
  )
}

export default Navbar
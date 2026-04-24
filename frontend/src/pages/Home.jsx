import React from 'react'
import HeroSection from '../Component/HeroSection'
import FeturedSection from '../Component/FeturedSection'
import TrailerSection from '../Component/TrailerSection'

const Home = () => {
  return (
    <main className="w-full overflow-x-hidden">
      <HeroSection />
      <FeturedSection />
      <TrailerSection />
    </main>
  )
}

export default Home
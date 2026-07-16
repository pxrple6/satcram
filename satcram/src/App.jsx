import './index.css'
import React, { createContext, useContext } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/react'

import AppLayout from './components/Layout/AppLayout.jsx'
import Dashboard from './components/Dashboard/Dashboard.jsx'
import MistakeUpload from './components/Upload/MistakeUpload.jsx'
import MistakeDNA from './components/DNA/MistakeDNA.jsx'
import StudyPlan from './components/Plan/StudyPlan.jsx'
import SocraticTutor from './components/Tutor/SocraticTutor.jsx'
import MistakeJournal from './components/Journal/MistakeJournal.jsx'
import PracticeDeck from './components/Practice/PracticeDeck.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import SignUp from './pages/SignUp.jsx'
import { useMistakeStore } from './hooks/useMistakeStore.js'
import { useUserProfile } from './hooks/useUserProfile.js'
import { useUsageLimit } from './hooks/useUsageLimit.js'

const StoreContext = createContext(null)
const ProfileContext = createContext(null)
const UsageContext = createContext(null)

export const useStore = () => useContext(StoreContext)
export const useProfile = () => useContext(ProfileContext)
export const useUsage = () => useContext(UsageContext)

function AppProviders({ children }) {
  const { userId, isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const effectiveUserId = isSignedIn && userId ? userId : 'guest'

  const store = useMistakeStore(effectiveUserId)
  const profile = useUserProfile(effectiveUserId)
  const usage = useUsageLimit(effectiveUserId, isSignedIn)

  if (!isLoaded) {
    return (
      <div className="app-loading">
        <span className="btn-spinner" aria-hidden="true" />
        Loading…
      </div>
    )
  }

  return (
    <StoreContext.Provider value={store}>
      <ProfileContext.Provider value={{ ...profile, user, isSignedIn }}>
        <UsageContext.Provider value={usage}>{children}</UsageContext.Provider>
      </ProfileContext.Provider>
    </StoreContext.Provider>
  )
}

export default function App() {
  return (
    <AppProviders>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login/*" element={<Login />} />
        <Route path="/signup/*" element={<SignUp />} />

        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<MistakeUpload />} />
          <Route path="dna" element={<MistakeDNA />} />
          <Route path="plan" element={<StudyPlan />} />
          <Route path="practice" element={<PracticeDeck />} />
          <Route path="tutor" element={<SocraticTutor />} />
          <Route path="journal" element={<MistakeJournal />} />
        </Route>
      </Routes>
    </AppProviders>
  )
}

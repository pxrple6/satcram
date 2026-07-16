import { useEffect, useState } from 'react'

function profileKey(userId) {
  return `satcram_profile_${userId || 'guest'}`
}

function load(userId) {
  try {
    const raw = localStorage.getItem(profileKey(userId))
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return { satTestDate: null, name: '' }
}

export function useUserProfile(userId = 'guest') {
  const key = profileKey(userId)
  const [profile, setProfile] = useState(() => load(userId))

  useEffect(() => {
    setProfile(load(userId))
  }, [userId])

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(profile))
  }, [profile, key])

  function setSatTestDate(date) {
    setProfile((p) => ({ ...p, satTestDate: date || null }))
  }

  function setName(name) {
    setProfile((p) => ({ ...p, name: name || '' }))
  }

  return { profile, setSatTestDate, setName }
}

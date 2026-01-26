'use client'

import { useState } from 'react'
import ParticipantEntry from '@/components/ParticipantEntry'
import DashboardWithChat from '@/components/DashboardWithChat'

export default function Home() {
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [group, setGroup] = useState<number>(1)

  const handleParticipantIdSet = (id: string, selectedGroup: number) => {
    setParticipantId(id)
    setGroup(selectedGroup)
  }

  if (!participantId) {
    return <ParticipantEntry onParticipantIdSet={handleParticipantIdSet} />
  }

  return <DashboardWithChat participantId={participantId} group={group} />
}


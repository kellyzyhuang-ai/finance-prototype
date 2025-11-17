'use client'

import { useState, Suspense } from 'react'
import ParticipantEntry from '@/components/ParticipantEntry'
import BaselineSurvey from '@/components/BaselineSurvey'
import ChatInterface from '@/components/ChatInterface'
import { BaselineSurveyData } from '@/types/survey'
import StudyDataManager from '@/lib/studyData'

function ChatWrapper({ participantId, group }: { participantId: string; group: number }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>}>
      <ChatInterface participantId={participantId} group={group} />
    </Suspense>
  )
}

export default function Home() {
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [group, setGroup] = useState<number>(1)
  const [baselineComplete, setBaselineComplete] = useState(false)

  const handleParticipantIdSet = (id: string, selectedGroup: number) => {
    setParticipantId(id)
    setGroup(selectedGroup)
  }

  if (!participantId) {
    return <ParticipantEntry onParticipantIdSet={handleParticipantIdSet} />
  }

  if (!baselineComplete) {
    return (
      <BaselineSurvey
        participantId={participantId}
        group={group}
        onComplete={(data) => {
          // Store baseline data
          const studyDataManager = new StudyDataManager(participantId)
          studyDataManager.setBaselineSurvey(data)
          setBaselineComplete(true)
        }}
      />
    )
  }

  return <ChatWrapper participantId={participantId} group={group} />
}


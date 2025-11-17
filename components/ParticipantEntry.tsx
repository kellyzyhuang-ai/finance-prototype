'use client'

import { useState } from 'react'

interface ParticipantEntryProps {
  onParticipantIdSet: (id: string, group: number) => void
}

export default function ParticipantEntry({ onParticipantIdSet }: ParticipantEntryProps) {
  const [participantId, setParticipantId] = useState('')
  const [group, setGroup] = useState<number>(1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (participantId.trim()) {
      onParticipantIdSet(participantId.trim(), group)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          AI Financial Assistant Study
        </h1>
        <p className="text-xl text-gray-700 mb-8 text-center">
          Please enter your participant ID to begin
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="participantId" 
              className="block text-xl font-semibold text-gray-900 mb-3"
            >
              Participant ID
            </label>
            <input
              type="text"
              id="participantId"
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your ID"
              required
              autoFocus
            />
          </div>
          <div>
            <label 
              htmlFor="group" 
              className="block text-xl font-semibold text-gray-900 mb-3"
            >
              Group
            </label>
            <select
              id="group"
              value={group}
              onChange={(e) => setGroup(parseInt(e.target.value))}
              className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
              required
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>
                  Group {num}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg text-xl transition-colors min-h-[48px]"
          >
            Start Study
          </button>
        </form>
      </div>
    </div>
  )
}




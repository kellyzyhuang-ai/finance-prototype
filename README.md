# AI Financial Assistant Study Prototype

A Next.js prototype for a master's thesis study on AI financial assistants for older adults (65+). This is a 3x2 within-subjects experiment testing autonomy levels (low/medium/high) and explanation quality (low/high).

## Features

- **Participant ID Entry**: Secure entry screen for study participants
- **Chat Interface**: Wizard-of-Oz AI assistant with pre-scripted messages
- **Three Autonomy Levels**:
  - **LOW**: AI shows 3 equal options, user selects one, then confirms (two-step)
  - **MEDIUM**: AI recommends one option prominently, user approves with one click
  - **HIGH**: AI has already scheduled action, user can veto within 24 hours
- **Two Explanation Qualities**:
  - **LOW**: Brief explanations
  - **HIGH**: Detailed explanations with reasoning
- **Interaction Logging**: Tracks all clicks, timestamps, decision latency, and user choices
- **CSV Export**: Download all logged data for analysis
- **Accessibility**: 18px+ fonts, high contrast, large buttons (48px+ height)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Controlling Study Conditions

The prototype reads conditions from URL parameters:

- `?autonomy=low&explanation=low` - Low autonomy, low explanation
- `?autonomy=low&explanation=high` - Low autonomy, high explanation
- `?autonomy=medium&explanation=low` - Medium autonomy, low explanation
- `?autonomy=medium&explanation=high` - Medium autonomy, high explanation
- `?autonomy=high&explanation=low` - High autonomy, low explanation
- `?autonomy=high&explanation=high` - High autonomy, high explanation

If no parameters are provided, defaults to `low` autonomy and `low` explanation.

### Example URLs

```
http://localhost:3000?autonomy=medium&explanation=high
http://localhost:3000?autonomy=high&explanation=low
```

### Data Collection

1. Participant enters their ID on the entry screen
2. All interactions are automatically logged:
   - Button clicks
   - Timestamps
   - Decision latency (time from message display to decision)
   - Info requests
   - Selected options
   - Confirmations/approvals/vetoes
3. Click "Export Data" button to download a CSV file with all logged interactions

### CSV Export Format

The exported CSV includes:
- `timestamp`: ISO timestamp of the interaction
- `participantId`: Participant identifier
- `eventType`: Type of event (click, info_request, decision, confirmation, approval, veto)
- `elementId`: ID of the clicked element
- `elementText`: Text content of the element
- `decisionLatency`: Time in milliseconds from decision start to action
- `autonomyLevel`: Current autonomy level (low/medium/high)
- `explanationQuality`: Current explanation quality (low/high)
- `sessionId`: Unique session identifier
- `additionalData`: JSON string with additional context

## Study Design

### Autonomy Levels

1. **LOW Autonomy**:
   - AI presents 3 equal options
   - User selects one option
   - User confirms selection (two-step process)
   - Tracks: option selection, confirmation, latency

2. **MEDIUM Autonomy**:
   - AI recommends one option prominently
   - User approves or declines with one click
   - Tracks: approval/decline, latency

3. **HIGH Autonomy**:
   - AI has already scheduled the action
   - User can veto within 24 hours
   - Tracks: veto/accept, latency

### Explanation Quality

- **LOW**: Brief, concise explanations
- **HIGH**: Detailed explanations with reasoning, context, and implications

## Accessibility Features

- Minimum font size: 18px
- High contrast color scheme
- Large interactive elements (minimum 48px height)
- Clear visual hierarchy
- Simple, intuitive interface

## Technology Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Client-side logging**: All interactions logged in browser
- **CSV export**: Browser-based data export

## File Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page with routing
│   └── globals.css         # Global styles
├── components/
│   ├── ParticipantEntry.tsx    # Participant ID entry screen
│   └── ChatInterface.tsx       # Main chat interface
├── lib/
│   └── logger.ts              # Interaction logging system
├── types/
│   └── index.ts               # TypeScript type definitions
└── package.json
```

## Notes for Researchers

- All data is logged client-side and exported via CSV
- No data is sent to external servers
- Each session has a unique session ID
- Decision latency is calculated from when the decision interface appears
- The prototype uses pre-scripted messages (Wizard-of-Oz design)
- Modify `SCRIPTED_MESSAGES` in `ChatInterface.tsx` to change AI responses

## License

This prototype is created for academic research purposes.




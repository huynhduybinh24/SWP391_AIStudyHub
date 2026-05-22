import { StudyPlan } from '../types'

export const STUDY_PLANS: StudyPlan[] = [
  {
    id: '1',
    title: 'Quantum Mechanics Mastery',
    description:
      'A comprehensive journey from wave functions to quantum entanglement.',
    isAiGenerated: true,
    status: 'Active',
    documents: 12,
    hoursEst: 48,
    difficulty: 'Hard',
    overallProgress: 65,
    segments: [
      { label: 'Core Concepts', value: 100 },
      { label: 'Advanced Theory', value: 65 },
      { label: 'Mock Exam', value: 0 },
    ],
    milestone: {
      month: 'OCT',
      day: 24,
      title: "Schrödinger's Equation Quiz",
      time: '10:00 AM Tomorrow',
    },
  },
  {
    id: '2',
    title: 'Organic Chemistry Fundamentals',
    description:
      'Master reaction mechanisms, functional groups, and synthesis pathways.',
    isAiGenerated: false,
    status: 'Active',
    documents: 8,
    hoursEst: 32,
    difficulty: 'Medium',
    overallProgress: 40,
    segments: [
      { label: 'Basics', value: 100 },
      { label: 'Reactions', value: 40 },
      { label: 'Synthesis', value: 0 },
    ],
    milestone: {
      month: 'NOV',
      day: 3,
      title: 'Reaction Mechanisms Test',
      time: '2:00 PM, Next Week',
    },
  },
  {
    id: '3',
    title: 'Data Structures & Algorithms',
    description:
      'From arrays to graphs — crack competitive programming interviews.',
    isAiGenerated: true,
    status: 'Upcoming',
    documents: 15,
    hoursEst: 60,
    difficulty: 'Hard',
    overallProgress: 0,
    segments: [
      { label: 'Arrays & Strings', value: 0 },
      { label: 'Trees & Graphs', value: 0 },
      { label: 'Dynamic Prog.', value: 0 },
    ],
    milestone: {
      month: 'NOV',
      day: 10,
      title: 'Arrays & Sorting Quiz',
      time: '9:00 AM, Nov 10',
    },
  },
  {
    id: '4',
    title: 'World History: Modern Era',
    description:
      'Explore major events shaping the 20th and 21st centuries.',
    isAiGenerated: false,
    status: 'Completed',
    documents: 6,
    hoursEst: 20,
    difficulty: 'Easy',
    overallProgress: 100,
    segments: [
      { label: 'WWI & WWII', value: 100 },
      { label: 'Cold War', value: 100 },
      { label: 'Modern Era', value: 100 },
    ],
    milestone: {
      month: 'SEP',
      day: 15,
      title: 'Final Comprehensive Exam',
      time: 'Completed',
    },
  },
]

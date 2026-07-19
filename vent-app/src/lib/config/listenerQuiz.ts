export interface QuizQuestion {
  id: string;
  scenario: string;
  options: { id: string; label: string; correct: boolean }[];
  explanation: string;
}

// Comprehension check, not a gate meant to exclude people — failing lets you
// retry immediately. Covers: validate-don't-solve, confidentiality, and
// recognizing when to escalate rather than try to help directly.
export const LISTENER_QUIZ: QuizQuestion[] = [
  {
    id: 'validate-dont-solve',
    scenario:
      "Someone vents: \"I got passed over for a promotion again. I'm starting to think I'm just not good enough.\" What's the best response?",
    options: [
      { id: 'a', label: '"That sounds incredibly frustrating — you\'ve clearly been putting in the work."', correct: true },
      { id: 'b', label: '"You should just start looking for a new job immediately."', correct: false },
      { id: 'c', label: '"Have you considered that it might be something you\'re doing wrong?"', correct: false },
    ],
    explanation: 'Validate the feeling first. Unsolicited advice or blame usually makes a venter feel worse, not better.',
  },
  {
    id: 'confidentiality',
    scenario: 'After a call ends, is it okay to share what someone told you with a friend, without using their name?',
    options: [
      { id: 'a', label: 'Yes, as long as I don\'t use their real name.', correct: false },
      { id: 'b', label: 'No — what\'s shared in a vent stays private, full stop.', correct: true },
      { id: 'c', label: 'Only if it\'s a funny or interesting story.', correct: false },
    ],
    explanation: "Anonymity doesn't make sharing okay — treat every vent as confidential, the same way you'd want your own kept.",
  },
  {
    id: 'red-flags',
    scenario: 'A venter says something that makes you seriously worried they might hurt themselves. What should you do?',
    options: [
      { id: 'a', label: 'Try to talk them out of it yourself — you\'re their listener.', correct: false },
      { id: 'b', label: 'End the call immediately without saying anything.', correct: false },
      {
        id: 'c',
        label: 'Gently point them to the Crisis Resources button — you\'re not equipped to handle this alone, and that\'s okay.',
        correct: true,
      },
    ],
    explanation: "You're a peer, not a crisis counselor. Recognizing when to hand off to real crisis resources is the single most important skill here.",
  },
];

export const PASSING_SCORE = LISTENER_QUIZ.length; // all 3 must be correct

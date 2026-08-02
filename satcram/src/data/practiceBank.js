// Original SAT-style practice items written for SATcram. They are not copied
// from Khan Academy, College Board, or any other publisher.
export const PRACTICE_BANK = [
  {
    id: 'math-linear-1', subject: 'Math', topic: 'Linear Equations', difficulty: 'Easy',
    prompt: 'A gym charges a one-time registration fee of $18 and $12 each month. Which equation gives the total cost $C$ after $m$ months?',
    choices: ['$C = 12m + 18$', '$C = 18m + 12$', '$C = 30m$', '$C = 12(m + 18)$'], answer: '$C = 12m + 18$',
    explanation: 'The monthly charge is the coefficient of $m$, and the one-time fee is added once: $C = 12m + 18$.'
  },
  {
    id: 'math-linear-2', subject: 'Math', topic: 'Linear Equations', difficulty: 'Medium',
    prompt: 'If $3x - 7 = 20$, what is the value of $x$?',
    choices: ['$-9$', '$3$', '$9$', '$13$'], answer: '$9$',
    explanation: 'Add $7$ to both sides to get $3x = 27$, then divide by $3$.'
  },
  {
    id: 'math-functions-1', subject: 'Math', topic: 'Functions', difficulty: 'Medium',
    prompt: 'For $f(x) = 2x^2 - 3$, what is $f(4)$?',
    choices: ['$11$', '$29$', '$32$', '$35$'], answer: '$29$',
    explanation: 'Substitute $4$: $f(4) = 2(4^2)-3 = 2(16)-3 = 29$.'
  },
  {
    id: 'math-ratio-1', subject: 'Math', topic: 'Ratios & Percents', difficulty: 'Easy',
    prompt: 'A jacket originally costs $80 and is discounted by 25%. What is the sale price?',
    choices: ['$20$', '$55$', '$60$', '$75$'], answer: '$60$',
    explanation: 'A 25% discount leaves 75% of the original price: $0.75(80)=60$.'
  },
  {
    id: 'math-data-1', subject: 'Math', topic: 'Data & Statistics', difficulty: 'Medium',
    prompt: 'The mean of 4, 7, 9, and $x$ is 8. What is $x$?',
    choices: ['$8$', '$10$', '$12$', '$16$'], answer: '$12$',
    explanation: 'The four values must total $4(8)=32$. The known values total $20$, so $x=12$.'
  },
  {
    id: 'math-quad-1', subject: 'Math', topic: 'Quadratics', difficulty: 'Medium',
    prompt: 'Which value of $x$ is a solution to $x^2 - 5x + 6 = 0$?',
    choices: ['$-3$', '$1$', '$2$', '$5$'], answer: '$2$',
    explanation: 'Factor: $(x-2)(x-3)=0$, so the solutions are $2$ and $3$.'
  },
  {
    id: 'reading-main-1', subject: 'Reading', topic: 'Main Idea', difficulty: 'Easy',
    prompt: 'A passage explains that city trees reduce summer temperatures, filter air pollution, and make walking more comfortable. Which choice best states the central idea?',
    choices: ['City trees provide several practical benefits for urban residents.', 'City trees should replace all public transportation.', 'Most cities have planted too many trees.', 'Air pollution is caused only by hot weather.'], answer: 'City trees provide several practical benefits for urban residents.',
    explanation: 'The details all support one broad claim about the benefits of urban trees.'
  },
  {
    id: 'reading-inference-1', subject: 'Reading', topic: 'Inference', difficulty: 'Medium',
    prompt: 'After reviewing two prototypes, the engineer chose the second because it used less energy while producing the same output. What can reasonably be inferred?',
    choices: ['The second prototype was more efficient.', 'The first prototype produced no output.', 'The engineer disliked the first prototype’s appearance.', 'Both prototypes cost exactly the same amount.'], answer: 'The second prototype was more efficient.',
    explanation: 'Using less energy for the same output is the definition of greater efficiency.'
  },
  {
    id: 'writing-punct-1', subject: 'Writing', topic: 'Punctuation', difficulty: 'Easy',
    prompt: 'Choose the best revision: “The library extended its hours ___ students could study after school.”',
    choices: ['hours, so', 'hours so', 'hours; so', 'hours: so'], answer: 'hours, so',
    explanation: 'A comma before the coordinating conjunction “so” correctly joins the independent clause to its result.'
  },
  {
    id: 'writing-transition-1', subject: 'Writing', topic: 'Transitions', difficulty: 'Medium',
    prompt: 'Mina wanted to finish the race. ___, an ankle injury forced her to stop halfway through. Which transition best fits?',
    choices: ['For example', 'However', 'Similarly', 'Therefore'], answer: 'However',
    explanation: 'The second sentence contrasts with Mina’s intention, so “However” is the logical transition.'
  },
  {
    id: 'writing-verb-1', subject: 'Writing', topic: 'Verb Agreement', difficulty: 'Medium',
    prompt: 'The collection of rare maps ___ displayed in a glass case.',
    choices: ['are', 'were', 'is', 'have'], answer: 'is',
    explanation: 'The subject is “collection,” which is singular; “of rare maps” is a modifying phrase.'
  },
  {
    id: 'writing-concise-1', subject: 'Writing', topic: 'Concision', difficulty: 'Easy',
    prompt: 'Which choice is most concise while preserving meaning? “At this point in time, the committee is currently reviewing the proposal.”',
    choices: ['The committee is reviewing the proposal.', 'The committee is currently at this point reviewing the proposal.', 'At this point, the committee is currently reviewing the proposal.', 'The proposal is currently being reviewed at this point in time by the committee.'], answer: 'The committee is reviewing the proposal.',
    explanation: '“At this point in time” and “currently” are redundant; the shorter sentence is clearer.'
  },
]

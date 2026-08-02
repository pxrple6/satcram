// Original SAT-style practice items written for SATcram. They are not copied
// from Khan Academy, College Board, or any other publisher.
const CORE_PRACTICE_BANK = [
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

function unique(values) { return [...new Set(values)] }

const LINEAR_SETS = [
  [2, 5, 19], [3, -4, 17], [4, 7, 31], [5, -6, 24], [6, 2, 38], [7, -9, 26], [8, 4, 44], [9, -3, 42],
].map(([a, b, total], index) => {
  const answer = (total - b) / a
  const choices = unique([answer, total / a, answer + 1, Math.abs(answer - 2)]).map((n) => `$${n}$`)
  return { id: `linear-drill-${index}`, subject: 'Math', topic: 'Linear Equations', difficulty: index < 3 ? 'Easy' : 'Medium', prompt: `What is the value of $x$ in $${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)} = ${total}$?`, choices, answer: `$${answer}$`, explanation: `Undo the constant first, then divide by $${a}$. This gives $x = ${answer}$.` }
})

const FUNCTION_SETS = [
  [2, 3, 4], [3, -2, 5], [4, 1, 3], [5, -6, 4], [2, 7, 6], [6, -5, 2], [3, 4, 7], [4, -3, 5],
].map(([a, b, input], index) => {
  const answer = a * input + b
  return { id: `function-drill-${index}`, subject: 'Math', topic: 'Functions', difficulty: 'Medium', prompt: `For $f(x) = ${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)}$, what is $f(${input})$?`, choices: unique([answer, a + input + b, a * input, answer + a]).map((n) => `$${n}$`), answer: `$${answer}$`, explanation: `Substitute $${input}$ for $x$: $f(${input}) = ${a}(${input}) ${b >= 0 ? '+' : '−'} ${Math.abs(b)} = ${answer}$.` }
})

const PERCENT_SETS = [[40, 15], [60, 20], [75, 12], [120, 25], [90, 30], [64, 25], [150, 10], [200, 35]].map(([price, discount], index) => {
  const answer = price * (100 - discount) / 100
  return { id: `percent-drill-${index}`, subject: 'Math', topic: 'Ratios & Percents', difficulty: index < 3 ? 'Easy' : 'Medium', prompt: `A $${price}$ item is discounted by $${discount}\%$. What is its sale price?`, choices: unique([answer, price * discount / 100, price - discount, answer + discount]).map((n) => `$${n}$`), answer: `$${answer}$`, explanation: `A $${discount}\%$ discount leaves $${100 - discount}\%$ of the price: $${price}(${(100 - discount) / 100}) = ${answer}$.` }
})

const READING_SETS = [
  ['A researcher notes that restoring wetlands can reduce flooding, filter runoff, and create habitat for birds.', 'Restoring wetlands can provide several environmental benefits.', 'Wetlands should be replaced with parks.', 'Birds are the main cause of flooding.', 'Every city has wetlands.'],
  ['A historian explains that an invention became common only after factories could make it cheaply and reliably.', 'Lower production costs helped the invention spread.', 'Factories invented the product.', 'The invention was unpopular.', 'Reliability always lowers prices.'],
  ['The author describes a study whose results were unexpected but repeats that its sample was small.', 'The results should be interpreted cautiously.', 'The study was dishonest.', 'The results are certainly wrong.', 'A small sample proves a claim.'],
  ['A school extended library hours after students said they needed a quiet place to work after classes.', 'The change responded to a student need.', 'Students no longer have classes.', 'Libraries are always quiet.', 'The school reduced its library budget.'],
  ['A passage contrasts an early map, based on travelers’ reports, with a later map made using precise measurements.', 'The later map was likely more accurate.', 'The early map used no information.', 'Travelers opposed measurement.', 'Both maps were identical.'],
  ['A scientist writes that a new material is promising but needs further testing outside the laboratory.', 'The material’s usefulness is not yet certain.', 'The material has already replaced older materials.', 'Laboratory tests are unnecessary.', 'The scientist rejects the material.'],
].map(([prompt, answer, ...wrong], index) => ({ id: `reading-drill-${index}`, subject: 'Reading', topic: index % 2 ? 'Inference' : 'Main Idea', difficulty: 'Medium', prompt: `${prompt} Which choice is best supported by the passage?`, choices: [answer, ...wrong], answer, explanation: 'Choose the claim the passage directly supports; avoid answers that add a stronger claim than the evidence allows.' }))

const WRITING_SETS = [
  ['The students practiced daily ___ they felt more confident on test day.', 'so', 'because', 'however', 'for example', 'so'],
  ['The experiment was carefully planned. ___, the results were inconsistent.', 'However', 'For example', 'Similarly', 'Therefore', 'However'],
  ['The team of volunteers ___ organizing the event.', 'is', 'are', 'were', 'have', 'is'],
  ['The writer revised the introduction ___ the conclusion.', 'and', 'but', 'because', 'although', 'and'],
  ['The city planted trees. ___, summer sidewalks became cooler.', 'As a result', 'For instance', 'Meanwhile', 'Nevertheless', 'As a result'],
  ['The list of supplies ___ on the desk.', 'is', 'are', 'have', 'were', 'is'],
  ['The committee considered several options. ___, it chose the least expensive one.', 'Ultimately', 'For example', 'Similarly', 'In contrast', 'Ultimately'],
  ['The exhibition includes paintings, sculptures, ___ photographs.', 'and', 'but', 'or', 'so', 'and'],
].map(([sentence, ...choices], index) => {
  const answer = choices[choices.length - 1]
  const topic = index === 2 || index === 5 ? 'Verb Agreement' : index === 0 || index === 3 || index === 7 ? 'Punctuation' : 'Transitions'
  return { id: `writing-drill-${index}`, subject: 'Writing', topic, difficulty: 'Easy', prompt: `Choose the best word or phrase to complete the sentence: “${sentence}”`, choices: choices.slice(0, 4), answer, explanation: topic === 'Verb Agreement' ? 'Find the main subject, not the noun inside the “of” phrase. The main subject here is singular.' : topic === 'Transitions' ? 'Choose a transition that matches the logical relationship between the two sentences.' : 'Choose the word that joins the two ideas clearly and grammatically.' }
})

const MIXED_MATH_SETS = Array.from({ length: 24 }, (_, index) => {
  if (index % 3 === 0) {
    const firstRoot = (index % 5) + 1
    const secondRoot = firstRoot + 2
    const choices = unique([firstRoot, secondRoot, firstRoot + secondRoot, firstRoot * secondRoot]).map((n) => `$${n}$`)
    return { id: `quadratic-drill-${index}`, subject: 'Math', topic: 'Quadratics', difficulty: 'Medium', prompt: `Which value is a solution to $(x - ${firstRoot})(x - ${secondRoot}) = 0$?`, choices, answer: `$${firstRoot}$`, explanation: `A product is zero when either factor is zero. Set $x - ${firstRoot} = 0$ or $x - ${secondRoot} = 0$.` }
  }
  if (index % 3 === 1) {
    const x = (index % 6) + 2
    const y = (index % 4) + 1
    const choices = unique([x, y, x + y, x - y]).map((n) => `$${n}$`)
    return { id: `system-drill-${index}`, subject: 'Math', topic: 'Systems of Equations', difficulty: 'Medium', prompt: `If $x + y = ${x + y}$ and $x - y = ${x - y}$, what is the value of $x$?`, choices, answer: `$${x}$`, explanation: `Add the equations: $2x = ${(x + y) + (x - y)}$, so $x = ${x}$.` }
  }
  const length = (index % 5) + 4
  const width = (index % 4) + 3
  const answer = 2 * (length + width)
  return { id: `geometry-drill-${index}`, subject: 'Math', topic: 'Geometry', difficulty: 'Easy', prompt: `A rectangle has length $${length}$ and width $${width}$. What is its perimeter?`, choices: unique([answer, length * width, length + width, answer + 2]).map((n) => `$${n}$`), answer: `$${answer}$`, explanation: `A rectangle has two lengths and two widths: $2(${length} + ${width}) = ${answer}$.` }
})

const READING_MORE = [
  ['A journalist describes a proposal as ambitious but notes that it has not yet received funding.', 'The proposal may be difficult to carry out.', 'The proposal has already been completed.', 'Funding guarantees success.', 'The journalist opposes all proposals.'],
  ['A biographer explains that the artist experimented with several styles before developing a recognizable one.', 'The artist’s style changed over time.', 'The artist never repeated an idea.', 'The artist worked only with one material.', 'The artist avoided experimentation.'],
  ['The passage states that a town’s population increased after a new rail line connected it to nearby cities.', 'The rail line likely contributed to the town’s growth.', 'The town had no residents before the rail line.', 'All rail lines cause population growth.', 'Nearby cities lost all their residents.'],
  ['The writer praises a policy for reducing waste but acknowledges that it requires careful planning.', 'The policy has benefits and implementation challenges.', 'The policy has no drawbacks.', 'Planning always creates waste.', 'The writer rejects the policy.'],
  ['A report explains that a company’s sales rose after it simplified its ordering process.', 'Making orders easier may have helped sales increase.', 'The company lowered every price.', 'Customers stopped using the company.', 'Ordering processes do not affect sales.'],
  ['The author notes that an early observation was later confirmed by repeated experiments.', 'Later evidence supported the initial observation.', 'The early observation was ignored.', 'Experiments can never confirm ideas.', 'The initial observation was false.'],
].flatMap(([prompt, answer, ...wrong], index) => [0, 1].map((repeat) => ({ id: `reading-more-${index}-${repeat}`, subject: 'Reading', topic: repeat ? 'Inference' : 'Evidence Support', difficulty: 'Medium', prompt: `${prompt} Which choice is best supported?`, choices: [answer, ...wrong], answer, explanation: 'The strongest answer stays within the evidence stated in the passage.' })))

const WRITING_MORE = [
  ['The plants received enough sunlight, ___ they grew quickly.', 'so', 'although', 'for example', 'meanwhile', 'Transitions'],
  ['The group of musicians ___ performing tonight.', 'is', 'are', 'have', 'were', 'Verb Agreement'],
  ['The museum added new exhibits ___ more visitors came.', 'and', 'because', 'but', 'although', 'Punctuation'],
  ['The data were incomplete. ___, the researchers delayed their conclusion.', 'Therefore', 'For example', 'Similarly', 'Meanwhile', 'Transitions'],
  ['The list of ingredients ___ on the counter.', 'is', 'are', 'were', 'have', 'Verb Agreement'],
  ['The students read the chapter ___ discussed it in class.', 'and', 'however', 'therefore', 'because', 'Punctuation'],
].flatMap(([sentence, answer, wrongOne, wrongTwo, wrongThree, topic], index) => [0, 1].map((repeat) => ({ id: `writing-more-${index}-${repeat}`, subject: 'Writing', topic, difficulty: 'Easy', prompt: `Choose the best completion: “${sentence}”`, choices: [answer, wrongOne, wrongTwo, wrongThree], answer, explanation: topic === 'Verb Agreement' ? 'Use the singular verb because the main subject is singular.' : topic === 'Transitions' ? 'Match the connector to the relationship between the ideas.' : 'Choose the completion that joins the ideas clearly and grammatically.' })))

// A 98-question original starter bank. New questions are mixed in only when a
// student begins their next session, so feedback never changes mid-question.
export const PRACTICE_BANK = [...CORE_PRACTICE_BANK, ...LINEAR_SETS, ...FUNCTION_SETS, ...PERCENT_SETS, ...READING_SETS, ...WRITING_SETS, ...MIXED_MATH_SETS, ...READING_MORE, ...WRITING_MORE]

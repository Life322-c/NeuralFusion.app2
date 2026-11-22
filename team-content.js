/* NeuralFusion Team Cognitive Development Experience: CONTENT.
 * Pure data, no UI and no network. The engine in team-experience.js renders it.
 * Step types: read | pick | choice | classify | fields | team | integrate | outcome | result | takeaway
 * Everything a person answers is saved as shared_data (visible anonymously to teammates after they
 * have submitted their own) unless the step has private:true, which stays with that person only.
 */
(function () {
  'use strict';

  // ---------- The four thinking modes (never ranked) ----------
  const MODES = {
    analytical:  { id: 'analytical',  name: 'Analytical',  word: 'Precision',  color: '#1E4FA8', tint: '#EAF1FC', glyph: 'A',
      does: 'Examines facts, structures problems, identifies constraints, and separates assumptions from evidence.',
      strong: 'Clearing the ground when facts are disputed or a plan rests on unchecked claims.',
      alone: 'Can wait for certainty that never arrives, or miss what the numbers do not hold.' },
    intuitive:   { id: 'intuitive',   name: 'Intuitive',   word: 'Insight',    color: '#9A4A00', tint: '#FDF1E3', glyph: 'I',
      does: 'Recognises patterns, notices what stands out, and picks up early impressions and emerging direction.',
      strong: 'Noticing that something is off before the reasons are clear.',
      alone: 'Can mistake a first impression, or a bias, for a conclusion.' },
    associative: { id: 'associative', name: 'Associative', word: 'Expansion',  color: '#0B6B63', tint: '#E4F5F2', glyph: 'E',
      does: 'Generates possibilities, explores alternatives, connects ideas, and finds new perspectives.',
      strong: 'Moving a team that is stuck between two options.',
      alone: 'Can multiply ideas without testing any of them.' },
    reflective:  { id: 'reflective',  name: 'Reflective',  word: 'Evaluation', color: '#6A2FC4', tint: '#F0EAFB', glyph: 'R',
      does: 'Reviews reasoning, examines consequences, reconsiders assumptions, and learns from experience.',
      strong: 'Testing a choice while changing course is still cheap.',
      alone: 'Can second-guess a decision until nothing is decided.' },
    integrated:  { id: 'integrated',  name: 'Integrated',  word: 'All four',   color: '#0A2A6B', tint: '#FFF6DB', glyph: '+',
      does: 'Moves between precision, insight, expansion and evaluation as the situation changes.',
      strong: 'Real decisions, which rarely need only one kind of thinking.',
      alone: '' },
  };
  const MODE_ORDER = ['analytical', 'intuitive', 'associative', 'reflective'];

  // ---------- Five stages ----------
  const STAGES = [
    { n: 1, id: 'recognize',  name: 'RECOGNIZE',  line: 'See how your team approaches challenges, uncertainty and decisions today.' },
    { n: 2, id: 'understand', name: 'UNDERSTAND', line: 'Learn the four thinking modes and what each contributes.' },
    { n: 3, id: 'practice',   name: 'PRACTICE',   line: 'Practise each mode through exercises, not explanations.' },
    { n: 4, id: 'integrate',  name: 'INTEGRATE',  line: 'Combine the modes and think through a problem together.' },
    { n: 5, id: 'apply',      name: 'APPLY',      line: 'Use the framework on a real decision and leave with an outcome.' },
  ];

  // ---------- Pilot weeks ----------
  const WEEKS = [
    { n: 1, name: 'Baseline & Recognition', line: 'Initial assessment, team introduction, cognitive patterns and the four thinking modes.' },
    { n: 2, name: 'Mode Development',       line: 'Team lessons, individual mode exercises and team challenges for each of the four modes.' },
    { n: 3, name: 'Integration & Collaboration', line: 'Team Thinking Room, integrated exercises and perspective integration.' },
    { n: 4, name: 'Application',            line: 'Team Decision Lab, practical problem-solving, programme review and team development summary.' },
  ];

  // ---------- Step builders ----------
  const P = (text) => ({ t: 'p', text });
  const LIST = (items) => ({ t: 'list', items });
  const SCEN = (title, text) => ({ t: 'scenario', title, text });
  const NOTE = (text) => ({ t: 'note', text });

  function lesson(o) {
    const steps = [
      { id: 'intro', type: 'read', title: 'Why this matters for a team', blocks: [P(o.opening), SCEN(o.scenario.title, o.scenario.text)] },
      { id: 'principle', type: 'read', title: 'The principle', blocks: o.principle },
    ].concat(o.interact, [
      { id: 'apply', type: 'fields', title: 'Apply it to your team', prompt: o.apply.prompt, fields: o.apply.fields },
      { id: 'team', type: 'team', title: 'What your team brought', prompt: 'Teammates’ answers appear here, without names, as they complete this step.', from: 'apply', show: 'list' },
      { id: 'reflect', type: 'fields', private: true, title: 'Your reflection', prompt: o.reflect, fields: [{ id: 'r', label: 'Your reflection', kind: 'text', long: true, optional: true }] },
      { id: 'takeaway', type: 'takeaway', title: 'Takeaway', text: o.takeaway, next: o.next },
    ]);
    return { id: o.id, kind: 'lesson', num: o.num, stage: o.stage, week: o.week, title: o.title, mode: o.mode, modes: o.modes, minutes: o.minutes, summary: o.summary, steps };
  }

  // ---------- Lessons ----------
  const LESSONS = [
    lesson({
      id: 'l1', num: 1, stage: 1, week: 1, title: 'How We Approach Problems', mode: null, modes: [], minutes: 15,
      summary: 'Recognise your own first move, and how the people around you differ.',
      opening: 'Every team has habits it does not notice. Some people reach for numbers first, others for a feeling, an idea, or a lesson from last time. Before a team can think together on purpose, it helps to see how it already thinks.',
      scenario: { title: 'The Friday email', text: 'On Friday afternoon a key client moves a delivery date forward by two weeks. In Monday’s meeting four colleagues respond. One asks to see the contract and the delivery log. One says the client sounds under pressure from their own boss. One suggests asking whether a partial delivery would help. One asks what happened the last time a date moved.' },
      principle: [P('Those four responses are four different ways into the same problem. None is wrong and none is complete. Teams get stuck when everyone enters through the same door, or when different entry points are mistaken for disagreement.'),
        P('Recognising your own first move is where the work starts. It is not a score or a label. It is a habit you can see, and then choose to widen.')],
      interact: [
        { id: 'x1', type: 'pick', title: 'Your first move', max: 2,
          prompt: 'When a problem lands on you, what do you usually do first? Choose up to two that are most like you.',
          items: [{ id: 'a', text: 'Ask for the facts, numbers or documents.', mode: 'analytical' },
                  { id: 'b', text: 'Notice what feels off or what stands out.', mode: 'intuitive' },
                  { id: 'c', text: 'Think of other ways it could be handled.', mode: 'associative' },
                  { id: 'd', text: 'Think about what happened last time and what it taught us.', mode: 'reflective' },
                  { id: 'e', text: 'It depends on the problem. I have no usual first move.', mode: null }],
          whyLabel: 'In a sentence: what makes that your first move? (optional)' },
        { id: 'x1t', type: 'team', title: 'How your team enters a problem', prompt: 'The spread of first moves across your team, without names.', from: 'x1', show: 'tally',
          after: 'Different first moves are different contributions, not disagreements. A team with several of them has more ways into a problem.' },
      ],
      apply: { prompt: 'Think of a recent problem your team handled. Which of these first moves did it make, and which did it skip?',
        fields: [{ id: 'made', label: 'First moves we made', kind: 'text', long: true }, { id: 'skipped', label: 'First moves we skipped', kind: 'text', long: true }] },
      reflect: 'What did you notice about your own first move, and about how your teammates’ moves differ from yours?',
      takeaway: 'Different first moves are different contributions, not disagreements. Next you will learn the four thinking modes that name them.', next: 'l2',
    }),

    lesson({
      id: 'l2', num: 2, stage: 2, week: 1, title: 'The Four Thinking Modes', mode: null, modes: [], minutes: 20,
      summary: 'Name the four modes and learn to hear which one a sentence belongs to.',
      opening: 'A shared vocabulary makes a team’s thinking visible. NeuralFusion names four modes of thinking, each doing a different job. A team that can name the mode it is in can ask for the one it needs.',
      scenario: { title: 'The launch retrospective', text: 'Your team is reviewing a product launch that missed its first-month target. In the first ten minutes people say many things. Below you will hear eight of them. Each comes from one of the four modes.' },
      principle: [{ t: 'modes' }, P('No mode is better than another. Each is strongest at something and blind to something. The aim is not to pick a favourite but to move between them on purpose.')],
      interact: [
        { id: 'x1', type: 'classify', title: 'Which mode is speaking?', prompt: 'Sort each statement by the mode it comes from. Check your answers at the end.',
          cats: MODE_ORDER.map((m) => ({ id: m, label: MODES[m].name, mode: m })),
          items: [
            { id: 's1', text: 'What does the contract actually say about the delivery date?', key: 'analytical', why: 'It asks for evidence: a precise, factual question.' },
            { id: 's2', text: 'Something about this timeline feels optimistic.', key: 'intuitive', why: 'It is an impression of what stands out, offered before the reasons are known.' },
            { id: 's3', text: 'What if we offered the client a staged delivery instead?', key: 'associative', why: 'It opens a new possibility rather than examining the current one.' },
            { id: 's4', text: 'Looking back, what did we assume the last time a date moved?', key: 'reflective', why: 'It reviews earlier reasoning to learn from it.' },
            { id: 's5', text: 'Let’s list the three constraints we cannot change.', key: 'analytical', why: 'It structures the problem and identifies constraints.' },
            { id: 's6', text: 'Two of the signals we have had this month point the same way.', key: 'intuitive', why: 'It recognises a pattern across scattered pieces of information.' },
            { id: 's7', text: 'Could we borrow how the support team handles urgent requests?', key: 'associative', why: 'It connects an idea from elsewhere.' },
            { id: 's8', text: 'If this fails, what will we wish we had checked?', key: 'reflective', why: 'It examines consequences before committing.' }] },
      ],
      apply: { prompt: 'Pick one recurring meeting or decision in your team. Which modes get most of the airtime, and which rarely get any?',
        fields: [{ id: 'most', label: 'Modes that get the most airtime', kind: 'text', long: true }, { id: 'least', label: 'Modes that rarely get airtime', kind: 'text', long: true }] },
      reflect: 'Which mode do you find easiest to use, and which do you tend to skip? What might the team gain if you used the other one more?',
      takeaway: 'Four modes, four jobs: Precision, Insight, Expansion, Evaluation. Now you will practise each one, starting with Precision.', next: 'l3',
    }),

    lesson({
      id: 'l3', num: 3, stage: 3, week: 2, title: 'Precision: Evidence and Assumption', mode: 'analytical', modes: ['analytical'], minutes: 15,
      summary: 'Separate what is confirmed from what is merely plausible.',
      opening: 'Precision asks one question: what do we actually know? In teams, plausible explanations travel fast and quietly turn into facts.',
      scenario: { title: 'The late onboarding project', text: 'The onboarding project is two weeks late. In the status meeting the project lead says, “It’s late because the vendor is slow.” Everyone nods and the conversation moves on to how to put pressure on the vendor.' },
      principle: [P('Precision separates four things that sound alike: what is confirmed, what is assumed, what is an interpretation, and what is unknown. An assumption is not wrong. It is untested. The risk is not holding assumptions but not knowing you hold them.'),
        LIST(['How do we know this?', 'Who observed it, and when?', 'What would we see if it were untrue?'])],
      interact: [
        { id: 'x1', type: 'choice', title: 'What would you do first?', prompt: 'The project lead has given an explanation. What is the most useful thing to do next?',
          note: 'There is no trick here. Speed has value. The point is to see what each choice buys and what it costs.',
          options: [
            { id: 'a', label: 'Agree and escalate to the vendor’s management.', consequence: 'You act fast. If the vendor is not the cause, you have spent goodwill and the project is still late.' },
            { id: 'b', label: 'Ask what evidence shows the vendor is the cause, and what else changed over the same period.', consequence: 'It takes a few minutes and may feel like friction. It turns a belief into something checkable and often reveals a second cause.' },
            { id: 'c', label: 'Start replanning without discussing the cause.', consequence: 'You regain momentum, but a plan built on an unexamined cause tends to repeat the delay.' }] },
      ],
      apply: { prompt: 'Find one claim your team currently treats as fact.',
        fields: [{ id: 'claim', label: 'The claim', kind: 'text' }, { id: 'evidence', label: 'What evidence do we actually have?', kind: 'text', long: true }, { id: 'test', label: 'What is the quickest way to check it?', kind: 'text', long: true }] },
      reflect: 'Where in your own work do you pass along explanations without knowing how you know them?',
      takeaway: 'Precision does not slow a team down. It shows which parts of a plan stand on evidence. Next: what stands out before the evidence arrives.', next: 'l4',
    }),

    lesson({
      id: 'l4', num: 4, stage: 3, week: 2, title: 'Insight: Signals Worth Examining', mode: 'intuitive', modes: ['intuitive'], minutes: 15,
      summary: 'Treat an early impression as a signal to examine, not a verdict.',
      opening: 'Insight notices patterns and what stands out, often before the reasons are clear. Teams tend either to trust it too much or to dismiss it entirely.',
      scenario: { title: 'The vendor demo', text: 'After a vendor demo, a colleague says, “I can’t point to anything specific, but something feels off.” The room has a spreadsheet that scores the vendor 8 out of 10.' },
      principle: [P('An intuition is a signal, not a verdict. It may be a fast reading of patterns you have seen before, or it may be bias. The way to tell is to treat it as a question to examine.'),
        LIST(['Name what you noticed, as specifically as you can.', 'Ask what it might be pointing to.', 'Decide what would confirm it or dismiss it.'])],
      interact: [
        { id: 'x1', type: 'choice', title: 'How should the team treat the feeling?', prompt: 'What is the most useful response to your colleague?',
          options: [
            { id: 'a', label: 'Set it aside. The scores say 8 out of 10.', consequence: 'The spreadsheet wins. If the feeling was an early read on something real, it disappears with the decision.' },
            { id: 'b', label: 'Act on it and drop the vendor.', consequence: 'You act on an unexamined impression. If it was bias, you lose a good option for no reason.' },
            { id: 'c', label: 'Ask them to describe what they noticed, then turn it into something to check.', consequence: 'It costs ten minutes. Either the feeling becomes a specific question, such as unclear support terms, or it can be set aside with a reason.' }] },
      ],
      apply: { prompt: 'Think of a signal your team noticed recently but never examined.',
        fields: [{ id: 'signal', label: 'The signal', kind: 'text', long: true }, { id: 'happened', label: 'What happened to it?', kind: 'text', long: true }, { id: 'check', label: 'How could we have examined it?', kind: 'text', long: true }] },
      reflect: 'When did you last have a hunch you did not mention? What stopped you?',
      takeaway: 'Name the signal, then decide how to check it. Next: widening the options.', next: 'l5',
    }),

    lesson({
      id: 'l5', num: 5, stage: 3, week: 2, title: 'Expansion: Genuinely Different Options', mode: 'associative', modes: ['associative'], minutes: 15,
      summary: 'Tell a real alternative from a variation of the obvious option.',
      opening: 'Expansion generates options and connects ideas. Teams often have plenty of ideas that are really one option in different sizes.',
      scenario: { title: 'The slipping support queue', text: 'Customer support response times are slipping. Three proposals are on the table: hire two more agents, hire three more agents, or hire one agent and one contractor.' },
      principle: [P('A real alternative changes the approach, not the quantity. A useful test: if two options rest on the same underlying assumption, they are one option. Ways to expand: question the assumption, borrow from another field, or reverse the problem.')],
      interact: [
        { id: 'x1', type: 'classify', title: 'Variation or genuine alternative?', prompt: 'Sort each proposal. Check your answers at the end.',
          cats: [{ id: 'variation', label: 'A variation of the obvious option' }, { id: 'different', label: 'A genuinely different approach', mode: 'associative' }],
          items: [
            { id: 's1', text: 'Hire two more support agents.', key: 'variation', why: 'It assumes the answer is more capacity for the same work.' },
            { id: 's2', text: 'Hire three more support agents.', key: 'variation', why: 'The same option at a different size.' },
            { id: 's3', text: 'Hire one agent and one contractor.', key: 'variation', why: 'Still more capacity for the same work, only mixed differently.' },
            { id: 's4', text: 'Find the five question types behind most tickets and publish clear self-service answers.', key: 'different', why: 'It reduces demand instead of adding capacity.' },
            { id: 's5', text: 'Let customers book a call-back instead of waiting in the queue.', key: 'different', why: 'It changes how the wait is experienced.' },
            { id: 's6', text: 'Have other teams take the simplest tickets for one hour a day.', key: 'different', why: 'It changes who does the work.' }] },
      ],
      apply: { prompt: 'Take a problem your team faces and its obvious solution.',
        fields: [{ id: 'assumption', label: 'What assumption does the obvious option rest on?', kind: 'text', long: true },
                 { id: 'alts', label: 'Add options that break that assumption', kind: 'list', min: 2, hint: 'One idea per line.' },
                 { id: 'link', label: 'Something another team, field or industry does about a similar problem', kind: 'text', long: true, optional: true }] },
      reflect: 'Which of your own ideas still depended on the original assumption?',
      takeaway: 'A real alternative changes the approach, not the quantity. Next: testing a choice before you commit to it.', next: 'l6',
    }),

    lesson({
      id: 'l6', num: 6, stage: 3, week: 2, title: 'Evaluation: Looking Before You Commit', mode: 'reflective', modes: ['reflective'], minutes: 15,
      summary: 'Use a pre-mortem to find weak points while changing course is still cheap.',
      opening: 'Evaluation examines reasoning, consequences and weak points. It is most useful before a commitment, when changing course is still cheap.',
      scenario: { title: 'The new planning tool', text: 'The team has decided to roll out a new planning tool to all 60 staff on the first of next month. Everyone is positive. Nobody has asked how it could go wrong.' },
      principle: [P('A pre-mortem imagines that the decision has already failed and asks why. It gives people permission to name risks they would otherwise keep to themselves. Evaluation is not negativity. It is care about consequences.')],
      interact: [
        { id: 'x1', type: 'fields', title: 'Run a pre-mortem', prompt: 'It is three months later and the rollout failed.',
          fields: [{ id: 'reasons', label: 'The most likely reasons it failed', kind: 'list', min: 3, hint: 'One reason per line.' },
                   { id: 'reduce', label: 'Pick one reason. What could the team do now to reduce it?', kind: 'text', long: true }] },
      ],
      apply: { prompt: 'Take one decision your team is about to make.',
        fields: [{ id: 'decision', label: 'The decision', kind: 'text' }, { id: 'failure', label: 'What would failure look like?', kind: 'text', long: true }, { id: 'safeguard', label: 'One safeguard we can put in place now', kind: 'text', long: true }] },
      reflect: 'Did anything in the pre-mortem surprise you? Was it something you had already half-noticed?',
      takeaway: 'Imagining failure early is cheaper than discovering it late. Next: using all four modes together.', next: 'l7',
    }),

    lesson({
      id: 'l7', num: 7, stage: 4, week: 3, title: 'Moving Between the Modes', mode: 'integrated', modes: ['integrated'], minutes: 20,
      summary: 'Decide which mode a situation needs, and when to switch.',
      opening: 'The aim is not to prefer one mode but to move between them as the situation changes. Experienced teams do it without naming it. Here you practise naming it.',
      scenario: { title: 'Four moments in one week', text: 'Over one week your team meets four very different situations. In each, one mode is the most useful place to start.' },
      principle: [P('Each situation has a mode that helps most right now, and a cost to staying in the wrong one for too long. A simple rhythm: Precision to clear the ground, Insight to notice what the facts miss, Expansion to widen the options, Evaluation to test the choice. Real problems loop through these more than once.'),
        NOTE('Several answers can be defensible. What matters is the reason.')],
      interact: [
        { id: 'x1', type: 'classify', title: 'Which mode should lead?', prompt: 'For each situation, choose the mode that is most useful to start with.',
          cats: MODE_ORDER.map((m) => ({ id: m, label: MODES[m].name + ' (' + MODES[m].word + ')', mode: m })),
          items: [
            { id: 's1', text: 'Two people quote different numbers for the same metric.', key: 'analytical', why: 'Until the facts are agreed, every other discussion is built on them.' },
            { id: 's2', text: 'The numbers look fine, yet three people say the project feels at risk.', key: 'intuitive', why: 'Something is being noticed that the numbers do not hold. Examine the signal.' },
            { id: 's3', text: 'The team has argued about two options for an hour and neither is winning.', key: 'associative', why: 'Being stuck between two options often means the option space is too small.' },
            { id: 's4', text: 'A big decision was just made and everyone is relieved.', key: 'reflective', why: 'Relief is a good moment to ask what could go wrong while changing course is cheap.' }] },
      ],
      apply: { prompt: 'Choose a real decision your team will face in the next few weeks, and plan how you would move through the modes.',
        fields: [{ id: 'decision', label: 'The decision', kind: 'text' },
                 { id: 'a', label: 'Precision: what do we need to know?', kind: 'text', long: true },
                 { id: 'i', label: 'Insight: what might we be noticing or missing?', kind: 'text', long: true },
                 { id: 'e', label: 'Expansion: what other options exist?', kind: 'text', long: true },
                 { id: 'r', label: 'Evaluation: what could go wrong?', kind: 'text', long: true }] },
      reflect: 'Which switch between modes would be hardest for you in a real meeting, and why?',
      takeaway: 'Integration is a rhythm, not a recipe. Next you will use it on a real problem and leave with an outcome.', next: 'l8',
    }),

    lesson({
      id: 'l8', num: 8, stage: 5, week: 4, title: 'Putting the Framework to Work', mode: 'integrated', modes: ['integrated'], minutes: 25,
      summary: 'Take a real challenge through all four modes and finish with a next action.',
      opening: 'A framework earns its place when a team uses it on a real problem. This lesson ends with something you can take back to work.',
      scenario: { title: 'Choose a real challenge', text: 'Think of a challenge your team really faces: a delay, a disagreement about priorities, a decision you have been avoiding. Keep it small enough to act on this week.' },
      principle: [P('Take the problem through four moves and finish with one action. Precision: what we know. Insight: what stands out. Expansion: what else is possible. Evaluation: what could go wrong. The result is a decision-ready summary, not a perfect answer.')],
      interact: [
        { id: 'x1', type: 'fields', title: 'Work the problem', prompt: 'Work through each move in turn.',
          fields: [{ id: 'problem', label: 'The problem, in one sentence', kind: 'text' },
                   { id: 'know', label: 'Precision: what we know', kind: 'list', min: 2, hint: 'One fact per line.' },
                   { id: 'stands', label: 'Insight: what stands out', kind: 'list', min: 1 },
                   { id: 'options', label: 'Expansion: options, including one that is not obvious', kind: 'list', min: 2 },
                   { id: 'risks', label: 'Evaluation: what could go wrong', kind: 'list', min: 1 }] },
      ],
      apply: { prompt: 'Finish with a direction and one next action.',
        fields: [{ id: 'direction', label: 'The direction we will take', kind: 'text', long: true }, { id: 'action', label: 'The next action', kind: 'text' }, { id: 'owner', label: 'Who does it, and by when', kind: 'text' }] },
      reflect: 'What did the four moves change about how you saw the problem?',
      takeaway: 'You have an outcome, not just a completed lesson. The Decision Lab is where the whole team does this together and keeps a record.', next: 'lab',
    }),
  ];

  // ---------- Challenges ----------
  const reflectStep = (prompt) => ({ id: 'reflect', type: 'fields', private: true, title: 'Your reflection', prompt, fields: [{ id: 'r', label: 'Your reflection', kind: 'text', long: true, optional: true }] });
  const CAT4 = [{ id: 'fact', label: 'Confirmed fact' }, { id: 'assumption', label: 'Assumption' }, { id: 'interpretation', label: 'Interpretation' }, { id: 'unknown', label: 'Unknown' }];

  const CHALLENGES = [
    { id: 'c1', kind: 'challenge', num: 1, title: 'The Assumption Test', mode: 'analytical', modes: ['analytical'], minutes: 8, stage: 3, week: 2,
      summary: 'Classify what a project brief says, then see how much of it rests on assumption.',
      steps: [
        { id: 'intro', type: 'read', title: 'The Reporting Rebuild', blocks: [
          SCEN('The Reporting Rebuild', 'Your team has been asked to rebuild the monthly reporting process because reports arrive late. Ten statements from the project brief are below, each with where it came from.'),
          P('Classify each as a confirmed fact (checked, from a record or direct observation), an assumption (believed but unchecked), an interpretation (a reading of events), or an unknown (not yet established).')] },
        { id: 'classify', type: 'classify', title: 'Classify the brief', prompt: 'Decide on the basis of the source given.', cats: CAT4, showSource: true, noCheck: true,
          items: [
            { id: 's1', text: 'Monthly reports have arrived after the 5th in each of the last three months.', source: 'Delivery log', key: 'fact', why: 'It comes from a record.' },
            { id: 's2', text: 'The delay is caused by the data team being understaffed.', source: 'Said in a meeting, no data', key: 'assumption', why: 'A cause was stated with nothing checked.' },
            { id: 's3', text: 'Senior managers are unhappy with the reports.', source: 'One manager said “these are always late”', key: 'interpretation', why: 'One remark is read as how senior managers feel.' },
            { id: 's4', text: 'New tooling will fix the problem.', source: 'Vendor brochure', key: 'assumption', why: 'It is a prediction resting on a sales claim.' },
            { id: 's5', text: 'Two of the last three reports needed corrections after sending.', source: 'Corrections log', key: 'fact', why: 'It comes from a record.' },
            { id: 's6', text: 'How long each step of the reporting process takes.', source: 'Nobody has measured it', key: 'unknown', why: 'It has not been established.' },
            { id: 's7', text: 'The team is demotivated by the extra work.', source: 'Quieter meetings were observed', key: 'interpretation', why: 'Quiet is observed. Demotivation is a reading of it.' },
            { id: 's8', text: 'Whether other departments’ deadlines depend on this report.', source: 'Not asked', key: 'unknown', why: 'It has not been established.' },
            { id: 's9', text: 'Finance needs the report by the 3rd.', source: '“I think finance said the 3rd”', key: 'assumption', why: 'It is an unverified recollection.' },
            { id: 's10', text: 'The rebuild must be finished before the quarter ends.', source: 'Director’s email', key: 'fact', why: 'It is a documented constraint.' }] },
        { id: 'result', type: 'result', kind: 'assumption', title: 'What the brief rested on', from: 'classify' },
        { id: 'team', type: 'team', title: 'Where your team agreed', prompt: 'How teammates classified each statement. Disagreements are worth a conversation.', from: 'classify', show: 'classify' },
        reflectStep('Which statement surprised you? What made it feel like a fact?'),
        { id: 'takeaway', type: 'takeaway', title: 'Takeaway', text: 'Most of a typical brief rests on assumption, interpretation and gaps. Naming that is the first step to checking it.', next: 'c2' }] },

    { id: 'c2', kind: 'challenge', num: 2, title: 'First Signal', mode: 'intuitive', modes: ['intuitive'], minutes: 8, stage: 3, week: 2,
      summary: 'Say what stands out before you hear anyone else, then compare.',
      steps: [
        { id: 'intro', type: 'read', title: 'The customer snapshot', blocks: [
          SCEN('The quarterly customer snapshot', 'You are looking at a one-page snapshot of customer health. Work on your own first. You will see your teammates’ observations only after you have saved yours.')] },
        { id: 'pick', type: 'pick', title: 'What stands out?', max: 2, prompt: 'Choose up to two items that stand out to you most. Do not try to justify them rigorously.',
          items: [
            { id: 'a', text: 'Support tickets are 14% higher than last quarter, mostly billing questions.' },
            { id: 'b', text: 'Two long-standing customers asked for a “quick call” this month without saying why.' },
            { id: 'c', text: 'Net promoter score is unchanged.' },
            { id: 'd', text: 'A new competitor announced pricing at the same level as ours.' },
            { id: 'e', text: 'Renewal rate is 91%, within the usual range.' },
            { id: 'f', text: 'The customer success manager says the tone of emails has changed for three accounts.' }],
          whyLabel: 'What made it stand out? (optional)' },
        { id: 'team', type: 'team', title: 'What stood out to others', prompt: 'The spread of what your team noticed, with their reasons, without names.', from: 'pick', show: 'tally', withWhy: true },
        { id: 'next', type: 'fields', title: 'What deserves a closer look?', prompt: 'Having seen what others noticed, what is worth investigating, and how?',
          fields: [{ id: 'investigate', label: 'Worth investigating', kind: 'list', min: 1, hint: 'One per line.' }, { id: 'how', label: 'How would we check the first one?', kind: 'text', long: true }] },
        reflectStep('Did anything others noticed change what you think stands out?'),
        { id: 'takeaway', type: 'takeaway', title: 'Takeaway', text: 'Independent first impressions show what the team is collectively noticing. They are where to look, not what to conclude.', next: 'c3' }] },

    { id: 'c3', kind: 'challenge', num: 3, title: 'Beyond the Obvious', mode: 'associative', modes: ['associative'], minutes: 10, stage: 3, week: 2,
      summary: 'Generate different approaches and connections before choosing one.',
      steps: [
        { id: 'intro', type: 'read', title: 'The meeting overload', blocks: [
          SCEN('Calendars that are always full', 'Everyone on the team says there are too many meetings and no time to do the work. The obvious solution, proposed by three people already, is: cancel half the meetings.')] },
        { id: 'explore', type: 'fields', title: 'Go beyond the obvious', prompt: 'Before choosing anything, widen the field.',
          fields: [{ id: 'short', label: 'Why might cancelling half the meetings fall short?', kind: 'text', long: true },
                   { id: 'alts', label: 'Alternative approaches (at least one unconventional)', kind: 'list', min: 3, hint: 'One approach per line.' },
                   { id: 'link', label: 'A connection: something from another field, team or experience that handles a similar problem', kind: 'text', long: true }] },
        { id: 'choose', type: 'fields', title: 'Choose', prompt: 'Now select one of your own alternatives.',
          fields: [{ id: 'pick', label: 'The approach I would try', kind: 'pickown', from: 'explore.alts' }, { id: 'true', label: 'What would have to be true for it to work?', kind: 'text', long: true }] },
        { id: 'team', type: 'team', title: 'What your team came up with', prompt: 'Teammates’ alternatives, without names.', from: 'explore', show: 'list', fieldIds: ['alts', 'link'] },
        reflectStep('Which idea of a teammate’s would you not have thought of?'),
        { id: 'takeaway', type: 'takeaway', title: 'Takeaway', text: 'The obvious option is a starting point, not an answer. Widening first makes the eventual choice a real one.', next: 'c4' }] },

    { id: 'c4', kind: 'challenge', num: 4, title: 'The Second Look', mode: 'reflective', modes: ['reflective'], minutes: 10, stage: 3, week: 2,
      summary: 'Review a past decision for what worked, what did not, and what was overlooked.',
      steps: [
        { id: 'intro', type: 'read', title: 'The rushed launch', blocks: [
          SCEN('A decision made under a deadline', 'To meet a client’s date, a team launched a new feature before testing finished. The client was pleased at first. Within a week two bugs surfaced, and the team spent a weekend fixing them. One member later said they had had concerns but did not raise them because the date had been agreed.')] },
        { id: 'review', type: 'fields', title: 'Review the decision', prompt: 'Look back as if you were advising the team now.',
          fields: [{ id: 'worked', label: 'What worked', kind: 'list', min: 1 }, { id: 'didnt', label: 'What did not work', kind: 'list', min: 1 },
                   { id: 'overlooked', label: 'What was overlooked', kind: 'list', min: 1 }, { id: 'reconsider', label: 'What we would reconsider', kind: 'list', min: 1 }] },
        { id: 'team', type: 'team', title: 'How your team saw it', prompt: 'Teammates’ reviews, without names.', from: 'review', show: 'list' },
        reflectStep('Is there a decision of your own that deserves a second look?'),
        { id: 'takeaway', type: 'takeaway', title: 'Takeaway', text: 'A second look is how a team learns from what it has already done. The quietest concern is often the most informative.', next: 'c5' }] },

    { id: 'c5', kind: 'challenge', num: 5, title: 'Four-Mode Integration', mode: 'integrated', modes: ['integrated'], minutes: 20, stage: 4, week: 3,
      summary: 'Take a complex scenario through all four modes and produce an outcome.',
      steps: [
        { id: 'intro', type: 'read', title: 'The office move', blocks: [
          SCEN('Moving offices in six weeks', 'Your 40-person team must leave its building in six weeks. Two options are being discussed: a cheaper site 50 minutes further from most staff, and a pricier site close to the current one with a smaller floor area. A third of the team works hybrid. The lease on the cheaper site must be signed in ten days.')] },
        { id: 'a', type: 'fields', title: 'Precision', mode: 'analytical', prompt: 'What do we know, and what do we not?',
          fields: [{ id: 'facts', label: 'Facts', kind: 'list', min: 2 }, { id: 'constraints', label: 'Constraints', kind: 'list', min: 1 }, { id: 'unknowns', label: 'Unknowns and assumptions', kind: 'list', min: 1 }] },
        { id: 'i', type: 'fields', title: 'Insight', mode: 'intuitive', prompt: 'What stands out, and what might we be missing?',
          fields: [{ id: 'stands', label: 'What stands out', kind: 'list', min: 1 }, { id: 'missing', label: 'What we may be missing', kind: 'list', min: 1 }] },
        { id: 'e', type: 'fields', title: 'Expansion', mode: 'associative', prompt: 'What else is possible?',
          fields: [{ id: 'options', label: 'Options beyond the two on the table', kind: 'list', min: 2 }] },
        { id: 'r', type: 'fields', title: 'Evaluation', mode: 'reflective', prompt: 'What could go wrong, and what should we reconsider?',
          fields: [{ id: 'risks', label: 'Risks and weaknesses', kind: 'list', min: 2 }, { id: 'reconsider', label: 'An assumption to reconsider', kind: 'text', long: true }] },
        { id: 'out', type: 'fields', title: 'Outcome', mode: 'integrated', prompt: 'Bring it together.',
          fields: [{ id: 'problem', label: 'The problem, clearly defined', kind: 'text', long: true }, { id: 'direction', label: 'The approach I would choose', kind: 'text', long: true }, { id: 'next', label: 'The next action', kind: 'text' }] },
        { id: 'team', type: 'team', title: 'How your team brought it together', prompt: 'Teammates’ outcomes, without names.', from: 'out', show: 'list' },
        reflectStep('Which mode changed your answer the most?'),
        { id: 'takeaway', type: 'takeaway', title: 'Takeaway', text: 'Each mode added something the others missed. Next, the Thinking Room runs this with the whole team on one shared problem.', next: 'room' }] },
  ];

  // ---------- Team Thinking Room ----------
  const ROOM_SCENARIOS = [
    { id: 'r1', title: 'The Delayed Launch', blurb: 'A flagship feature is three weeks behind and customers have been given the date.',
      text: 'Your team’s flagship feature was due in six weeks and is now three weeks behind plan. Sales has already told two large customers the original date. Engineering says quality will suffer if the date holds. The newest team member has suggested rebuilding one component a different way, which could save time or cost more. Leadership wants a recommendation by Friday.',
      facts: ['Six weeks to the committed date', 'Three weeks behind plan', 'Two large customers have been given the original date', 'Recommendation due Friday'] },
    { id: 'r2', title: 'The Quiet Exit', blurb: 'Fewer people speak up, and two respected colleagues have left.',
      text: 'Over four months, fewer people on your team volunteer in meetings and two respected colleagues have left. Exit conversations were polite and vague. The most recent survey showed no change. One manager says this is normal turnover. Another says something has changed in how decisions are made.',
      facts: ['Two respected colleagues left in four months', 'Exit conversations gave no clear reason', 'Survey results unchanged', 'Meeting participation seems lower but has not been measured'] },
    { id: 'r3', title: 'Two Good Ideas, One Budget', blurb: 'Budget for one initiative, two strong champions.',
      text: 'Your team has budget for one initiative this quarter. One idea would speed up an internal process that frustrates everyone. The other would build a new customer offer that might open a market. Both have strong champions. The numbers for the second are rough estimates.',
      facts: ['Budget covers one initiative', 'Internal process frustrates everyone', 'Customer offer figures are rough estimates', 'Both ideas have strong champions'] },
  ];

  const lf = (id, label, kind, extra) => Object.assign({ id, label, kind: kind || 'list', min: 1 }, extra || {});
  const roundStep = (id, title, mode, prompt, fields) => ({ id, type: 'fields', title, mode, round: true, prompt, fields });

  function roomFlow(sc) {
    return {
      scenario: { title: sc.title, text: sc.text, facts: sc.facts },
      modes: ['analytical', 'intuitive', 'associative', 'reflective', 'integrated'],
      steps: [
        { id: 'brief', type: 'read', title: 'Problem brief', mode: null, blocks: [SCEN(sc.title, sc.text), { t: 'facts', items: sc.facts },
          NOTE('Work through each round on your own and save it. The Integration step brings every contribution together, without names unless the session starter chose otherwise.')] },
        roundStep('a', 'Analytical round', 'analytical', 'Precision: what is actually in front of us?',
          [lf('facts', 'Facts'), lf('constraints', 'Constraints'), lf('risks', 'Risks'), lf('unknowns', 'Unknowns'), lf('assumptions', 'Assumptions'), lf('relevant', 'Other relevant information', 'list', { optional: true })]),
        roundStep('i', 'Intuitive round', 'intuitive', 'Insight: these are perspectives to examine, not conclusions.',
          [lf('stands', 'What immediately stands out'), lf('observations', 'Initial observations', 'list', { optional: true }), lf('signals', 'Possible signals', 'list', { optional: true }), lf('attention', 'What might deserve further attention')]),
        roundStep('e', 'Associative round', 'associative', 'Expansion: widen the field before narrowing it.',
          [lf('solutions', 'Alternative solutions', 'list', { min: 2 }), lf('possibilities', 'New possibilities', 'list', { optional: true }), lf('connections', 'Unexpected connections', 'list', { optional: true }), lf('creative', 'A creative option', 'list', { optional: true })]),
        roundStep('r', 'Reflective round', 'reflective', 'Evaluation: what have we not looked at?',
          [lf('overlooked', 'What may have been overlooked'), lf('assumptions', 'Assumptions that may not hold'), lf('consequences', 'Potential consequences'), lf('weak', 'Weaknesses in the approaches proposed')]),
        { id: 'integrate', type: 'integrate', title: 'Integration', mode: 'integrated', prompt: 'Everything the team contributed, by round. Mark what matters most for the outcome.', rounds: ['a', 'i', 'e', 'r'] },
        { id: 'outcome', type: 'outcome', title: 'Team outcome', mode: 'integrated', record: 'room',
          prompt: 'The session starter or a team owner writes the outcome. Suggestions come from what the team marked as most important.',
          fields: [
            { id: 'problem', label: 'The problem, clearly defined', kind: 'text', long: true },
            { id: 'findings', label: 'Key findings', kind: 'list', min: 1, suggest: ['a.facts', 'a.constraints'] },
            { id: 'alternatives', label: 'Alternatives considered', kind: 'list', min: 1, suggest: ['e.solutions'] },
            { id: 'selected', label: 'Selected approach', kind: 'text', long: true },
            { id: 'risks', label: 'Risks or unresolved questions', kind: 'list', min: 1, suggest: ['r.consequences', 'a.unknowns'] },
            { id: 'next', label: 'Actionable next step', kind: 'text', long: true },
            { id: 'owner', label: 'Who, and by when', kind: 'text' }] },
        reflectStep('What did you see in the team’s thinking that you would not have seen alone?'),
        { id: 'takeaway', type: 'takeaway', title: 'Takeaway', text: 'The outcome is saved for the team. The Decision Lab takes this further with a structured decision and a record you can revisit.', next: 'lab' },
      ],
    };
  }

  // ---------- Team Decision Lab ----------
  const LAB_SCENARIOS = [
    { id: 'd1', title: 'Conflicting Priorities', blurb: 'Two senior stakeholders, opposite instructions, capacity for one.',
      text: 'Two senior stakeholders gave your team opposing instructions in the same week. Finance wants costs cut in this quarter’s plan. The operations director wants a stronger service level for your biggest client, which needs more people. Each says the other’s request puts the business at risk. Your team has capacity for one direction.',
      facts: ['Finance wants costs reduced this quarter', 'Operations wants a stronger service level for the biggest client', 'Capacity for one direction only'] },
    { id: 'd2', title: 'Limited Resources', blurb: 'A 20% cut and three projects that each say they cannot be cut.',
      text: 'A 20% budget reduction has been announced. Three projects are running: a client commitment, an internal tool the team relies on daily, and a skills programme. Each owner says theirs cannot be cut.',
      facts: ['Budget reduced by 20%', 'Three projects running', 'Each owner says theirs cannot be cut'] },
    { id: 'd3', title: 'Incomplete Information', blurb: 'Choose between two suppliers by Thursday with gaps in the data.',
      text: 'You must choose between two suppliers by Thursday. Supplier A is cheaper and has a short track record. Supplier B is established and costs 30% more. Reference checks for A are incomplete and B’s lead time is unconfirmed.',
      facts: ['Decision due Thursday', 'A is cheaper, with a short track record', 'B costs 30% more and is established', 'A’s references are incomplete and B’s lead time is unconfirmed'] },
    { id: 'd4', title: 'Unexpected Change', blurb: 'A key person is leaving and the client has moved the deadline.',
      text: 'Halfway through a major project, your lead developer announces they are leaving in three weeks, and the client brings the deadline forward by a week. The plan you committed to is no longer realistic.',
      facts: ['Lead developer leaves in three weeks', 'Deadline moved forward by one week', 'The committed plan is no longer realistic'] },
  ];

  function labFlow(sc) {
    return {
      scenario: { title: sc.title, text: sc.text, facts: sc.facts },
      modes: ['analytical', 'intuitive', 'associative', 'reflective', 'integrated'],
      steps: [
        roundStep('define', 'DEFINE', 'integrated', 'What problem are we actually solving?',
          [{ id: 'problem', label: 'The problem, in my words', kind: 'text', long: true }, { id: 'affected', label: 'Who is affected, and how?', kind: 'text', long: true }, { id: 'success', label: 'What would a good outcome look like?', kind: 'text', long: true }]),
        roundStep('analyze', 'ANALYZE', 'analytical', 'What do we know? What is uncertain? What are the constraints?',
          [lf('facts', 'What we know'), lf('uncertain', 'What is uncertain'), lf('constraints', 'Constraints'), lf('assumptions', 'Assumptions we are making')]),
        roundStep('sense', 'SENSE', 'intuitive', 'What stands out? What might we be missing?',
          [lf('stands', 'What stands out'), lf('missing', 'What we might be missing')]),
        roundStep('expand', 'EXPAND', 'associative', 'What alternatives exist? What else should we consider?',
          [lf('alternatives', 'Alternatives', 'list', { min: 2 }), lf('others', 'Other possibilities', 'list', { optional: true })]),
        roundStep('reflect', 'REFLECT', 'reflective', 'What assumptions, risks and consequences need reconsidering?',
          [lf('assumptions', 'Assumptions to reconsider'), lf('risks', 'Risks'), lf('consequences', 'Consequences')]),
        { id: 'integrate', type: 'integrate', title: 'INTEGRATE', mode: 'integrated', prompt: 'Combine the thinking into a coherent direction. Mark what matters most.', rounds: ['define', 'analyze', 'sense', 'expand', 'reflect'] },
        { id: 'decide', type: 'outcome', title: 'DECIDE', mode: 'integrated', record: 'lab',
          prompt: 'The session starter or a team owner records the decision. Suggestions come from what the team marked as most important.',
          fields: [
            { id: 'problem', label: 'Problem definition', kind: 'text', long: true },
            { id: 'facts', label: 'Key facts', kind: 'list', min: 1, suggest: ['analyze.facts'] },
            { id: 'assumptions', label: 'Assumptions', kind: 'list', min: 1, suggest: ['analyze.assumptions', 'reflect.assumptions'] },
            { id: 'observations', label: 'Important observations', kind: 'list', min: 1, suggest: ['sense.stands'] },
            { id: 'alternatives', label: 'Alternatives considered', kind: 'list', min: 1, suggest: ['expand.alternatives'] },
            { id: 'risks', label: 'Risks identified', kind: 'list', min: 1, suggest: ['reflect.risks'] },
            { id: 'direction', label: 'Final direction', kind: 'text', long: true },
            { id: 'next', label: 'Next action', kind: 'text', long: true },
            { id: 'owner', label: 'Who, and by when', kind: 'text' },
            { id: 'reflection', label: 'Team reflection: what did the process change about the decision?', kind: 'text', long: true }] },
        reflectStep('What changed in your own thinking during this decision?'),
        { id: 'takeaway', type: 'takeaway', title: 'Takeaway', text: 'The Team Decision Record is saved. Open it any time from the Decision Lab to revisit what the team decided and why.', next: null },
      ],
    };
  }

  // ---------- The pilot path: one ordered journey, mapped to the four weeks ----------
  const PATH = [
    { key: 'assess', kind: 'assessment', week: 1, stage: 1, title: 'Baseline assessment' },
    { key: 'l1', kind: 'lesson', id: 'l1', week: 1, stage: 1 },
    { key: 'l2', kind: 'lesson', id: 'l2', week: 1, stage: 2 },
    { key: 'l3', kind: 'lesson', id: 'l3', week: 2, stage: 3 },
    { key: 'c1', kind: 'challenge', id: 'c1', week: 2, stage: 3 },
    { key: 'l4', kind: 'lesson', id: 'l4', week: 2, stage: 3 },
    { key: 'c2', kind: 'challenge', id: 'c2', week: 2, stage: 3 },
    { key: 'l5', kind: 'lesson', id: 'l5', week: 2, stage: 3 },
    { key: 'c3', kind: 'challenge', id: 'c3', week: 2, stage: 3 },
    { key: 'l6', kind: 'lesson', id: 'l6', week: 2, stage: 3 },
    { key: 'c4', kind: 'challenge', id: 'c4', week: 2, stage: 3 },
    { key: 'room', kind: 'room', week: 3, stage: 4, title: 'Team Thinking Room' },
    { key: 'l7', kind: 'lesson', id: 'l7', week: 3, stage: 4 },
    { key: 'c5', kind: 'challenge', id: 'c5', week: 3, stage: 4 },
    { key: 'l8', kind: 'lesson', id: 'l8', week: 4, stage: 5 },
    { key: 'lab', kind: 'lab', week: 4, stage: 5, title: 'Team Decision Lab' },
  ];

  window.NF_TEAMX_CONTENT = {
    MODES, MODE_ORDER, STAGES, WEEKS, LESSONS, CHALLENGES, ROOM_SCENARIOS, LAB_SCENARIOS, PATH, roomFlow, labFlow,
    byId: (id) => LESSONS.concat(CHALLENGES).find((x) => x.id === id) || null,
  };
})();

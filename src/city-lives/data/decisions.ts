import type { DecisionTemplate, WestsideEvidence } from '../types';

// ── WESTSIDE FILES EVIDENCE ───────────────────────────────────────────────────

export const WESTSIDE_EVIDENCE: WestsideEvidence[] = [
  {
    key: 'dmitri_journal',
    title: 'Dmitri Morozov\'s Journal',
    year: 1972,
    sourceFamily: 'morozov',
    unlockCondition: 'Play Dmitri Morozov or Anton Morozov',
    requiredPlaythroughFamily: 'soul',
    documentText: `February 14, 1972.
Sofia did not come home. I waited. I called the Center. No answer. I walked there. Locked. I asked the neighbors. No one knew.

February 16.
I went to the police. An Officer Webb took my statement. He wrote down everything I said. The car I saw — dark blue, American, a Buick or Oldsmobile. The plate: partial, started with JD7. Two men in the front seat, one I did not recognize, one who looked like city workers I had seen at the meetings.

February 19.
Officer Webb called. He said Sofia had "relocated voluntarily." He said I could pick up my copy of the report. When I went to the station, they said there was no open report.

I know what I saw. I know what kind of car that was. I know the men at those meetings have been coming from the city.

I have written this down because I believe someone must read it someday. I believe the truth does not disappear. I believe Sofia is alive somewhere and that she knows I am looking.

— D.M.`,
    forensicNote: 'Dmitri saw a dark blue American car with plate starting JD7. He identified the passenger as resembling city employees who attended community organizing meetings. This matches the car registered to Greystone Consulting, a firm hired by Caldwell & Associates in 1971.',
    isCollected: false,
  },
  {
    key: 'webb_closed_report',
    title: 'Police Case File #CR-1972-0214',
    year: 1972,
    sourceFamily: 'webb',
    unlockCondition: 'Play James Webb Sr. and make the decision about Sofia\'s case',
    requiredPlaythroughFamily: 'keepers',
    documentText: `CRESTFIELD POLICE DEPARTMENT
CASE FILE #CR-1972-0214
Classification: MISSING PERSON — CLOSED

Date of Report: February 16, 1972
Reporting Officer: Badge #1147, Officer J. Webb
Subject: Morozov, Sofia, F/W, DOB 1930, Westside Community Center

Narrative: Husband (Dmitri Morozov) reports subject missing since approximately 6pm, February 14. Husband states he observed subject enter an unknown vehicle on Westside Ave at approximately 5:45pm, which he describes as dark blue, American make, partial plate JD7. Husband states subject has not returned home and did not contact him.

Witness interview conducted. Husband's account recorded in full. Case opened pending follow-up.

—

February 19, 1972 — CLOSING NOTATION:
Subject located. Relocated voluntarily per personal decision. No criminal matter. Case closed per direction of Capt. E. Harlow, approved.

Officer J. Webb, Badge #1147.
[signature]`,
    forensicNote: 'Captain Harlow, who gave the order to close this case, reported directly to Deputy Mayor Franklin Birch — brother of Mayor Harold Birch, who was installed through Caldwell support in 1968. The case was closed without any verification that Sofia had relocated willingly.',
    isCollected: false,
  },
  {
    key: 'wei_signature',
    title: 'Housing Authority Demolition Approval',
    year: 1972,
    sourceFamily: 'chen',
    unlockCondition: 'Play Wei Chen through 1972',
    requiredPlaythroughFamily: 'pragmatists',
    documentText: `CITY OF CRESTFIELD — HOUSING AUTHORITY
Urban Renewal Project CR-72
Demolition Authorization — FINAL APPROVAL

Project: Westside Neighborhood Renewal
Developer: Caldwell Development Partners LLC
Estimated Displaced Families: 340

This authorization has been reviewed and approved by the following officials:

Director of Planning: M. Hartley [signature]
City Solicitor: R. Pemberton [signature]
Deputy Director of Housing: Wei Chen [signature]

Approved April 4, 1972.
All demolition activities to commence upon issuance of permits by the Office of Buildings.

Note: Relocation assistance fund approved at $1.2 million total (approximately $3,500 per family average). Final distribution to be managed by Caldwell Development Partners.

[CITY SEAL]`,
    forensicNote: 'Wei Chen signed this document under documented pressure. City records show that prior to his appointment, his wife\'s immigration status review had been flagged by a connected office — the same office managed by a Caldwell-linked appointee. The "affiliated partners" managing relocation funds was Caldwell Development itself.',
    isCollected: false,
  },
  {
    key: 'ida_diary',
    title: 'Ida Washington\'s Diary, 1945–1955',
    year: 1955,
    sourceFamily: 'washington',
    unlockCondition: 'Play Gloria Washington and find the box in the attic',
    requiredPlaythroughFamily: 'witnesses',
    documentText: `October 14, 1948.
Mr. Henry had a man here from the port union. Long talk behind closed doors. The man left with an envelope. I could feel the weight of it when I carried the drinks in. Mr. Henry was in very good spirits after.

March 6, 1955.
Young Mr. William had his political friends here again. One of them, a Mr. Harlow, talked about the neighborhoods by the port like they were something that needed removing. I heard the word "opportunity" used in a way I have heard before when men talk about places where poor people live. It means someone will lose something. I don't know who yet.

February 18, 1972.
[This entry is in shakier handwriting than the others.]
They said on the radio that the woman from the community center is missing. I know that name — Sofia Morozov. I have seen her name in the papers the men bring here. One time I heard Mr. William say to Mr. Harlow: "that woman is going to be a problem."

I don't know what happened. I don't know if what I heard means what I think it means. I am 72 years old and I am afraid of what I think I know. I have written this down. I don't know what I will do with it.

— I.W.`,
    forensicNote: 'Ida overheard William Caldwell describe Sofia Morozov as "a problem" in conversation with Harlow — the same Captain Harlow who ordered Webb to close the missing person case. This places the Caldwell family\'s awareness of Sofia weeks before her disappearance.',
    isCollected: false,
  },
  {
    key: 'margaret_journal',
    title: 'Margaret Caldwell\'s 1971 Journal',
    year: 1971,
    sourceFamily: 'caldwell',
    unlockCondition: 'Play Margaret Caldwell through 1971',
    requiredPlaythroughFamily: 'founders',
    documentText: `November 3, 1971.
I attended a community meeting tonight — one of the neighborhood planning sessions Father has been trying to close down. I went out of curiosity. I don't entirely know why.

The woman who runs the center spoke for most of the meeting. Sofia Morozov. She was... extraordinary. She translated for three different people in the room — Ukrainian, Spanish, something else I didn't recognize. She knew everyone by name. She was the calmest person in a room full of frightened people.

After the meeting I spoke with her briefly. I told her my name — only my first name. I don't think she knew who I was. She shook my hand. She said: "The city belongs to the people who built it." I think she meant the neighborhood. I think she meant something larger.

I came home and Father was having dinner with two men I don't know. I didn't stay.

I've been thinking about that handshake. I don't know why I keep thinking about it.`,
    forensicNote: 'Margaret met Sofia three months before her disappearance. The two men at dinner that night were later identified in Caldwell business records as representatives of Greystone Consulting — the firm paid $15,000 in connection with Sofia\'s disappearance.',
    isCollected: false,
  },
  {
    key: 'reyes_contract',
    title: 'Reyes Family Relocation Agreement',
    year: 1973,
    sourceFamily: 'reyes',
    unlockCondition: 'Play Roberto Reyes and decide whether to tell Ana about the agreement',
    requiredPlaythroughFamily: 'builders',
    documentText: `RELOCATION AGREEMENT
Crestfield Urban Renewal Project CR-72

Between: Caldwell Development Partners LLC ("Developer")
And: Reyes Bakery, Esperanza Reyes, Owner ("Resident")

Property: [Address redacted], Westside District

In consideration of the sum of $40,000 (forty thousand dollars), the receipt and sufficiency of which is hereby acknowledged, the Resident agrees to:

1. Vacate the above property by March 15, 1973.
2. Transfer all property rights to the Developer.
3. Make no public statements regarding the terms of this agreement.
4. Section 7(b): The undersigned agrees to make no public statements, representations, or disclosures regarding the terms of this agreement, the circumstances of the relocation, or any knowledge the undersigned may have regarding related activities of the City of Crestfield or its affiliated partners, past or present.

The Developer agrees to provide relocation assistance in the amount stated above.

Signed: Esperanza Reyes [signature, February 28, 1973]
Witnessed: [Caldwell & Associates notary]`,
    forensicNote: 'The standard relocation payment was approximately $12,000-15,000. Esperanza received $40,000. Section 7(b) — the silence clause — does not appear in any other relocation agreement from the same project, suggesting it was specific to her. She had been a close associate of Sofia Morozov\'s.',
    isCollected: false,
  },
];

// ── DECISION TEMPLATES ────────────────────────────────────────────────────────

export const DECISION_TEMPLATES: DecisionTemplate[] = [
  // ── WESTSIDE FILES — EVIDENCE DECISIONS ──────────────────────────────────────

  {
    key: 'webb_close_sofia_case',
    lifeStages: ['adult'],
    category: 'loyalty_vs_integrity',
    locationTypes: ['workplace'],
    condition: (c) => c.id === 'james_webb_sr',
    prompt: 'Captain Harlow calls you into his office. He tells you to close the Sofia Morozov missing persons case. "She moved on," he says. "Don\'t make it complicated." His expression makes clear this is not a request.',
    contextTemplate: 'You took Dmitri Morozov\'s statement two days ago. You wrote down everything — the car, the plate, the description. You filed it properly. You believe the man. And now your captain is telling you to close it.',
    isEvidenceDecision: true,
    evidenceKey: 'webb_closed_report',
    options: [
      {
        label: 'Close the case',
        description: 'Sign the closure notation. Keep your job. Protect your family.',
        outcomes: {
          wealthDelta: 0,
          reputationDelta: -15,
          relationshipEffects: [
            { citizenId: 'dmitri_morozov', strengthDelta: -50, typeChange: 'acquaintance' },
          ],
          careerEffect: undefined,
          narrativeResult: 'You sign the notation. "Subject relocated voluntarily." You tell yourself you had no choice. That is probably true. You will think about this for the rest of your life.',
          rippleSeeds: [
            {
              targetCitizenId: 'james_webb_jr',
              delayYears: 10,
              impactType: 'reputation_damage',
              impactMagnitude: -30,
              narrativeTemplate: 'James Webb Jr. learned, slowly and in pieces, that his father had closed a case he shouldn\'t have. He never confronted him about it. But it shaped what loyalty meant to him.',
              evidenceKey: 'webb_closed_report',
            },
            {
              targetCitizenId: 'denise_webb',
              delayYears: 25,
              impactType: 'career_opportunity',
              impactMagnitude: 60,
              narrativeTemplate: 'Denise Webb became a public defender in part because of a vague sense that her family\'s history with the law required correction. She never knew exactly what her grandfather had done.',
            },
          ],
        },
      },
      {
        label: 'Refuse to close it',
        description: 'Tell Harlow the case isn\'t done. Risk everything.',
        outcomes: {
          wealthDelta: -20,
          reputationDelta: 20,
          relationshipEffects: [
            { citizenId: 'dmitri_morozov', strengthDelta: 30 },
          ],
          careerEffect: { title: 'Officer (demoted)' },
          narrativeResult: 'You tell Harlow no. By the end of the week, you\'re on administrative review. Six months later, you\'re offered early retirement. You take it. You never found Sofia. But you have the notes.',
          rippleSeeds: [
            {
              targetCitizenId: 'james_webb_jr',
              delayYears: 10,
              impactType: 'reputation_boost',
              impactMagnitude: 40,
              narrativeTemplate: 'James Webb Jr. knew his father had refused to close a case once, and lost his career for it. He spent his whole career trying to understand how to honor that and still survive inside the institution.',
            },
            {
              targetCitizenId: 'dmitri_morozov',
              delayYears: 1,
              impactType: 'career_opportunity',
              impactMagnitude: 30,
              narrativeTemplate: 'Webb\'s refusal gave Dmitri Morozov one more year of believing the system might help him. He continued searching.',
            },
          ],
        },
      },
    ],
  },

  {
    key: 'esperanza_sign_relocation',
    lifeStages: ['adult', 'elder'],
    category: 'survival_vs_solidarity',
    locationTypes: ['home'],
    condition: (c) => c.id === 'esperanza_reyes',
    prompt: 'The relocation offer is $40,000 — three times the standard rate. The Caldwell representative is pleasant, professional. He explains that the standard rate is $12,000. He doesn\'t explain why yours is different. Page three, section 7(b), is a silence clause.',
    contextTemplate: 'You have four children. You have no savings. Sofia is gone. The neighborhood is going either way. You could fight — Ana is young, she doesn\'t understand what fighting costs. Roberto has never asked for anything from you. You have $200 in a coffee tin.',
    isEvidenceDecision: true,
    evidenceKey: 'reyes_contract',
    options: [
      {
        label: 'Sign it',
        description: 'Take the money. Keep your children safe. Keep quiet.',
        outcomes: {
          wealthDelta: 40,
          reputationDelta: -5,
          relationshipEffects: [
            { citizenId: 'roberto_reyes', strengthDelta: 10 },
          ],
          narrativeResult: 'You sign. You fold the agreement and put it in an envelope. You never open it again. You move to East Flats. You open a smaller bakery. The pan dulce is the same. You never tell anyone what was in section 7(b).',
          rippleSeeds: [
            {
              targetCitizenId: 'roberto_reyes',
              delayYears: 28,
              impactType: 'family_event',
              impactMagnitude: -40,
              narrativeTemplate: 'Roberto found the relocation agreement when his mother died. He read it twice. He put it back. He spent the rest of his life carrying what she had carried, without telling his children why.',
              evidenceKey: 'reyes_contract',
            },
            {
              targetCitizenId: 'ana_reyes',
              delayYears: 30,
              impactType: 'career_opportunity',
              impactMagnitude: 70,
              narrativeTemplate: 'Ana Reyes became a civil rights attorney in part because of something she sensed in her father\'s silences. She fights displacement cases without knowing her grandmother signed away the right to talk about the one that shaped her family.',
            },
          ],
        },
      },
      {
        label: 'Refuse to sign',
        description: 'Stay. Fight. Not knowing what it will cost.',
        outcomes: {
          wealthDelta: -5,
          reputationDelta: 25,
          relationshipEffects: [
            { citizenId: 'roberto_reyes', strengthDelta: -10 },
            { citizenId: 'sofia_morozov', strengthDelta: 20 },
          ],
          narrativeResult: 'You don\'t sign. Six months later, the eviction notice comes anyway. It\'s legal. You fought the legal way and the legal way lost. You move with nothing. But you talked. People know what you knew.',
          rippleSeeds: [
            {
              targetCitizenId: 'ana_reyes',
              delayYears: 28,
              impactType: 'reputation_boost',
              impactMagnitude: 50,
              narrativeTemplate: 'Ana Reyes grew up knowing her grandmother had refused to be silenced. It shaped what kind of lawyer she became.',
            },
            {
              targetCitizenId: 'rosa_reyes',
              delayYears: 50,
              impactType: 'career_opportunity',
              impactMagnitude: 80,
              narrativeTemplate: 'Rosa Reyes inherited her great-grandmother\'s defiance. When she found the Westside thread, she recognized the pattern. She understood what the silence clause meant because she had heard the story of refusing to sign one.',
              evidenceKey: 'reyes_contract',
            },
          ],
        },
      },
    ],
  },

  {
    key: 'wei_sign_demolition',
    lifeStages: ['adult'],
    category: 'complicity_vs_consequence',
    locationTypes: ['workplace', 'power_center'],
    condition: (c) => c.id === 'wei_chen',
    prompt: 'The demolition authorization is on your desk. Your supervisor has made it clear: the Deputy Mayor\'s office expects your signature today. And someone from the city\'s immigration office called about your wife\'s review — a "courtesy call." The call did not mention the authorization. It didn\'t need to.',
    contextTemplate: 'You have friends in Westside. Esperanza Reyes makes the best tamales you have ever eaten. You know the families who will lose their homes. You also know what an immigration enforcement action looks like, and what it would do to your wife and your daughter.',
    isEvidenceDecision: true,
    evidenceKey: 'wei_signature',
    options: [
      {
        label: 'Sign the authorization',
        description: 'Protect your family. Carry this privately.',
        outcomes: {
          wealthDelta: 5,
          reputationDelta: -20,
          relationshipEffects: [
            { citizenId: 'esperanza_reyes', strengthDelta: -60, typeChange: 'acquaintance' },
            { citizenId: 'helen_chen', strengthDelta: -10 },
          ],
          narrativeResult: 'You sign. The demolition is approved. You keep your position for another year before quietly resigning. In 1987, you burn your copy of the authorization. You don\'t know the city kept another one.',
          rippleSeeds: [
            {
              targetCitizenId: 'helen_chen',
              delayYears: 26,
              impactType: 'family_event',
              impactMagnitude: -50,
              narrativeTemplate: 'Helen Chen built her restaurant chain believing everything was earned clean. She never knew about the authorization her father signed. The not-knowing is its own kind of wound.',
              evidenceKey: 'wei_signature',
            },
            {
              targetCitizenId: 'maya_chen',
              delayYears: 49,
              impactType: 'reputation_damage',
              impactMagnitude: -30,
              narrativeTemplate: 'Maya Chen was mapping displaced Crestfield neighborhoods for her thesis when she found a demolition authorization with her grandfather\'s signature.',
            },
          ],
        },
      },
      {
        label: 'Refuse to sign',
        description: 'Accept the consequences. Tell someone what\'s happening.',
        outcomes: {
          wealthDelta: -30,
          reputationDelta: 30,
          relationshipEffects: [
            { citizenId: 'esperanza_reyes', strengthDelta: 20 },
            { citizenId: 'sofia_morozov', strengthDelta: 15 },
          ],
          careerEffect: { title: 'Housing Official (fired)' },
          narrativeResult: 'You refuse. Within a week, your wife\'s immigration review is escalated. You spend two years fighting it. You win, eventually, at significant cost. The demolition goes ahead anyway. But you told Sofia what was coming, and she had time to organize.',
          rippleSeeds: [
            {
              targetCitizenId: 'sofia_morozov',
              delayYears: 0,
              impactType: 'career_opportunity',
              impactMagnitude: 40,
              narrativeTemplate: 'Wei Chen warned Sofia Morozov before resigning. She had three more weeks to document the evidence of election fraud before the city moved against her.',
            },
          ],
        },
      },
    ],
  },

  {
    key: 'margaret_meet_sofia',
    lifeStages: ['youth', 'adult'],
    category: 'truth_vs_protection',
    locationTypes: ['neighborhood', 'cultural'],
    condition: (c) => c.id === 'margaret_caldwell',
    prompt: 'You attended a community meeting in Westside. You shouldn\'t have been there — your father would be furious. But the woman who ran it, Sofia Morozov, spoke with you briefly after. She shook your hand and said: "The city belongs to the people who built it." Coming home, you find your father dining with two men you don\'t recognize.',
    contextTemplate: 'You are seventeen years old and you have just met the most compelling person you have ever spoken to. You also know something is wrong with the men at your father\'s dinner table. You have a choice: ask your father about them, or pretend you didn\'t see.',
    isEvidenceDecision: true,
    evidenceKey: 'margaret_journal',
    options: [
      {
        label: 'Ask your father about the dinner guests',
        description: 'You might learn something. You might also lose something.',
        outcomes: {
          wealthDelta: 0,
          reputationDelta: -5,
          relationshipEffects: [
            { citizenId: 'william_caldwell', strengthDelta: -15 },
          ],
          narrativeResult: 'Your father says they\'re business consultants. He asks where you\'ve been. When you say Westside, his expression changes. He doesn\'t raise his voice. He explains, very calmly, that you should stay away from those meetings. You write down what you saw in your journal.',
          rippleSeeds: [
            {
              targetCitizenId: 'oliver_caldwell',
              delayYears: 34,
              impactType: 'family_event',
              impactMagnitude: -40,
              narrativeTemplate: 'Margaret Caldwell left a journal that her son Oliver eventually read. In it, she described two men at his grandfather\'s table in 1971. Their names matched names in the Westside files.',
              evidenceKey: 'margaret_journal',
            },
          ],
        },
      },
      {
        label: 'Say nothing — go to your room',
        description: 'Preserve the peace. Keep what you felt private.',
        outcomes: {
          wealthDelta: 0,
          reputationDelta: 5,
          relationshipEffects: [
            { citizenId: 'william_caldwell', strengthDelta: 5 },
          ],
          narrativeResult: 'You go upstairs. You write in your journal about Sofia Morozov. You don\'t write about the men. You tell yourself it was nothing. For fifty years, you think about that handshake and don\'t know why.',
          rippleSeeds: [
            {
              targetCitizenId: 'oliver_caldwell',
              delayYears: 34,
              impactType: 'reputation_damage',
              impactMagnitude: -20,
              narrativeTemplate: 'Oliver Caldwell found his mother\'s journal. She had written about meeting Sofia Morozov. She had not written about the men at dinner. That absence told him something.',
            },
          ],
        },
      },
    ],
  },

  // ── UNIVERSAL DECISION TEMPLATES ─────────────────────────────────────────────

  {
    key: 'mentor_offer',
    lifeStages: ['adult'],
    category: 'community_vs_ambition',
    locationTypes: ['workplace', 'neighborhood'],
    condition: (c, w) => (c.wealthTier >= 2 || c.reputationScore > 40) && !w.completedPlaythroughIds.includes(c.id),
    prompt: 'A young person from the neighborhood asks if you\'d mentor them — show them how you built what you built. They remind you of yourself at that age. You\'re busy. You\'re always busy.',
    contextTemplate: 'You know what it took to get where you are. You also know that no one helped you, and you\'ve thought about that. The question is whether you think about it long enough to do something different.',
    options: [
      {
        label: 'Take them on',
        description: 'Your time, their future. Make room.',
        outcomes: {
          wealthDelta: -5,
          reputationDelta: 15,
          relationshipEffects: [{ citizenId: 'nearest_family', strengthDelta: -5 }],
          narrativeResult: 'You become someone\'s reason. It costs you. It also changes what you\'re building and why.',
          rippleSeeds: [
            {
              targetCitizenId: 'nearest_family',
              delayYears: 8,
              impactType: 'career_opportunity',
              impactMagnitude: 65,
              narrativeTemplate: 'Years of mentorship from {sourceName} changed {targetName}\'s trajectory. They got the job, or took the chance, because someone believed in them first.',
            },
          ],
        },
      },
      {
        label: 'Decline — not the right time',
        description: 'Be honest. You don\'t have the space right now.',
        outcomes: {
          wealthDelta: 5,
          reputationDelta: -8,
          relationshipEffects: [],
          narrativeResult: 'You tell them it\'s not the right time. You mean to come back to it. Life doesn\'t always give you the second chance.',
          rippleSeeds: [
            {
              targetCitizenId: 'nearest_family',
              delayYears: 5,
              impactType: 'career_setback',
              impactMagnitude: -35,
              narrativeTemplate: 'Without someone to show them the way, {targetName} found a harder path. The setback wasn\'t fatal. But they remember the door that didn\'t open.',
            },
          ],
        },
      },
    ],
  },

  {
    key: 'inheritance_decision',
    lifeStages: ['elder'],
    category: 'truth_vs_protection',
    locationTypes: ['home'],
    condition: (c) => c.wealthTier >= 2 && (c.deathYear === null || c.deathYear >= 0),
    prompt: 'You are getting older. You have a decision to make about what you leave behind — and what you leave out. There are things your children don\'t know. Some of them would hurt. Some of them would change everything.',
    contextTemplate: 'Every family has a version of itself it presents and a version it actually is. You have been the keeper of the gap between them. It is time to decide who holds it next.',
    options: [
      {
        label: 'Tell them the truth — all of it',
        description: 'Let them carry the real story, not the edited one.',
        outcomes: {
          wealthDelta: 0,
          reputationDelta: 10,
          relationshipEffects: [{ citizenId: 'nearest_family', strengthDelta: -20 }],
          narrativeResult: 'The conversation is hard. The relationship survives it, but differently. Your children are angry at first. Then they understand. Then they don\'t know what to do with what they know. That is their life now.',
          rippleSeeds: [
            {
              targetCitizenId: 'nearest_family',
              delayYears: 2,
              impactType: 'family_event',
              impactMagnitude: -30,
              narrativeTemplate: '{sourceName}\'s final truth-telling arrived in {targetName}\'s life like a stone in still water. Everything rippled outward from it.',
            },
          ],
        },
      },
      {
        label: 'Protect them — take it with you',
        description: 'Some things don\'t need to be passed down.',
        outcomes: {
          wealthDelta: 0,
          reputationDelta: -5,
          relationshipEffects: [{ citizenId: 'nearest_family', strengthDelta: 10 }],
          narrativeResult: 'You keep the silence. Your children mourn you cleanly, without complication. Years later, something surfaces anyway — it always does — and they have no context for it.',
          rippleSeeds: [
            {
              targetCitizenId: 'nearest_family',
              delayYears: 10,
              impactType: 'family_event',
              impactMagnitude: -50,
              narrativeTemplate: 'Years after {sourceName} died, {targetName} found something that reframed everything. There was no one left to ask.',
            },
          ],
        },
      },
    ],
  },

  {
    key: 'expose_corruption',
    lifeStages: ['adult'],
    category: 'complicity_vs_consequence',
    locationTypes: ['workplace', 'power_center'],
    condition: (c) => c.reputationScore > 30 && (c.currentCareer?.title.includes('Police') || c.currentCareer?.title.includes('Attorney') || c.currentCareer?.title.includes('Reporter') || c.currentCareer?.title.includes('Council')),
    prompt: 'You\'ve found something. It\'s real, it\'s documented, and it implicates someone powerful. Going public will end your career in this city. Not going public means it continues.',
    contextTemplate: 'You\'ve been careful your whole career. You\'ve known that being careful is how you survive in a city like this. And now you\'re sitting with something that makes being careful feel like choosing a side.',
    options: [
      {
        label: 'Go public',
        description: 'Put it out there. Whatever happens next, happens.',
        outcomes: {
          wealthDelta: -25,
          reputationDelta: 35,
          relationshipEffects: [{ citizenId: 'nearest_colleague', strengthDelta: -20 }, { citizenId: 'nearest_family', strengthDelta: -15 }],
          careerEffect: { title: 'Former [role] — currently unemployed' },
          narrativeResult: 'You publish. You lose the job. Half the city believes you. The powerful half doesn\'t. It matters anyway — it always matters, even when it doesn\'t seem to.',
          rippleSeeds: [
            {
              targetCitizenId: 'nearest_family',
              delayYears: 3,
              impactType: 'reputation_boost',
              impactMagnitude: 50,
              narrativeTemplate: '{sourceName} risked everything to tell the truth. {targetName} grew up in a family where truth-telling had a cost and also a meaning.',
            },
            {
              targetCitizenId: 'nearest_colleague',
              delayYears: 1,
              impactType: 'career_opportunity',
              impactMagnitude: 40,
              narrativeTemplate: 'The information {sourceName} published gave {targetName} the thread they needed to pursue their own investigation.',
            },
          ],
        },
      },
      {
        label: 'Stay quiet — for now',
        description: 'Keep the information. Wait for a better moment.',
        outcomes: {
          wealthDelta: 5,
          reputationDelta: -20,
          relationshipEffects: [],
          narrativeResult: 'You wait. The better moment doesn\'t quite arrive. You move the information to a safer place. You carry it. Years later, someone else publishes it, and you are relieved and haunted simultaneously.',
          rippleSeeds: [
            {
              targetCitizenId: 'nearest_colleague',
              delayYears: 8,
              impactType: 'career_opportunity',
              impactMagnitude: 55,
              narrativeTemplate: 'The information {sourceName} never published eventually found its way to {targetName} through a different path. It cost more years. More people were hurt in the gap.',
            },
          ],
        },
      },
    ],
  },

  {
    key: 'leave_or_stay',
    lifeStages: ['youth', 'adult'],
    category: 'community_vs_ambition',
    locationTypes: ['home', 'meeting_place'],
    condition: (c) => c.reputationScore >= 0 && c.currentCareer !== null,
    prompt: 'There\'s an opportunity — a real one, somewhere else. Better pay, more room to grow, a different future. Taking it means leaving. Staying means being here for what happens next.',
    contextTemplate: 'You have roots here. Some of them are nourishing and some of them are holding you down, and you\'re not always sure which is which.',
    options: [
      {
        label: 'Take the opportunity — leave',
        description: 'You can\'t give what you don\'t have. Go build something first.',
        outcomes: {
          wealthDelta: 20,
          reputationDelta: -10,
          relationshipEffects: [{ citizenId: 'nearest_family', strengthDelta: -20 }],
          narrativeResult: 'You leave. You build what you set out to build. You send money back when you can. The distance teaches you what you had. You come back eventually — the city never fully releases its own.',
          rippleSeeds: [
            {
              targetCitizenId: 'nearest_family',
              delayYears: 5,
              impactType: 'wealth_loss',
              impactMagnitude: -30,
              narrativeTemplate: 'When {sourceName} left, {targetName} had to manage alone. It hardened them. It also opened a space that a different relationship eventually filled.',
            },
          ],
        },
      },
      {
        label: 'Stay',
        description: 'The opportunity will come again. Or it won\'t. This place needs what you have now.',
        outcomes: {
          wealthDelta: -10,
          reputationDelta: 20,
          relationshipEffects: [{ citizenId: 'nearest_family', strengthDelta: 15 }],
          narrativeResult: 'You stay. You give something you can\'t measure and can\'t get back. You also become the person someone else\'s story couldn\'t happen without.',
          rippleSeeds: [
            {
              targetCitizenId: 'nearest_family',
              delayYears: 3,
              impactType: 'career_opportunity',
              impactMagnitude: 50,
              narrativeTemplate: 'Because {sourceName} stayed, {targetName} had someone in their corner when it mattered. That shaped what they thought was possible.',
            },
          ],
        },
      },
    ],
  },

  {
    key: 'forgive_or_not',
    lifeStages: ['adult', 'elder'],
    category: 'forgiveness_vs_accountability',
    locationTypes: ['home', 'meeting_place'],
    condition: (c) => c.reputationScore > 20,
    prompt: 'The person who caused you — your family — real harm is asking for something. Help. Forgiveness. A conversation. They\'re older now. Some of what they did, they may not fully understand. Some of it they understood completely.',
    contextTemplate: 'Accountability and forgiveness are not the same thing. You\'ve known that intellectually your whole life. Now you have to decide which one you actually believe in.',
    options: [
      {
        label: 'Offer what you can — which may not be forgiveness yet',
        description: 'Meet them. See what it is. Reserve judgment.',
        outcomes: {
          wealthDelta: 0,
          reputationDelta: 5,
          relationshipEffects: [{ citizenId: 'nearest_colleague', strengthDelta: 15 }],
          narrativeResult: 'The conversation is not what you expected. Neither of you leaves whole. But something shifts. It doesn\'t resolve anything. It doesn\'t have to.',
          rippleSeeds: [
            {
              targetCitizenId: 'nearest_family',
              delayYears: 2,
              impactType: 'family_event',
              impactMagnitude: 35,
              narrativeTemplate: '{sourceName}\'s choice to meet the person who hurt them modeled something for {targetName} about what accountability actually looks like.',
            },
          ],
        },
      },
      {
        label: 'No — they don\'t get that from you',
        description: 'Accountability first. Forgiveness is earned, not owed.',
        outcomes: {
          wealthDelta: 0,
          reputationDelta: 10,
          relationshipEffects: [{ citizenId: 'nearest_colleague', strengthDelta: -10 }],
          narrativeResult: 'You don\'t go. You have reasons. They\'re good reasons. The door stays closed. Whether that was right depends on who you ask.',
          rippleSeeds: [
            {
              targetCitizenId: 'nearest_family',
              delayYears: 5,
              impactType: 'family_event',
              impactMagnitude: -20,
              narrativeTemplate: '{sourceName}\'s refusal to reconcile became part of the family\'s story. {targetName} inherited a grievance that wasn\'t theirs, and had to decide what to do with it.',
            },
          ],
        },
      },
    ],
  },

  {
    key: 'business_ethics',
    lifeStages: ['adult'],
    category: 'survival_vs_solidarity',
    locationTypes: ['workplace'],
    condition: (c) => c.currentCareer?.title.includes('Owner') || c.currentCareer?.title.includes('Developer') || c.currentCareer?.title.includes('Partner'),
    prompt: 'You can get this deal done. It\'s profitable and it\'s legal. But you know what it does to the people on the other end of it. You\'ve told yourself that\'s business. You\'re telling yourself that again right now.',
    contextTemplate: 'Money doesn\'t remember where it came from. That\'s its power. You\'ve always known this. The question is whether that\'s the kind of power you want.',
    options: [
      {
        label: 'Do the deal',
        description: 'Keep building. Trust that the benefits trickle down.',
        outcomes: {
          wealthDelta: 35,
          reputationDelta: -15,
          relationshipEffects: [{ citizenId: 'nearest_colleague', strengthDelta: 10 }],
          narrativeResult: 'The deal closes. The numbers look good. The people on the other end find other arrangements. You don\'t follow up on how they did.',
          rippleSeeds: [
            {
              targetCitizenId: 'nearest_colleague',
              delayYears: 10,
              impactType: 'wealth_loss',
              impactMagnitude: -45,
              narrativeTemplate: 'The deal {sourceName} made displaced {targetName}\'s community. {targetName} rebuilt. They never forgot what it cost.',
            },
          ],
        },
      },
      {
        label: 'Walk away from this one',
        description: 'Pass on this deal. Explain why to your partners.',
        outcomes: {
          wealthDelta: -15,
          reputationDelta: 25,
          relationshipEffects: [{ citizenId: 'nearest_colleague', strengthDelta: -15 }],
          narrativeResult: 'You walk away. Your partners are disappointed. Some of them don\'t come back. You live with the financial consequences. You also live with something else — a sense that you are still who you meant to be.',
          rippleSeeds: [
            {
              targetCitizenId: 'nearest_colleague',
              delayYears: 8,
              impactType: 'career_opportunity',
              impactMagnitude: 40,
              narrativeTemplate: '{sourceName}\'s refusal to do the deal created a gap that {targetName} eventually filled with something better.',
            },
          ],
        },
      },
    ],
  },

  {
    key: 'ida_document_or_silent',
    lifeStages: ['elder'],
    category: 'truth_vs_protection',
    locationTypes: ['home'],
    condition: (c) => c.id === 'ida_washington',
    prompt: 'You\'ve worked in that house for thirty-five years. You\'ve seen things. You\'ve written them in the diary — the envelope, the men, the meetings, the name Sofia. You could show it to Thomas. You could leave it somewhere safe. Or you could burn it.',
    contextTemplate: 'You are protecting your children. You have always been protecting your children. But Thomas is grown now, and he is fighting the same people you saw in that dining room, and he doesn\'t know what you know.',
    isEvidenceDecision: true,
    evidenceKey: 'ida_diary',
    options: [
      {
        label: 'Leave the diary where Thomas can find it',
        description: 'Let the truth survive you.',
        outcomes: {
          wealthDelta: 0,
          reputationDelta: 20,
          relationshipEffects: [{ citizenId: 'thomas_washington', strengthDelta: 20 }],
          narrativeResult: 'You leave the diary in the attic in an unlabeled box. You don\'t tell Thomas about it. You hope he finds it. You hope whoever finds it will know what to do.',
          rippleSeeds: [
            {
              targetCitizenId: 'gloria_washington',
              delayYears: 20,
              impactType: 'evidence_revealed',
              impactMagnitude: 80,
              narrativeTemplate: 'Gloria Washington found her mother\'s diary in the attic. She read what Ida had seen. She finally understood why her mother had kept certain silences.',
              evidenceKey: 'ida_diary',
            },
          ],
        },
      },
      {
        label: 'Burn it — protect the family',
        description: 'Knowing this has never been safe for people like us.',
        outcomes: {
          wealthDelta: 0,
          reputationDelta: -10,
          relationshipEffects: [],
          narrativeResult: 'You burn the diary. You watch thirty years of watching go up in smoke. You tell yourself it\'s safer this way. Maybe it is. The truth finds other paths, slower ones.',
          rippleSeeds: [
            {
              targetCitizenId: 'zara_washington',
              delayYears: 55,
              impactType: 'career_setback',
              impactMagnitude: -30,
              narrativeTemplate: 'Zara Washington followed the Westside thread without the diary. She got close. The missing piece cost her two more years.',
            },
          ],
        },
      },
    ],
  },

  // ── 2024 VOTE DECISIONS ───────────────────────────────────────────────────────

  {
    key: 'keisha_vote_2024',
    lifeStages: ['adult'],
    category: 'loyalty_vs_integrity',
    locationTypes: ['power_center'],
    condition: (c, w) => c.id === 'keisha_washington' && w.currentYear >= 2024,
    prompt: 'The New Westside development vote is today. Your seat on the council was made possible, in part, by Caldwell support you didn\'t fully understand at the time. You understand it now. The cameras are on you.',
    contextTemplate: 'A yes vote saves your political future. A no vote honors every family that was displaced from the original Westside — including your own. A conditional yes could theoretically protect some residents. The developer\'s attorneys have already told you that "conditional approval" language will be removed before implementation.',
    options: [
      {
        label: 'Vote No — hold the line',
        description: 'This neighborhood will not be the second Westside. Not on your vote.',
        outcomes: {
          wealthDelta: -10,
          reputationDelta: 40,
          relationshipEffects: [{ citizenId: 'oliver_caldwell', strengthDelta: -50, typeChange: 'rival' }],
          careerEffect: { title: 'City Councilwoman (term uncertain)' },
          narrativeResult: 'You vote no. The room is loud for a long time. Your phone doesn\'t stop. You don\'t check who\'s calling. Outside, on the steps, someone holds up a sign with the name of the original Westside street.',
          rippleSeeds: [
            {
              targetCitizenId: 'zara_washington',
              delayYears: 0,
              impactType: 'reputation_boost',
              impactMagnitude: 70,
              narrativeTemplate: 'When Councilwoman Washington voted no, Zara Washington was in the gallery. She had been there for every session. This was the vote that told her what the city could still be.',
            },
            {
              targetCitizenId: 'oliver_caldwell',
              delayYears: 0,
              impactType: 'reputation_damage',
              impactMagnitude: -40,
              narrativeTemplate: 'Oliver Caldwell watched the vote fail. For the first time, he thought about the archive in the basement.',
            },
          ],
        },
      },
      {
        label: 'Vote Yes with conditions',
        description: 'Negotiate what you can. Protect what you can protect.',
        outcomes: {
          wealthDelta: 5,
          reputationDelta: -20,
          relationshipEffects: [{ citizenId: 'gloria_washington', strengthDelta: -30 }],
          narrativeResult: 'The conditions are removed in committee. You knew they would be. You told yourself it was the pragmatic choice. Darnell Washington doesn\'t answer your calls anymore.',
          rippleSeeds: [
            {
              targetCitizenId: 'darnell_washington',
              delayYears: 0,
              impactType: 'reputation_damage',
              impactMagnitude: -35,
              narrativeTemplate: 'Darnell Washington painted over his latest mural the week after the vote. He said it wasn\'t what he thought it was anymore.',
            },
          ],
        },
      },
    ],
  },
];

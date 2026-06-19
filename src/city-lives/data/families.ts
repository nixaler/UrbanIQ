import type { Citizen, Family, LifeStage, Relationship, WealthTier } from '../types';

// ── THE SIX FAMILIES OF CRESTFIELD ────────────────────────────────────────────

export const FAMILIES: Family[] = [
  {
    id: 'caldwell',
    familyName: 'Caldwell',
    archetype: 'founders',
    foundedYear: 1895,
    memberIds: [
      'henry_caldwell', 'william_caldwell', 'margaret_caldwell',
      'oliver_caldwell', 'claire_caldwell'
    ],
    currentWealthTier: 4,
    reputationScore: 65, // High public reputation, low actual moral standing
    secretUnlocked: false,
    secretRequiredPlaythroughs: 3,
    secretTitle: 'The File That Cannot Be Opened',
    secretText: `In the basement archive of Caldwell & Associates, behind climate-controlled doors no associate has ever been given a key to, is a manila folder. The label reads: "Westside 1972 — DO NOT OPEN."

Inside: a handwritten receipt for $15,000 paid to a private firm called Greystone Consulting. A copy of a commitment order for one Sofia Morozov, signed by a cooperating physician. The address of the Millhaven State Hospital in upstate Crestfield County.

She wasn't killed. William Caldwell told himself that made it different. He paid for her to be removed, silenced, and forgotten. She was released in 1987 when the facility closed under a state review. She changed her name. She is alive.

Her daughter was born during her commitment. The child was placed for adoption. The file includes the adoptive family name: Hassan.

William showed this file to no one. When he died in 2009, he left no instructions about it. It has been sitting in that archive for fifty-two years, waiting.`,
    colorTheme: '#8B7355',
    tagline: 'They built this city. The question is how.',
  },
  {
    id: 'reyes',
    familyName: 'Reyes',
    archetype: 'builders',
    foundedYear: 1940,
    memberIds: [
      'esperanza_reyes', 'roberto_reyes', 'ana_reyes',
      'miguel_reyes', 'rosa_reyes'
    ],
    currentWealthTier: 2,
    reputationScore: 70,
    secretUnlocked: false,
    secretRequiredPlaythroughs: 3,
    secretTitle: 'What the Agreement Said',
    secretText: `The relocation payment was $40,000 — nearly triple the standard rate. Esperanza knew why.

The agreement was four pages. Most of it was standard language about property transfer and relocation timelines. Page three, section 7(b), in smaller print than the rest:

"The undersigned agrees to make no public statements, representations, or disclosures regarding the terms of this agreement, the circumstances of the relocation, or any knowledge the undersigned may have regarding related activities of the City of Crestfield or its affiliated partners."

Affiliated partners. She signed it. She needed to.

Roberto found the agreement in her things when she died. He read it twice. He put it back in the envelope. He never told Ana or Miguel. He is still not sure whether that makes him complicit or protective.`,
    colorTheme: '#B5451B',
    tagline: 'They built it from scratch. Twice.',
  },
  {
    id: 'webb',
    familyName: 'Webb',
    archetype: 'keepers',
    foundedYear: 1920,
    memberIds: [
      'james_webb_sr', 'james_webb_jr', 'denise_webb',
      'marcus_webb', 'jordan_webb'
    ],
    currentWealthTier: 2,
    reputationScore: 55,
    secretUnlocked: false,
    secretRequiredPlaythroughs: 3,
    secretTitle: 'Case File #CR-1972-0214',
    secretText: `The case file was never destroyed. It was misfiled — placed in the "Closed — Non-Criminal" archive under "V" instead of "M," a clerical error that preserved it by accident.

Case File #CR-1972-0214. Missing person report, filed February 14, 1972. Subject: Sofia Morozov, age 42, Westside. Report taken by Officer James Webb, Badge #1147.

The file includes Webb's original notes: witness statement from a Dmitri Morozov, vehicle description, partial plate number. And then, three days later, a closing notation in a different hand: "Subject located, relocated voluntarily. Case closed per direction of Capt. E. Harlow."

Captain Harlow reported directly to the office of Deputy Mayor Franklin Birch.

Franklin Birch was the mayor's brother. The mayor was Harold Birch. Harold Birch had been placed in office by William Caldwell.

Officer Webb signed the closing notation. He was 52 years old. He had a son in high school. He had a mortgage. He signed it.

The file is still there, in the archives of the Crestfield Police Department, misfiled under V.`,
    colorTheme: '#1B4F72',
    tagline: 'Serve and protect. But serve who, and protect what?',
  },
  {
    id: 'morozov',
    familyName: 'Morozov',
    archetype: 'soul',
    foundedYear: 1951,
    memberIds: [
      'sofia_morozov', 'dmitri_morozov', 'nadia_morozov',
      'anton_morozov', 'leila_hassan'
    ],
    currentWealthTier: 1,
    reputationScore: 80,
    secretUnlocked: false,
    secretRequiredPlaythroughs: 3,
    secretTitle: 'Dmitri\'s Journal, February 1972',
    secretText: `February 14, 1972.
Sofia did not come home. I waited. I called the Center. No answer. I walked there. Locked. I asked the neighbors. No one knew.

February 16.
I went to the police. An Officer Webb took my statement. He wrote down everything I said. The car I saw — dark blue, American, a Buick or Oldsmobile. The plate: partial, started with JD7. Two men in the front seat, one I did not recognize, one who looked like city workers I had seen at the meetings.

February 19.
Officer Webb called. He said Sofia had "relocated voluntarily." He said I could pick up my copy of the report. When I went to the station, they said there was no open report.

I know what I saw. I know what kind of car that was. I know the men at those meetings have been coming from the city.

I have written this down because I believe someone must read it someday. I believe the truth does not disappear. I believe Sofia is alive somewhere and that she knows I am looking.

— D.M.`,
    colorTheme: '#4A6741',
    tagline: 'The soul of Westside. And the wound at the center of everything.',
  },
  {
    id: 'chen',
    familyName: 'Chen',
    archetype: 'pragmatists',
    foundedYear: 1948,
    memberIds: [
      'wei_chen', 'helen_chen', 'daniel_chen', 'maya_chen'
    ],
    currentWealthTier: 3,
    reputationScore: 75,
    secretUnlocked: false,
    secretRequiredPlaythroughs: 2,
    secretTitle: 'The Signature on Page 12',
    secretText: `City of Crestfield Housing Authority. Urban Renewal Project CR-72. Demolition Authorization, Final Approval.

Page 12 of 14 carries the signatures of three officials. The second signature belongs to Wei Chen, Deputy Director of Housing, appointed 1970.

Wei did not choose to sign. His appointment had been sponsored by the Caldwell-linked development office. When the authorization came to him, he had already been told — not in writing — that his continued employment, and the favorable interpretation of his wife's immigration status review, would be contingent on his cooperation.

He signed on April 3, 1972. The demolition of Westside was approved April 4.

Wei never told Helen. He never told Daniel. He built a restaurant. He raised a daughter who believed the family's success was earned clean. In 1987, when he retired, he burned the copy of the authorization he had kept.

He did not know there was another copy in the city archive.`,
    colorTheme: '#5B4A8A',
    tagline: 'They survived by building. But building on what?',
  },
  {
    id: 'washington',
    familyName: 'Washington',
    archetype: 'witnesses',
    foundedYear: 1900,
    memberIds: [
      'ida_washington', 'thomas_washington', 'gloria_washington',
      'darnell_washington', 'keisha_washington', 'zara_washington'
    ],
    currentWealthTier: 2,
    reputationScore: 85,
    secretUnlocked: false,
    secretRequiredPlaythroughs: 3,
    secretTitle: 'Ida\'s Diary, 1945–1955',
    secretText: `Ida Washington worked in the Caldwell household for thirty-five years. She kept a diary.

Most of it is ordinary: weather, meals, what the children said. But across the years, other things.

October 1948: "Mr. Henry had a man here from the port union. Long talk behind closed doors. The man left with an envelope. I could feel the weight of it when I carried the drinks in."

March 1955: "Young Mr. William had his political friends here again. One of them, a Mr. Harlow, talked about the neighborhoods by the port like they were something that needed removing. I heard the word 'opportunity' used in a way I have heard before. It means someone will lose something."

February 1972: "They said on the radio that the woman from the community center is missing. I know that name. The men who were here in October — I heard that name in the hallway when I was clearing the study. I have written this down. I don't know what I'll do with it."

The diary is in a box in Gloria Washington's attic. Gloria doesn't know what's in it. She has been meaning to read it for twenty years.`,
    colorTheme: '#2C5F2E',
    tagline: 'The city\'s memory. Every moment of it.',
  },
];

// ── CITIZENS ──────────────────────────────────────────────────────────────────

export const CITIZENS: Citizen[] = [
  // ── THE CALDWELLS ────────────────────────────────────────────────────────────
  {
    id: 'henry_caldwell',
    worldId: '', // Set at world creation
    firstName: 'Henry',
    lastName: 'Caldwell',
    birthYear: 1895,
    deathYear: 1962,
    causeOfDeath: 'Heart failure',
    status: 'deceased',
    traitIds: ['charismatic', 'ambitious', 'pragmatic'],
    districtId: 'heights',
    familyId: 'caldwell',
    currentCareer: { title: 'Port Baron / Founder', employerId: null, salary: 0, startYear: 1920 },
    wealthTier: 4,
    reputationScore: 80,
    isPlayable: true,
    playthroughId: null,
    biography: 'He built this city. He acquired the land through fraud in 1922 and told himself it was vision. By the time anyone could prove otherwise, the city was named after what he\'d built.',
    portraitKey: 'henry_caldwell',
  },
  {
    id: 'william_caldwell',
    worldId: '',
    firstName: 'William',
    lastName: 'Caldwell',
    birthYear: 1928,
    deathYear: 2009,
    causeOfDeath: 'Natural causes',
    status: 'deceased',
    traitIds: ['ambitious', 'pragmatic', 'stubborn'],
    districtId: 'heights',
    familyId: 'caldwell',
    currentCareer: { title: 'City Councilman / Developer', employerId: 'caldwell_firm', salary: 0, startYear: 1958 },
    wealthTier: 4,
    reputationScore: 70,
    isPlayable: true,
    playthroughId: null,
    biography: 'He inherited the city his father built and made it larger. He engineered an election, demolished a neighborhood, and called it progress. He never charged.',
    portraitKey: 'william_caldwell',
  },
  {
    id: 'margaret_caldwell',
    worldId: '',
    firstName: 'Margaret',
    lastName: 'Caldwell',
    birthYear: 1955,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['cautious', 'loyal', 'idealistic'],
    districtId: 'heights',
    familyId: 'caldwell',
    currentCareer: { title: 'Philanthropist / Board Member', employerId: null, salary: 0, startYear: 1985 },
    wealthTier: 4,
    reputationScore: 72,
    isPlayable: true,
    playthroughId: null,
    biography: 'She met Sofia Morozov once, in 1971, at a neighborhood meeting she attended out of curiosity. She has thought about that meeting ever since without knowing why.',
    portraitKey: 'margaret_caldwell',
  },
  {
    id: 'oliver_caldwell',
    worldId: '',
    firstName: 'Oliver',
    lastName: 'Caldwell',
    birthYear: 1980,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['charismatic', 'idealistic', 'pragmatic'],
    districtId: 'heights',
    familyId: 'caldwell',
    currentCareer: { title: 'Managing Partner, Caldwell & Associates', employerId: 'caldwell_firm', salary: 0, startYear: 2008 },
    wealthTier: 4,
    reputationScore: 75,
    isPlayable: true,
    playthroughId: null,
    biography: 'He believes in reform. He genuinely does. He has never opened the archive in the basement. He co-developed a proposal to demolish New Westside. He calls it sustainable housing.',
    portraitKey: 'oliver_caldwell',
  },
  {
    id: 'claire_caldwell',
    worldId: '',
    firstName: 'Claire',
    lastName: 'Caldwell',
    birthYear: 2002,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['idealistic', 'generous', 'curious'],
    districtId: 'heights',
    familyId: 'caldwell',
    currentCareer: { title: 'Urban Planning Student', employerId: null, salary: 0, startYear: 2024 },
    wealthTier: 4,
    reputationScore: 82,
    isPlayable: true,
    playthroughId: null,
    biography: 'She is writing her senior thesis on affordable housing in mid-sized American cities. She keeps coming across references to something called the Westside Incident. She doesn\'t know why that phrase makes her uneasy.',
    portraitKey: 'claire_caldwell',
  },

  // ── THE REYES FAMILY ──────────────────────────────────────────────────────────
  {
    id: 'esperanza_reyes',
    worldId: '',
    firstName: 'Esperanza',
    lastName: 'Reyes',
    birthYear: 1922,
    deathYear: 2001,
    causeOfDeath: 'Natural causes',
    status: 'deceased',
    traitIds: ['generous', 'stubborn', 'resilient'],
    districtId: 'westside',
    familyId: 'reyes',
    currentCareer: { title: 'Bakery Owner', employerId: null, salary: 0, startYear: 1945 },
    wealthTier: 1,
    reputationScore: 90,
    isPlayable: true,
    playthroughId: null,
    biography: 'She arrived in 1940 with nothing and built a bakery that fed a neighborhood. She signed a paper in 1973 that she carried for twenty-eight years. She never told anyone what was in it.',
    portraitKey: 'esperanza_reyes',
  },
  {
    id: 'roberto_reyes',
    worldId: '',
    firstName: 'Roberto',
    lastName: 'Reyes',
    birthYear: 1948,
    deathYear: 2018,
    causeOfDeath: 'Heart disease',
    status: 'deceased',
    traitIds: ['stubborn', 'loyal', 'volatile'],
    districtId: 'eastflats',
    familyId: 'reyes',
    currentCareer: { title: 'Construction Worker (retired)', employerId: null, salary: 0, startYear: 1970 },
    wealthTier: 1,
    reputationScore: 60,
    isPlayable: true,
    playthroughId: null,
    biography: 'He grew up in the bakery and watched it disappear. He found his mother\'s relocation agreement when she died and put it back without telling anyone. He was trying to protect people. He is still not sure it was the right choice.',
    portraitKey: 'roberto_reyes',
  },
  {
    id: 'ana_reyes',
    worldId: '',
    firstName: 'Ana',
    lastName: 'Reyes',
    birthYear: 1975,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['idealistic', 'ambitious', 'resilient'],
    districtId: 'midtown',
    familyId: 'reyes',
    currentCareer: { title: 'Civil Rights Attorney', employerId: null, salary: 0, startYear: 2002 },
    wealthTier: 2,
    reputationScore: 80,
    isPlayable: true,
    playthroughId: null,
    biography: 'She fights displacement cases without knowing her own family was displaced. When she wins, she sometimes drives through East Flats past the bakery window and feels something she can\'t name.',
    portraitKey: 'ana_reyes',
  },
  {
    id: 'miguel_reyes',
    worldId: '',
    firstName: 'Miguel',
    lastName: 'Reyes',
    birthYear: 1978,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['ambitious', 'pragmatic', 'charismatic'],
    districtId: 'heights',
    familyId: 'reyes',
    currentCareer: { title: 'Real Estate Developer', employerId: 'caldwell_dev', salary: 0, startYear: 2005 },
    wealthTier: 3,
    reputationScore: 55,
    isPlayable: true,
    playthroughId: null,
    biography: 'He works for a firm with deep ties to the Caldwells. He doesn\'t know that. He believes he earned his way up. He and Ana don\'t talk much anymore.',
    portraitKey: 'miguel_reyes',
  },
  {
    id: 'rosa_reyes',
    worldId: '',
    firstName: 'Rosa',
    lastName: 'Reyes',
    birthYear: 2003,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['idealistic', 'resilient', 'ambitious'],
    districtId: 'eastflats',
    familyId: 'reyes',
    currentCareer: { title: 'Junior Reporter, The Crestfield Courier', employerId: null, salary: 0, startYear: 2025 },
    wealthTier: 2,
    reputationScore: 70,
    isPlayable: true,
    playthroughId: null,
    biography: 'She grew up hearing her mother\'s cases. She has been following a thread about something called the Westside Incident for three months. She is getting close to something. She doesn\'t know yet what it will cost.',
    portraitKey: 'rosa_reyes',
  },

  // ── THE WEBB FAMILY ───────────────────────────────────────────────────────────
  {
    id: 'james_webb_sr',
    worldId: '',
    firstName: 'James',
    lastName: 'Webb',
    birthYear: 1920,
    deathYear: 1998,
    causeOfDeath: 'Stroke',
    status: 'deceased',
    traitIds: ['loyal', 'stubborn', 'pragmatic'],
    districtId: 'westside',
    familyId: 'webb',
    currentCareer: { title: 'Police Officer (retired)', employerId: null, salary: 0, startYear: 1945 },
    wealthTier: 2,
    reputationScore: 50,
    isPlayable: true,
    playthroughId: null,
    biography: 'He wore the badge to protect his community. He closed a missing person\'s case in 1972 because he was told to. He retired early. He never talked about it. He carried it until the end.',
    portraitKey: 'james_webb_sr',
  },
  {
    id: 'james_webb_jr',
    worldId: '',
    firstName: 'James Jr.',
    lastName: 'Webb',
    birthYear: 1948,
    deathYear: 2020,
    causeOfDeath: 'Cancer',
    status: 'deceased',
    traitIds: ['loyal', 'stubborn', 'cautious'],
    districtId: 'eastflats',
    familyId: 'webb',
    currentCareer: { title: 'Detective Captain (retired)', employerId: null, salary: 0, startYear: 1970 },
    wealthTier: 2,
    reputationScore: 60,
    isPlayable: true,
    playthroughId: null,
    biography: 'He knew some of what his father did. He made captain by being careful and loyal. He chose institution over accountability more than once. He raised two children who went different directions.',
    portraitKey: 'james_webb_jr',
  },
  {
    id: 'denise_webb',
    worldId: '',
    firstName: 'Denise',
    lastName: 'Webb',
    birthYear: 1975,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['idealistic', 'resilient', 'stubborn'],
    districtId: 'midtown',
    familyId: 'webb',
    currentCareer: { title: 'Public Defender', employerId: null, salary: 0, startYear: 2001 },
    wealthTier: 2,
    reputationScore: 78,
    isPlayable: true,
    playthroughId: null,
    biography: 'She represents the people her grandfather would have arrested. She loves her father and disagrees with almost everything he chose. She has been a public defender for twenty-three years.',
    portraitKey: 'denise_webb',
  },
  {
    id: 'marcus_webb',
    worldId: '',
    firstName: 'Marcus',
    lastName: 'Webb',
    birthYear: 1978,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['loyal', 'pragmatic', 'resilient'],
    districtId: 'eastflats',
    familyId: 'webb',
    currentCareer: { title: 'Police Detective', employerId: null, salary: 0, startYear: 2002 },
    wealthTier: 2,
    reputationScore: 62,
    isPlayable: true,
    playthroughId: null,
    biography: 'He is a good police officer. He is also a third-generation officer in a department with a specific history. He knows it. He works around it. He is not sure how long he can keep doing that.',
    portraitKey: 'marcus_webb',
  },
  {
    id: 'jordan_webb',
    worldId: '',
    firstName: 'Jordan',
    lastName: 'Webb',
    birthYear: 2000,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['idealistic', 'reckless', 'charismatic'],
    districtId: 'eastflats',
    familyId: 'webb',
    currentCareer: { title: 'Activist / Student', employerId: null, salary: 0, startYear: 2020 },
    wealthTier: 2,
    reputationScore: 68,
    isPlayable: true,
    playthroughId: null,
    biography: 'Non-binary, out, and on the other side of every line their family has drawn. In 2020, Jordan was at the protests while their uncle Marcus was at the police line. Love is not simple when it requires ignoring what you know.',
    portraitKey: 'jordan_webb',
  },

  // ── THE MOROZOV FAMILY ────────────────────────────────────────────────────────
  {
    id: 'sofia_morozov',
    worldId: '',
    firstName: 'Sofia',
    lastName: 'Morozov',
    birthYear: 1930,
    deathYear: null, // Still alive (as Sarah Morris)
    causeOfDeath: null,
    status: 'departed', // Left Crestfield
    traitIds: ['idealistic', 'resilient', 'charismatic'],
    districtId: 'westside',
    familyId: 'morozov',
    currentCareer: { title: 'Community Organizer / Center Director', employerId: null, salary: 0, startYear: 1958 },
    wealthTier: 1,
    reputationScore: 95,
    isPlayable: true,
    playthroughId: null,
    biography: 'She founded the Westside Community Center. She organized residents to fight demolition. She disappeared in February 1972. Officially: she left voluntarily. She is alive. She lives under a different name. She thinks about Crestfield every day.',
    portraitKey: 'sofia_morozov',
  },
  {
    id: 'dmitri_morozov',
    worldId: '',
    firstName: 'Dmitri',
    lastName: 'Morozov',
    birthYear: 1932,
    deathYear: 1981,
    causeOfDeath: 'Heart failure (complicated by grief)',
    status: 'deceased',
    traitIds: ['loyal', 'stubborn', 'resilient'],
    districtId: 'portside',
    familyId: 'morozov',
    currentCareer: { title: 'Port Worker', employerId: null, salary: 0, startYear: 1952 },
    wealthTier: 1,
    reputationScore: 72,
    isPlayable: true,
    playthroughId: null,
    biography: 'He worked the port and loved his wife absolutely. After she disappeared, he searched for nine years. He kept a journal. He wrote down what he saw. He died in 1981 still looking.',
    portraitKey: 'dmitri_morozov',
  },
  {
    id: 'nadia_morozov',
    worldId: '',
    firstName: 'Nadia',
    lastName: 'Morozov',
    birthYear: 1958,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['artistic', 'introverted', 'resilient'],
    districtId: 'eastflats',
    familyId: 'morozov',
    currentCareer: { title: 'Musician', employerId: null, salary: 0, startYear: 1978 },
    wealthTier: 1,
    reputationScore: 65,
    isPlayable: true,
    playthroughId: null,
    biography: 'She was fourteen when her mother disappeared. She writes songs about lost places that people think are metaphors. They aren\'t. She had a life partner — Elena — who appears in the background of other people\'s stories, standing nearby, keeping quiet.',
    portraitKey: 'nadia_morozov',
  },
  {
    id: 'anton_morozov',
    worldId: '',
    firstName: 'Anton',
    lastName: 'Morozov',
    birthYear: 1960,
    deathYear: null,
    causeOfDeath: null,
    status: 'departed',
    traitIds: ['pragmatic', 'stubborn', 'cautious'],
    districtId: 'eastflats',
    familyId: 'morozov',
    currentCareer: { title: 'Electrician (another city)', employerId: null, salary: 0, startYear: 1982 },
    wealthTier: 2,
    reputationScore: 58,
    isPlayable: true,
    playthroughId: null,
    biography: 'He left after his mother disappeared. He came back in 2005 with their father\'s journals. He had been carrying them for twenty-four years without reading them fully. He read them in a motel on the edge of town. He didn\'t sleep.',
    portraitKey: 'anton_morozov',
  },
  {
    id: 'leila_hassan',
    worldId: '',
    firstName: 'Leila',
    lastName: 'Hassan',
    birthYear: 1972,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['resilient', 'cautious', 'generous'],
    districtId: 'eastflats',
    familyId: 'morozov', // She doesn't know this yet
    currentCareer: { title: 'Registered Nurse', employerId: null, salary: 0, startYear: 1998 },
    wealthTier: 2,
    reputationScore: 75,
    isPlayable: false, // Unlocked only after Westside Files complete
    playthroughId: null,
    biography: 'She was adopted at birth. She has always felt the absence of something she cannot name. She lives in East Flats, works at Crestfield General. She sometimes passes the Westside Holiness Church and stops without knowing why.',
    portraitKey: 'leila_hassan',
  },

  // ── THE CHEN FAMILY ───────────────────────────────────────────────────────────
  {
    id: 'wei_chen',
    worldId: '',
    firstName: 'Wei',
    lastName: 'Chen',
    birthYear: 1925,
    deathYear: 1998,
    causeOfDeath: 'Stroke',
    status: 'deceased',
    traitIds: ['pragmatic', 'loyal', 'cautious'],
    districtId: 'westside',
    familyId: 'chen',
    currentCareer: { title: 'Restaurant Owner / Former City Housing Official', employerId: null, salary: 0, startYear: 1950 },
    wealthTier: 2,
    reputationScore: 68,
    isPlayable: true,
    playthroughId: null,
    biography: 'He built a restaurant in Westside and loved that neighborhood. In 1972, he signed a demolition approval under duress. He burned his copy in 1987. He did not know the city kept another one.',
    portraitKey: 'wei_chen',
  },
  {
    id: 'helen_chen',
    worldId: '',
    firstName: 'Helen',
    lastName: 'Chen',
    birthYear: 1952,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['ambitious', 'loyal', 'resilient'],
    districtId: 'midtown',
    familyId: 'chen',
    currentCareer: { title: 'Restaurant Chain Owner (Chen\'s)', employerId: null, salary: 0, startYear: 1980 },
    wealthTier: 3,
    reputationScore: 80,
    isPlayable: true,
    playthroughId: null,
    biography: 'She turned the family restaurant into a small chain. She believes everything was earned clean. She does not know about the demolition approval. She is not sure she would want to.',
    portraitKey: 'helen_chen',
  },
  {
    id: 'daniel_chen',
    worldId: '',
    firstName: 'Daniel',
    lastName: 'Chen',
    birthYear: 1975,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['ambitious', 'pragmatic', 'charismatic'],
    districtId: 'heights',
    familyId: 'chen',
    currentCareer: { title: 'Real Estate Developer', employerId: null, salary: 0, startYear: 2003 },
    wealthTier: 3,
    reputationScore: 65,
    isPlayable: true,
    playthroughId: null,
    biography: 'He and Oliver Caldwell have been friends since business school. He co-developed the New Westside proposal. He calls it his best work. He has not thought too hard about the history of the land.',
    portraitKey: 'daniel_chen',
  },
  {
    id: 'maya_chen',
    worldId: '',
    firstName: 'Maya',
    lastName: 'Chen',
    birthYear: 2001,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['idealistic', 'artistic', 'resilient'],
    districtId: 'midtown',
    familyId: 'chen',
    currentCareer: { title: 'Architecture Student', employerId: null, salary: 0, startYear: 2023 },
    wealthTier: 3,
    reputationScore: 72,
    isPlayable: true,
    playthroughId: null,
    biography: 'Her senior thesis is on displacement and community-centered design. She has been mapping demolished Crestfield neighborhoods. She found something in the 1972 housing records. She is not sure what to do with it.',
    portraitKey: 'maya_chen',
  },

  // ── THE WASHINGTON FAMILY ─────────────────────────────────────────────────────
  {
    id: 'ida_washington',
    worldId: '',
    firstName: 'Ida',
    lastName: 'Washington',
    birthYear: 1900,
    deathYear: 1970,
    causeOfDeath: 'Natural causes',
    status: 'deceased',
    traitIds: ['cautious', 'resilient', 'loyal'],
    districtId: 'westside',
    familyId: 'washington',
    currentCareer: { title: 'Domestic Worker (Caldwell household)', employerId: null, salary: 0, startYear: 1920 },
    wealthTier: 1,
    reputationScore: 78,
    isPlayable: true,
    playthroughId: null,
    biography: 'She worked in the Caldwell house for thirty-five years. She kept a diary. She wrote down everything she saw. She protected her children from it. She left it in a box in the attic.',
    portraitKey: 'ida_washington',
  },
  {
    id: 'thomas_washington',
    worldId: '',
    firstName: 'Thomas',
    lastName: 'Washington',
    birthYear: 1928,
    deathYear: 2005,
    causeOfDeath: 'Cancer',
    status: 'deceased',
    traitIds: ['idealistic', 'charismatic', 'resilient'],
    districtId: 'westside',
    familyId: 'washington',
    currentCareer: { title: 'Civil Rights Organizer / Community Leader', employerId: null, salary: 0, startYear: 1952 },
    wealthTier: 1,
    reputationScore: 88,
    isPlayable: true,
    playthroughId: null,
    biography: 'He led the 1965 march. He was arrested on false charges one week after the 1968 election. He never learned who ordered it. He organized from a depleted position for thirty more years. He was the best of this city.',
    portraitKey: 'thomas_washington',
  },
  {
    id: 'gloria_washington',
    worldId: '',
    firstName: 'Gloria',
    lastName: 'Washington',
    birthYear: 1955,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['generous', 'resilient', 'loyal'],
    districtId: 'eastflats',
    familyId: 'washington',
    currentCareer: { title: 'Retired Schoolteacher', employerId: null, salary: 0, startYear: 1978 },
    wealthTier: 1,
    reputationScore: 82,
    isPlayable: true,
    playthroughId: null,
    biography: 'She taught in Westside until the school closed. She moved to East Flats. She has her mother\'s diary in the attic. She has been meaning to read it for twenty years.',
    portraitKey: 'gloria_washington',
  },
  {
    id: 'darnell_washington',
    worldId: '',
    firstName: 'Darnell',
    lastName: 'Washington',
    birthYear: 1975,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['artistic', 'reckless', 'idealistic'],
    districtId: 'eastflats',
    familyId: 'washington',
    currentCareer: { title: 'Muralist / Artist', employerId: null, salary: 0, startYear: 1995 },
    wealthTier: 1,
    reputationScore: 70,
    isPlayable: true,
    playthroughId: null,
    biography: 'He paints the city\'s memory on walls that get painted over. In 1992 he made choices he doesn\'t talk about. His murals are partly art and partly penance. They are the game\'s visual language.',
    portraitKey: 'darnell_washington',
  },
  {
    id: 'keisha_washington',
    worldId: '',
    firstName: 'Keisha',
    lastName: 'Washington',
    birthYear: 1980,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['ambitious', 'charismatic', 'idealistic'],
    districtId: 'midtown',
    familyId: 'washington',
    currentCareer: { title: 'City Councilwoman', employerId: null, salary: 0, startYear: 2016 },
    wealthTier: 2,
    reputationScore: 78,
    isPlayable: true,
    playthroughId: null,
    biography: 'She received the seat partly because the Caldwells thought she was controllable. She is not. Her vote on the 2024 development is the city\'s most watched decision.',
    portraitKey: 'keisha_washington',
  },
  {
    id: 'zara_washington',
    worldId: '',
    firstName: 'Zara',
    lastName: 'Washington',
    birthYear: 2003,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['idealistic', 'ambitious', 'curious'],
    districtId: 'eastflats',
    familyId: 'washington',
    currentCareer: { title: 'Student / Social Media Researcher', employerId: null, salary: 0, startYear: 2024 },
    wealthTier: 2,
    reputationScore: 72,
    isPlayable: true,
    playthroughId: null,
    biography: 'She grew up with her father\'s murals and his stories. She connects dots faster than anyone. She found Dmitri Morozov\'s name in a public records request last month. She has been pulling that thread ever since.',
    portraitKey: 'zara_washington',
  },

  // ── ADDITIONAL CHARACTER ──────────────────────────────────────────────────────
  {
    id: 'pastor_freeman',
    worldId: '',
    firstName: 'David',
    lastName: 'Freeman',
    birthYear: 1968,
    deathYear: null,
    causeOfDeath: null,
    status: 'alive',
    traitIds: ['devout', 'charismatic', 'pragmatic'],
    districtId: 'eastflats',
    familyId: null,
    currentCareer: { title: 'Pastor, Westside Holiness Church', employerId: null, salary: 0, startYear: 1995 },
    wealthTier: 1,
    reputationScore: 80,
    isPlayable: true,
    playthroughId: null,
    biography: 'Third-generation pastor of the church that survived displacement. His grandfather made a deal with the Caldwells to keep the congregation together. He inherited the church and the compromise. In 2020, he has to choose.',
    portraitKey: 'pastor_freeman',
  },
];

// ── INITIAL RELATIONSHIPS ─────────────────────────────────────────────────────

export const INITIAL_RELATIONSHIPS: Omit<Relationship, 'id' | 'worldId'>[] = [
  // Caldwell family
  { citizenAId: 'henry_caldwell', citizenBId: 'william_caldwell', type: 'parent', strength: 70, formedYear: 1928, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'william_caldwell', citizenBId: 'margaret_caldwell', type: 'parent', strength: 60, formedYear: 1955, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'margaret_caldwell', citizenBId: 'oliver_caldwell', type: 'parent', strength: 72, formedYear: 1980, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'oliver_caldwell', citizenBId: 'claire_caldwell', type: 'parent', strength: 78, formedYear: 2002, dissolvedYear: null, dissolvedReason: null },

  // Reyes family
  { citizenAId: 'esperanza_reyes', citizenBId: 'roberto_reyes', type: 'parent', strength: 80, formedYear: 1948, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'esperanza_reyes', citizenBId: 'ana_reyes', type: 'parent', strength: 0, formedYear: 1975, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'roberto_reyes', citizenBId: 'ana_reyes', type: 'parent', strength: 60, formedYear: 1975, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'roberto_reyes', citizenBId: 'miguel_reyes', type: 'parent', strength: 55, formedYear: 1978, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'ana_reyes', citizenBId: 'rosa_reyes', type: 'parent', strength: 82, formedYear: 2003, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'ana_reyes', citizenBId: 'miguel_reyes', type: 'sibling', strength: 45, formedYear: 1978, dissolvedYear: null, dissolvedReason: null },

  // Webb family
  { citizenAId: 'james_webb_sr', citizenBId: 'james_webb_jr', type: 'parent', strength: 65, formedYear: 1948, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'james_webb_jr', citizenBId: 'denise_webb', type: 'parent', strength: 58, formedYear: 1975, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'james_webb_jr', citizenBId: 'marcus_webb', type: 'parent', strength: 72, formedYear: 1978, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'denise_webb', citizenBId: 'jordan_webb', type: 'parent', strength: 75, formedYear: 2000, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'marcus_webb', citizenBId: 'jordan_webb', type: 'acquaintance', strength: 50, formedYear: 2000, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'denise_webb', citizenBId: 'marcus_webb', type: 'sibling', strength: 55, formedYear: 1978, dissolvedYear: null, dissolvedReason: null },

  // Morozov family
  { citizenAId: 'sofia_morozov', citizenBId: 'dmitri_morozov', type: 'spouse', strength: 95, formedYear: 1955, dissolvedYear: 1972, dissolvedReason: 'Disappearance' },
  { citizenAId: 'sofia_morozov', citizenBId: 'nadia_morozov', type: 'parent', strength: 90, formedYear: 1958, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'sofia_morozov', citizenBId: 'anton_morozov', type: 'parent', strength: 85, formedYear: 1960, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'dmitri_morozov', citizenBId: 'nadia_morozov', type: 'parent', strength: 80, formedYear: 1958, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'nadia_morozov', citizenBId: 'anton_morozov', type: 'sibling', strength: 60, formedYear: 1960, dissolvedYear: null, dissolvedReason: null },

  // Chen family
  { citizenAId: 'wei_chen', citizenBId: 'helen_chen', type: 'parent', strength: 82, formedYear: 1952, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'helen_chen', citizenBId: 'daniel_chen', type: 'parent', strength: 70, formedYear: 1975, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'daniel_chen', citizenBId: 'maya_chen', type: 'parent', strength: 65, formedYear: 2001, dissolvedYear: null, dissolvedReason: null },

  // Washington family
  { citizenAId: 'ida_washington', citizenBId: 'thomas_washington', type: 'parent', strength: 80, formedYear: 1928, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'thomas_washington', citizenBId: 'gloria_washington', type: 'parent', strength: 75, formedYear: 1955, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'gloria_washington', citizenBId: 'darnell_washington', type: 'parent', strength: 72, formedYear: 1975, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'gloria_washington', citizenBId: 'keisha_washington', type: 'parent', strength: 78, formedYear: 1980, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'darnell_washington', citizenBId: 'zara_washington', type: 'parent', strength: 68, formedYear: 2003, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'darnell_washington', citizenBId: 'keisha_washington', type: 'sibling', strength: 62, formedYear: 1980, dissolvedYear: null, dissolvedReason: null },

  // Cross-family relationships
  { citizenAId: 'thomas_washington', citizenBId: 'sofia_morozov', type: 'friend', strength: 85, formedYear: 1960, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'sofia_morozov', citizenBId: 'esperanza_reyes', type: 'friend', strength: 88, formedYear: 1958, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'esperanza_reyes', citizenBId: 'wei_chen', type: 'friend', strength: 70, formedYear: 1952, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'oliver_caldwell', citizenBId: 'daniel_chen', type: 'friend', strength: 75, formedYear: 2002, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'ana_reyes', citizenBId: 'denise_webb', type: 'colleague', strength: 60, formedYear: 2005, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'marcus_webb', citizenBId: 'jordan_webb', type: 'family', strength: 45, formedYear: 2000, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'rosa_reyes', citizenBId: 'zara_washington', type: 'friend', strength: 65, formedYear: 2020, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'gloria_washington', citizenBId: 'pastor_freeman', type: 'friend', strength: 72, formedYear: 1990, dissolvedYear: null, dissolvedReason: null },
  { citizenAId: 'james_webb_sr', citizenBId: 'dmitri_morozov', type: 'acquaintance', strength: 20, formedYear: 1972, dissolvedYear: 1972, dissolvedReason: 'Webb closed the case' },
];

export function getCitizensByFamily(familyId: string): Citizen[] {
  return CITIZENS.filter(c => c.familyId === familyId);
}

export function getCitizenById(id: string): Citizen | undefined {
  return CITIZENS.find(c => c.id === id);
}

export function getLifeStage(citizen: Citizen, year: number): LifeStage {
  const age = year - citizen.birthYear;
  if (age < 13) return 'child';
  if (age < 25) return 'youth';
  if (age < 65) return 'adult';
  return 'elder';
}

// Sorted starter characters for character select (most narratively accessible first)
export const STARTER_CHARACTERS = [
  'esperanza_reyes',    // 1940s — the heart of Westside, accessible entry point
  'james_webb_sr',      // 1945 — the closed case, the pivotal choice
  'sofia_morozov',      // 1958 — the center of the mystery
  'thomas_washington',  // 1952 — the organizer, the arrested man
  'wei_chen',           // 1950s — the pragmatist, the signature
  'ida_washington',     // 1920s — the witness, the diary
];

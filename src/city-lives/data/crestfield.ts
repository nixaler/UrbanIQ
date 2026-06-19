import type { District, Location, WealthTier } from '../types';

// ── CRESTFIELD DISTRICTS ───────────────────────────────────────────────────────

export const DISTRICTS: District[] = [
  {
    id: 'westside',
    name: 'Westside',
    character: 'mixed',
    wealthTier: 1,
    description: 'A working-class neighborhood built by immigrants and Black families who came north. Churches, corner stores, music spilling out of bars at night. The most alive neighborhood in the city — until 1973.',
    historicalNotes: [
      'Founded: 1920s as immigrant settlement district',
      'Peak population: ~8,400 residents (1960)',
      'Demolished: 1973 under city urban renewal program',
      'Replaced by: Westgate Tower (1975), luxury residential',
    ],
    connectedDistrictIds: ['midtown', 'portside'],
  },
  {
    id: 'westside_remnant',
    name: 'New Westside',
    character: 'residential',
    wealthTier: 1,
    description: 'The fragment of Westside that survived the 1973 demolition. A few blocks of original buildings, squeezed between Westgate Tower and the highway. Smaller, quieter, still there.',
    historicalNotes: [
      'Saved from demolition by community legal challenge (1973)',
      'Has remained predominantly working-class',
      'Target of Caldwell development proposal (2024)',
    ],
    connectedDistrictIds: ['midtown', 'portside', 'heights'],
  },
  {
    id: 'midtown',
    name: 'Midtown',
    character: 'commercial',
    wealthTier: 2,
    description: 'The city\'s commercial spine. Restaurants, offices, the newspaper building, city hall. Everyone passes through here. The sidewalks remember everyone who ever walked them.',
    historicalNotes: [
      'Always been the city\'s center of commerce',
      'Caldwell & Associates has occupied the same corner since 1928',
      'The Crestfield Courier has run from the same building since 1931',
    ],
    connectedDistrictIds: ['westside', 'heights', 'portside', 'eastflats'],
  },
  {
    id: 'heights',
    name: 'The Heights',
    character: 'residential',
    wealthTier: 3,
    description: 'Old money and newer money coexisting uneasily on tree-lined streets. The Caldwells live here. So do some of the people trying to hold them accountable.',
    historicalNotes: [
      'Developed in 1890s as the city\'s first planned residential district',
      'The Caldwell estate has occupied the same address since 1901',
    ],
    connectedDistrictIds: ['midtown'],
  },
  {
    id: 'portside',
    name: 'Portside',
    character: 'industrial',
    wealthTier: 1,
    description: 'The port and its surrounding warehouses, docks, and the neighborhoods that grew up around them. Working people. Shift work. The kind of community where you know everyone on your block.',
    historicalNotes: [
      'Original point of entry for most immigrant families',
      'Port operations peaked 1940s-1960s, declined with containerization',
      'Partially converted to mixed-use (2000s), but core community remains',
    ],
    connectedDistrictIds: ['westside', 'midtown', 'eastflats'],
  },
  {
    id: 'eastflats',
    name: 'East Flats',
    character: 'residential',
    wealthTier: 1,
    description: 'Where people moved when they were pushed out of Westside. New roots in unfamiliar soil. The neighborhood carries that history in its architecture — mixed eras, mixed stories.',
    historicalNotes: [
      'Population increased sharply after 1973 Westside displacement',
      'Westside Holiness Church relocated here in 1973',
    ],
    connectedDistrictIds: ['midtown', 'portside'],
  },
];

// ── DISTRICT STATE OVER TIME ───────────────────────────────────────────────────

export function getDistrictState(districtId: string, year: number): { name: string; wealthTier: WealthTier; description: string } {
  const base = DISTRICTS.find(d => d.id === districtId);
  if (!base) return { name: 'Unknown', wealthTier: 1, description: '' };

  if (districtId === 'westside') {
    if (year >= 1973) {
      return {
        name: 'Westgate (formerly Westside)',
        wealthTier: 4,
        description: 'Westgate Tower and its surrounding luxury development. You can see the outlines of the old streets if you know where to look.',
      };
    }
    if (year >= 1971) {
      return {
        name: 'Westside (Under Threat)',
        wealthTier: 1,
        description: 'The neighborhood knows what\'s coming. Fewer businesses. More boarded windows. People who have nowhere to go.',
      };
    }
  }

  if (districtId === 'westside_remnant' && year < 1973) {
    return { name: '—', wealthTier: 1, description: 'This area is part of Westside before 1973.' };
  }

  return { name: base.name, wealthTier: base.wealthTier, description: base.description };
}

// ── LOCATIONS ─────────────────────────────────────────────────────────────────

export const LOCATIONS: Location[] = [
  // WESTSIDE (active 1920-1972)
  {
    id: 'westside_community_center',
    districtId: 'westside',
    name: 'Westside Community Center',
    type: 'cultural',
    description: 'Sofia Morozov\'s hub. Classes, meetings, translation help for new arrivals. On Friday nights, Nadia plays here.',
    activeYearStart: 1958,
    activeYearEnd: 1972,
    replacedByLocationId: 'westgate_construction',
    ambientSound: 'community_center',
    presentNpcIds: ['sofia_morozov', 'nadia_morozov', 'thomas_washington'],
  },
  {
    id: 'reyes_bakery_westside',
    districtId: 'westside',
    name: 'Reyes Bakery',
    type: 'neighborhood',
    description: 'Esperanza\'s place. The smell of pan dulce at 5am. The counter where she talked to everyone who came in.',
    activeYearStart: 1945,
    activeYearEnd: 1972,
    replacedByLocationId: 'reyes_bakery_eastflats',
    ambientSound: 'bakery',
    presentNpcIds: ['esperanza_reyes', 'roberto_reyes'],
  },
  {
    id: 'westside_church',
    districtId: 'westside',
    name: 'Westside Holiness Church',
    type: 'cultural',
    description: 'Founded 1924. Three generations of congregation. The stained glass was donated by the Washington family in 1952.',
    activeYearStart: 1924,
    activeYearEnd: 1973,
    replacedByLocationId: 'eastflats_church',
    ambientSound: 'church',
    presentNpcIds: ['thomas_washington', 'gloria_washington', 'ida_washington'],
  },
  {
    id: 'westside_block',
    districtId: 'westside',
    name: 'The Block — Westside',
    type: 'neighborhood',
    description: 'Front stoops and corner arguments. The block where everyone knows everyone else\'s name, business, and mother.',
    activeYearStart: 1920,
    activeYearEnd: 1972,
    replacedByLocationId: null,
    ambientSound: 'neighborhood_1960s',
    presentNpcIds: ['esperanza_reyes', 'dmitri_morozov', 'james_webb_sr', 'thomas_washington'],
  },

  // MIDTOWN (always active)
  {
    id: 'caldwell_law_firm',
    districtId: 'midtown',
    name: 'Caldwell & Associates',
    type: 'power_center',
    description: 'The corner office that has controlled this city\'s legal landscape since 1928. Same carpet. Same portraits. Different generations making the same choices.',
    activeYearStart: 1928,
    activeYearEnd: null,
    replacedByLocationId: null,
    ambientSound: 'office',
    presentNpcIds: ['henry_caldwell', 'william_caldwell', 'oliver_caldwell'],
  },
  {
    id: 'city_hall',
    districtId: 'midtown',
    name: 'Crestfield City Hall',
    type: 'power_center',
    description: 'Public meetings, council chambers, records rooms. Everything official happens here. Most of what matters happens in the parking garage.',
    activeYearStart: 1920,
    activeYearEnd: null,
    replacedByLocationId: null,
    ambientSound: 'city_hall',
    presentNpcIds: ['william_caldwell', 'keisha_washington'],
  },
  {
    id: 'crestfield_courier',
    districtId: 'midtown',
    name: 'The Crestfield Courier',
    type: 'power_center',
    description: 'The city\'s paper of record since 1931. The Caldwells own a controlling interest. The reporters don\'t always know that.',
    activeYearStart: 1931,
    activeYearEnd: null,
    replacedByLocationId: null,
    ambientSound: 'newsroom',
    presentNpcIds: ['rosa_reyes'],
  },
  {
    id: 'midtown_diner',
    districtId: 'midtown',
    name: 'The Blue Spoon Diner',
    type: 'meeting_place',
    description: 'Open 24 hours. The kind of place where you sit in a booth and say things you couldn\'t say anywhere else.',
    activeYearStart: 1935,
    activeYearEnd: null,
    replacedByLocationId: null,
    ambientSound: 'diner',
    presentNpcIds: [],
  },

  // PORTSIDE
  {
    id: 'portside_docks',
    districtId: 'portside',
    name: 'The Port of Crestfield',
    type: 'workplace',
    description: 'Ships and labor. The place where half the city\'s families got their start. Dmitri Morozov worked here for 23 years.',
    activeYearStart: 1920,
    activeYearEnd: null,
    replacedByLocationId: null,
    ambientSound: 'port',
    presentNpcIds: ['dmitri_morozov'],
  },

  // HEIGHTS
  {
    id: 'caldwell_estate',
    districtId: 'heights',
    name: 'Caldwell Estate',
    type: 'home',
    description: 'The house that the port built. High ceilings, a long driveway, and a family archive in the study that no one has opened in thirty years.',
    activeYearStart: 1901,
    activeYearEnd: null,
    replacedByLocationId: null,
    ambientSound: 'estate',
    presentNpcIds: ['henry_caldwell', 'william_caldwell', 'margaret_caldwell', 'oliver_caldwell', 'claire_caldwell'],
  },

  // EASTFLATS
  {
    id: 'eastflats_church',
    districtId: 'eastflats',
    name: 'Westside Holiness Church (New Location)',
    type: 'cultural',
    description: 'Same congregation. New building, different street. The congregation brought the stained glass panels. They didn\'t fit quite the same way in the new windows.',
    activeYearStart: 1973,
    activeYearEnd: null,
    replacedByLocationId: null,
    ambientSound: 'church',
    presentNpcIds: ['gloria_washington', 'darnell_washington', 'pastor_freeman'],
  },
  {
    id: 'reyes_bakery_eastflats',
    districtId: 'eastflats',
    name: 'Reyes Bakery (East Flats)',
    type: 'neighborhood',
    description: 'The second bakery. Smaller. The pan dulce recipe is exactly the same. Esperanza never talked about the first one.',
    activeYearStart: 1975,
    activeYearEnd: null,
    replacedByLocationId: null,
    ambientSound: 'bakery',
    presentNpcIds: ['esperanza_reyes', 'roberto_reyes', 'ana_reyes'],
  },
  {
    id: 'darnell_studio',
    districtId: 'eastflats',
    name: 'Darnell\'s Studio',
    type: 'cultural',
    description: 'One room. Paint everywhere. A jukebox that doesn\'t always work. The murals start here before they go onto the walls.',
    activeYearStart: 1998,
    activeYearEnd: null,
    replacedByLocationId: null,
    ambientSound: 'studio',
    presentNpcIds: ['darnell_washington', 'zara_washington'],
  },

  // CONSTRUCTION / POST-DEMOLITION
  {
    id: 'westgate_construction',
    districtId: 'westside',
    name: 'Westgate Construction Site (formerly Westside)',
    type: 'neighborhood',
    description: 'Fence with official notices. Dust. The outline of streets you can\'t walk anymore.',
    activeYearStart: 1973,
    activeYearEnd: 1975,
    replacedByLocationId: 'westgate_tower',
    ambientSound: 'construction',
    presentNpcIds: [],
  },
  {
    id: 'westgate_tower',
    districtId: 'westside',
    name: 'Westgate Tower',
    type: 'power_center',
    description: 'Glass and steel. The most expensive address in Crestfield. Built on land that was purchased for less than it cost to demolish the homes that stood there.',
    activeYearStart: 1975,
    activeYearEnd: null,
    replacedByLocationId: null,
    ambientSound: 'lobby',
    presentNpcIds: ['oliver_caldwell', 'daniel_chen'],
  },
];

export function getActiveLocations(districtId: string, year: number): Location[] {
  return LOCATIONS.filter(
    loc =>
      loc.districtId === districtId &&
      loc.activeYearStart <= year &&
      (loc.activeYearEnd === null || loc.activeYearEnd >= year)
  );
}

// ── HISTORICAL EVENTS (city-level, non-player-driven) ─────────────────────────

export interface HistoricalCityEvent {
  year: number;
  title: string;
  description: string;
  affectedDistrictIds: string[];
  eventType: string;
}

export const HISTORICAL_EVENTS: HistoricalCityEvent[] = [
  {
    year: 1929,
    title: 'The Great Depression Hits Crestfield',
    description: 'Port traffic drops 60%. Unemployment in Portside and Westside climbs to 40%. The Caldwells survive. Most others struggle.',
    affectedDistrictIds: ['portside', 'westside', 'eastflats'],
    eventType: 'economic',
  },
  {
    year: 1941,
    title: 'The War Economy',
    description: 'The port reopens at full capacity for war materiel. Jobs come back. Wages go up. A generation of young men leaves Crestfield.',
    affectedDistrictIds: ['portside', 'westside', 'midtown'],
    eventType: 'political',
  },
  {
    year: 1955,
    title: 'City Plans Interstate Through Portside',
    description: 'The new highway displaces 400 families from Portside\'s northern blocks. The city calls it progress.',
    affectedDistrictIds: ['portside'],
    eventType: 'displacement',
  },
  {
    year: 1965,
    title: 'Civil Rights March on City Hall',
    description: 'Thomas Washington leads 2,000 residents to demand fair housing and equal employment. The mayor refuses to meet with organizers.',
    affectedDistrictIds: ['midtown', 'westside'],
    eventType: 'political',
  },
  {
    year: 1968,
    title: 'The Mayoral Election',
    description: 'Harold Birch wins the mayor\'s race by 3,200 votes. The Caldwells celebrate privately. Thomas Washington is arrested on unrelated charges the following week.',
    affectedDistrictIds: ['midtown'],
    eventType: 'political',
  },
  {
    year: 1972,
    title: 'Sofia Morozov Disappears',
    description: 'The Westside Community Center director is reported missing in February. Police close the case within two weeks. The city moves forward.',
    affectedDistrictIds: ['westside'],
    eventType: 'disappearance',
  },
  {
    year: 1973,
    title: 'Westside Demolished',
    description: '340 families receive relocation notices. The Westside Holiness Church moves to East Flats. The Reyes bakery closes.',
    affectedDistrictIds: ['westside', 'eastflats'],
    eventType: 'displacement',
  },
  {
    year: 1975,
    title: 'Westgate Tower Opens',
    description: 'The city holds a ribbon-cutting. The Crestfield Courier calls it "a new era for downtown." There is no mention of what stood there before.',
    affectedDistrictIds: ['westside'],
    eventType: 'development',
  },
  {
    year: 1992,
    title: 'The Crestfield Unrest',
    description: 'Three nights of protests following a police incident in East Flats. The National Guard is called. Seventeen businesses damaged. No officers charged.',
    affectedDistrictIds: ['eastflats', 'midtown'],
    eventType: 'unrest',
  },
  {
    year: 2008,
    title: 'The Financial Crisis',
    description: 'Unemployment spikes. East Flats hit hardest. The Caldwells\' real estate portfolio takes a temporary loss. They recover by 2011.',
    affectedDistrictIds: ['eastflats', 'portside'],
    eventType: 'economic',
  },
  {
    year: 2020,
    title: 'Protests After the Crestfield Police Incident',
    description: 'Following the death of a local man in police custody, weeks of demonstrations fill Midtown. Marcus Webb is photographed at both the protests and a police press conference.',
    affectedDistrictIds: ['midtown', 'eastflats', 'westside_remnant'],
    eventType: 'unrest',
  },
  {
    year: 2024,
    title: 'The New Westside Development Vote',
    description: 'Oliver Caldwell and Daniel Chen\'s firm proposes demolishing New Westside for a "sustainable mixed-use development." The city council vote is scheduled for November.',
    affectedDistrictIds: ['westside_remnant'],
    eventType: 'political',
  },
];

// Card image mapping system
// This maps card names to their corresponding image files

export const CARD_IMAGES: Record<string, string> = {
  // DC Metro Cards
  "Metro Center": "/cards/dc/metro-center.jpg",
  "Pentagon": "/cards/dc/pentagon.jpg",
  "Union Station": "/cards/dc/union-station.jpg",
  "Foggy Bottom-GWU": "/cards/dc/foggy-bottom.jpg",
  "Dupont Circle": "/cards/dc/dupont-circle.jpg",
  "Capitol South": "/cards/dc/capitol-south.jpg",
  "Stadium-Armory": "/cards/dc/stadium-armory.jpg",
  "L'Enfant Plaza": "/cards/dc/l-enfant-plaza.jpg",
  "Navy Yard-Ballpark": "/cards/dc/navy-yard.jpg",
  
  // Portland MAX Cards
  "Pioneer Square North": "/cards/pdx/pioneer-square.jpg",
  "Washington Park": "/cards/pdx/washington-park.jpg",
  "Lexington Market": "/cards/balt/lexington-market.jpg",
  "BWI Airport": "/cards/balt/bwi-airport.jpg",
  
  // LA Metro Cards
  "Union Station": "/cards/la/union-station.jpg",
  "7th St/Metro Center": "/cards/la/7th-st-metro.jpg",
  "Downtown Santa Monica": "/cards/la/santa-monica.jpg",
  
  // US States Cards
  "California": "/cards/states/california.jpg",
  "Texas": "/cards/states/texas.jpg",
  "New York": "/cards/states/new-york.jpg",
  "Florida": "/cards/states/florida.jpg",
  "Alaska": "/cards/states/alaska.jpg",
  "Colorado": "/cards/states/colorado.jpg",
  "Massachusetts": "/cards/states/massachusetts.jpg",
  
  // NFL Team Cards
  "Dallas Cowboys": "/cards/nfl/dallas-cowboys.jpg",
  "New England Patriots": "/cards/nfl/new-england-patriots.jpg",
  "Green Bay Packers": "/cards/nfl/green-bay-packers.jpg",
  "Kansas City Chiefs": "/cards/nfl/kansas-city-chiefs.jpg",
  "Baltimore Ravens": "/cards/nfl/baltimore-ravens.jpg",
  "Philadelphia Eagles": "/cards/nfl/philadelphia-eagles.jpg",
  "Pittsburgh Steelers": "/cards/nfl/pittsburgh-steelers.jpg"
};

export function getCardImage(cardName: string): string | undefined {
  return CARD_IMAGES[cardName];
}

export function addCardImages(cards: any[]): any[] {
  return cards.map(card => ({
    ...card,
    image: getCardImage(card.name) || card.image
  }));
}

// Fallback images by card type and rarity
export function getFallbackImage(cardType: string, rarity: string): string {
  const typeMap: Record<string, string> = {
    transit: "/cards/transit-default.jpg",
    geography: "/cards/geography-default.jpg", 
    sports: "/cards/sports-default.jpg"
  };
  
  return typeMap[cardType] || "/cards/default.jpg";
}
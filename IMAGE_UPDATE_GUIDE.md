# UrbanIQ Image Update Guide

This guide provides detailed instructions for updating the images in the UrbanIQ project as requested.

## 🎯 Image Update Requirements

### 1. UrbanIQ Title Overlay ✅ COMPLETED
- **Status**: The UrbanIQ title now overlays on top of animated circle backgrounds
- **Implementation**: Updated HomeScreen component with animated gradient circles and overlay effects
- **Files Modified**: `src/components/HomeScreen.tsx`

### 2. City Photo Updates

#### Portland (PDX) - NEEDS NEW IMAGE
- **Current File**: `public/photo-pdx.jpg`
- **Required Image**: Downtown Portland skyline or cultural landmark
- **Suggested Subjects**:
  - Downtown Portland skyline with Mount Hood in background
  - Portland's famous "Keep Portland Weird" sign
  - Powell's City of Books (largest independent bookstore)
  - Portland Art Museum
  - Tom McCall Waterfront Park
  - Burnside Bridge downtown view
- **Image Specifications**:
  - Resolution: 1920x1080 or higher
  - Format: JPG
  - Style: Urban, cultural, iconic Portland
  - Time of day: Golden hour or blue hour for best lighting

#### Baltimore (BALT) - NEEDS NEW IMAGE
- **Current File**: `public/photo-balt.jpg`
- **Required Image**: Downtown Baltimore or Inner Harbor cultural landmark
- **Suggested Subjects**:
  - Baltimore Inner Harbor at sunset
  - National Aquarium Baltimore
  - USS Constellation in the harbor
  - Baltimore World Trade Center
  - Fell's Point historic waterfront
  - Camden Yards stadium
  - Baltimore City Hall
- **Image Specifications**:
  - Resolution: 1920x1080 or higher
  - Format: JPG
  - Style: Waterfront, cultural, iconic Baltimore
  - Time of day: Sunset for dramatic harbor lighting

### 3. Playing Card Images

#### Directory Structure to Create:
```
public/
├── cards/
│   ├── dc/
│   │   ├── metro-center.jpg
│   │   ├── pentagon.jpg
│   │   ├── union-station.jpg
│   │   ├── foggy-bottom.jpg
│   │   ├── dupont-circle.jpg
│   │   ├── capitol-south.jpg
│   │   ├── stadium-armory.jpg
│   │   ├── l-enfant-plaza.jpg
│   │   └── navy-yard.jpg
│   ├── pdx/
│   │   ├── pioneer-square.jpg
│   │   └── washington-park.jpg
│   ├── balt/
│   │   ├── lexington-market.jpg
│   │   └── bwi-airport.jpg
│   ├── la/
│   │   ├── union-station.jpg
│   │   ├── 7th-st-metro.jpg
│   │   └── santa-monica.jpg
│   ├── states/
│   │   ├── california.jpg
│   │   ├── texas.jpg
│   │   ├── new-york.jpg
│   │   ├── florida.jpg
│   │   ├── alaska.jpg
│   │   ├── colorado.jpg
│   │   └── massachusetts.jpg
│   ├── nfl/
│   │   ├── dallas-cowboys.jpg
│   │   ├── new-england-patriots.jpg
│   │   ├── green-bay-packers.jpg
│   │   ├── kansas-city-chiefs.jpg
│   │   ├── baltimore-ravens.jpg
│   │   ├── philadelphia-eagles.jpg
│   │   └── pittsburgh-steelers.jpg
│   ├── transit-default.jpg
│   ├── geography-default.jpg
│   ├── sports-default.jpg
│   └── default.jpg
```

#### Specific Card Image Requirements:

**DC Metro Cards:**
1. **Metro Center**: DC Metro hub, underground station
2. **Pentagon**: Pentagon station entrance or building
3. **Union Station**: Historic Union Station exterior/interior
4. **Foggy Bottom-GWU**: George Washington University campus area
5. **Dupont Circle**: Dupont Circle fountain and neighborhood
6. **Capitol South**: US Capitol building area
7. **Stadium-Armory**: Nationals Park or DC Armory
8. **L'Enfant Plaza**: L'Enfant Plaza architecture
9. **Navy Yard-Ballpark**: Nationals Park stadium

**Portland MAX Cards:**
1. **Pioneer Square North**: Pioneer Courthouse Square
2. **Washington Park**: Washington Park MAX station or park entrance

**Baltimore Metro Cards:**
1. **Lexington Market**: Historic Lexington Market interior/exterior
2. **BWI Airport**: BWI Marshall Airport terminal

**LA Metro Cards:**
1. **Union Station**: LA Union Station historic architecture
2. **7th St/Metro Center**: Downtown LA metro station
3. **Downtown Santa Monica**: Santa Monica Pier or downtown area

**US States Cards:**
1. **California**: Golden Gate Bridge, Hollywood Sign, or Lake Tahoe
2. **Texas**: State Capitol, Dallas skyline, or Big Bend National Park
3. **New York**: Statue of Liberty, Empire State Building, or Times Square
4. **Florida**: Miami Beach, Disney World, or Kennedy Space Center
5. **Alaska**: Denali, glaciers, or northern lights
6. **Colorado**: Rocky Mountains, Aspen, or Garden of the Gods
7. **Massachusetts**: Boston skyline, Harvard, or Cape Cod

**NFL Team Cards:**
1. **Dallas Cowboys**: AT&T Stadium or Cowboys star logo
2. **New England Patriots**: Gillette Stadium or Patriots logo
3. **Green Bay Packers**: Lambeau Field or Packers logo
4. **Kansas City Chiefs**: Arrowhead Stadium or Chiefs logo
5. **Baltimore Ravens**: M&T Bank Stadium or Ravens logo
6. **Philadelphia Eagles**: Lincoln Financial Field or Eagles logo
7. **Pittsburgh Steelers**: Heinz Field or Steelers logo

#### Card Image Specifications:
- **Resolution**: 400x300 pixels minimum, 600x400 preferred
- **Format**: JPG or PNG
- **Style**: Clean, recognizable, professional
- **Background**: Neutral or contextually appropriate
- **Quality**: High resolution, well-lit
- **File Size**: Under 200KB per image for web optimization

## 📋 Implementation Steps

### Step 1: Update City Photos
1. Download or source high-quality images for Portland and Baltimore
2. Replace the existing files:
   - Replace `public/photo-pdx.jpg` with new Portland image
   - Replace `public/photo-balt.jpg` with new Baltimore image
3. Ensure images match the specifications above

### Step 2: Create Card Directory Structure
```bash
cd /Users/GuestJawn/UrbanIQ/public
mkdir -p cards/{dc,pdx,balt,la,states,nfl}
```

### Step 3: Add Card Images
1. Source or create images for each card according to the specifications above
2. Place images in the appropriate directories
3. Ensure filenames match the mapping in `src/utils/cardImages.ts`

### Step 4: Update Card Data (Optional)
The card image mapping system is already implemented in `src/utils/cardImages.ts`. To add images to existing card data:

```typescript
import { addCardImages } from './utils/cardImages';

// When generating or loading cards:
const cardsWithImages = addCardImages(rawCardData);
```

### Step 5: Test Image Loading
1. Start the development server
2. Navigate through the app
3. Verify that:
   - Portland and Baltimore city photos load correctly
   - Card images display in the card collection
   - Images load without errors
   - Fallback mechanisms work for missing images

## 🎨 Image Sourcing Recommendations

### Free Image Sources:
- **Unsplash**: High-quality, free-to-use images
- **Pexels**: Free stock photos
- **Pixabay**: Free images and vectors
- **Wikimedia Commons**: Public domain images
- **City tourism websites**: Official city photos

### Paid Image Sources:
- **Shutterstock**: Extensive professional library
- **Getty Images**: Premium quality images
- **Adobe Stock**: Professional stock photos

### Specific Search Terms:
- **Portland**: "Portland skyline", "Powell's Books", "Portland bridges", "Keep Portland Weird"
- **Baltimore**: "Baltimore Inner Harbor", "USS Constellation", "National Aquarium Baltimore", "Fells Point"
- **DC Metro**: "Washington DC Metro", "Union Station DC", "Dupont Circle DC"
- **Sports Teams**: Team name + "stadium" or "logo"

## 🔧 Technical Notes

### Image Optimization:
- Use tools like TinyPNG or ImageOptim to compress images
- Consider WebP format for better compression
- Implement lazy loading for card images if performance issues arise

### Fallback System:
The Card component already includes error handling that falls back to the card icon if an image fails to load.

### Responsive Images:
Consider implementing responsive images with different sizes for different screen sizes:
```html
<img 
  src="card-small.jpg" 
  srcset="card-small.jpg 400w, card-medium.jpg 600w, card-large.jpg 800w"
  sizes="(max-width: 600px) 400px, (max-width: 900px) 600px, 800px"
  alt="Card name"
/>
```

## ✅ Verification Checklist

After completing the image updates:

- [ ] Portland city photo updated to downtown/cultural landmark
- [ ] Baltimore city photo updated to downtown/harbor landmark  
- [ ] Card directory structure created
- [ ] All DC Metro card images added
- [ ] All Portland card images added
- [ ] All Baltimore card images added
- [ ] All LA card images added
- [ ] All US States card images added
- [ ] All NFL team card images added
- [ ] Default/fallback card images added
- [ ] Images load correctly in development
- [ ] Images display properly in card components
- [ ] No console errors related to image loading
- [ ] Image optimization applied (file sizes reasonable)
- [ ] Mobile responsiveness verified

## 🚀 Next Steps

Once images are implemented:
1. Consider adding image preloading for smoother UX
2. Implement image caching strategies
3. Add alt text for accessibility
4. Consider adding image zoom/lightbox functionality for card details
5. Test image loading performance on slow connections

## 📞 Support

If you need help with:
- Sourcing specific images
- Image optimization techniques
- Troubleshooting image loading issues
- Implementing additional image features

Refer to the main project documentation or create an issue in the project repository.
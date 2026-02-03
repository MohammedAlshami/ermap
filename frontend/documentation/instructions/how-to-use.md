# 🎯 How to Modify the Map - AI Instructions

## Overview
The map library is designed so you only need to modify **ONE file** to change everything about the map.

---

## ⭐ THE ONLY FILE TO MODIFY

**`app/config/slidesConfig.tsx`**

This file contains ALL slide definitions. To modify the map:
1. Open `app/config/slidesConfig.tsx`
2. Find or add a slide
3. Modify properties
4. Save

**DO NOT modify any other files.**

### Slide Structure

```tsx
{
  id: 'unique-slide-id',              // Unique identifier
  title: 'Slide Title',               // Shows in slideshow controls
  description: 'Slide description',   // Shows below title
  duration: 8000,                     // Auto-advance time (ms)
  
  camera: {                           // Where to position the map
    center: [lng, lat],              // [longitude, latitude]
    zoom: 8,                         // Zoom level (0-22)
    pitch: 45,                       // Tilt angle (0-60)
    bearing: 0,                      // Rotation (-180 to 180)
  },
  
  layers: [...],                      // What to show on map
  legend: {...},                      // Legend configuration
  sidePanel: {...},                   // Side panel content
}
```

---

## ✏️ Common Modifications

### 1. Add a New Slide

Open `app/config/malaysiaSlides.tsx` and add to the array:

```tsx
{
  id: 'my-new-slide',
  title: 'New Slide Title',
  description: 'What this slide shows',
  duration: 8000,
  camera: {
    center: [116.0735, 5.9804],
    zoom: 8,
  },
  layers: [
    {
      id: 'new-data-source',
      source: {
        type: 'geojson',
        data: '/data/malaysia/path/to/data.geojson',
      },
      layers: [
        {
          id: 'new-layer',
          type: 'circle',
          paint: {
            'circle-radius': 8,
            'circle-color': '#FF5733',
          },
        },
      ],
    },
  ],
  legend: {
    title: 'Legend',
    position: 'bottom-left',
    entries: [
      { label: 'My Data', color: '#FF5733' },
    ],
  },
},
```

### 2. Change Camera Position

Find the slide in `malaysiaSlides.tsx` and modify the `camera` object:

```tsx
camera: {
  center: [NEW_LNG, NEW_LAT],  // Change coordinates
  zoom: 10,                     // Adjust zoom
  pitch: 60,                    // Change tilt
  bearing: -45,                 // Rotate map
},
```

### 3. Change Colors

Find the layer's `paint` property:

```tsx
paint: {
  'circle-color': '#NEW_COLOR',     // Change color
  'circle-radius': 10,              // Change size
  'circle-opacity': 0.8,            // Change transparency
}
```

### 4. Modify Legend

Find the `legend` object in the slide:

```tsx
legend: {
  title: 'New Legend Title',
  position: 'top-right',           // top-left, top-right, bottom-left, bottom-right
  entries: [
    { label: 'Category 1', color: '#FF0000' },
    { label: 'Category 2', color: '#00FF00' },
    { label: 'Category 3', color: '#0000FF' },
  ],
}
```

### 5. Update Side Panel Content

Find the `sidePanel.content` in the slide:

```tsx
sidePanel: {
  title: 'Panel Title',
  position: 'right',              // 'left' or 'right'
  width: '400px',
  collapsible: true,
  defaultExpanded: true,
  content: (
    <div className="p-6">
      {/* Add any React/HTML content here */}
      <h3>Your Custom Content</h3>
      <p>Statistics, charts, text, etc.</p>
    </div>
  ),
}
```

### 6. Change Slide Duration

```tsx
duration: 5000,  // 5 seconds
duration: 10000, // 10 seconds
```

### 7. Remove a Slide

Simply delete or comment out the entire slide object from the array.

---

## 🗺️ Layer Types Reference

### Circle (Points)
```tsx
{
  id: 'points-layer',
  type: 'circle',
  paint: {
    'circle-radius': 8,
    'circle-color': '#FF5733',
    'circle-stroke-width': 2,
    'circle-stroke-color': '#FFFFFF',
  },
}
```

### Fill (Polygons)
```tsx
{
  id: 'fill-layer',
  type: 'fill',
  paint: {
    'fill-color': '#FF5733',
    'fill-opacity': 0.7,
  },
}
```

### Line (Borders/Routes)
```tsx
{
  id: 'line-layer',
  type: 'line',
  paint: {
    'line-color': '#FF5733',
    'line-width': 2,
  },
}
```

### Heatmap
```tsx
{
  id: 'heatmap-layer',
  type: 'heatmap',
  paint: {
    'heatmap-weight': 1,
    'heatmap-intensity': 1,
    'heatmap-radius': 30,
  },
}
```

### Symbol (Labels)
```tsx
{
  id: 'labels-layer',
  type: 'symbol',
  layout: {
    'text-field': ['get', 'name'],
    'text-size': 12,
  },
  paint: {
    'text-color': '#000000',
    'text-halo-color': '#FFFFFF',
    'text-halo-width': 2,
  },
}
```

---

## 🎨 Data-Driven Styling

### Color by Value
```tsx
paint: {
  'fill-color': [
    'interpolate',
    ['linear'],
    ['get', 'value'],  // Property name from GeoJSON
    0, '#00FF00',      // value 0 = green
    50, '#FFFF00',     // value 50 = yellow
    100, '#FF0000',    // value 100 = red
  ],
}
```

### Match Categories
```tsx
paint: {
  'fill-color': [
    'match',
    ['get', 'category'],
    'high', '#FF0000',
    'medium', '#FFFF00',
    'low', '#00FF00',
    '#CCCCCC',         // default
  ],
}
```

---

## 📊 Using Dynamic Data

The slides receive data as props. Use them like this:

```tsx
// In malaysiaSlides.tsx
export const createMalaysiaSlides = (data: SlideDataProps): SlideConfig[] => {
  const { tourismData, waterScarcityData, hotelsGeoJSON } = data;
  
  return [
    {
      // ... slide config
      sidePanel: {
        content: (
          <div>
            {tourismData.map(item => (
              <div key={item.state}>
                {item.state}: {item.hotels} hotels
              </div>
            ))}
          </div>
        ),
      },
    },
  ];
};
```

---

## 🌏 Creating a New Country

1. **Copy the template:**
   ```bash
   cp app/config/malaysiaSlides.tsx app/config/thailandSlides.tsx
   ```

2. **Update the function name:**
   ```tsx
   export const createThailandSlides = (data) => { ... }
   ```

3. **Update data paths:**
   ```tsx
   data: '/data/thailand/hotels/hotels.geojson'
   ```

4. **Create a new page** (optional):
   ```tsx
   // app/thailand/page.tsx
   import { createThailandSlides } from '@/app/config/thailandSlides';
   
   const slides = createThailandSlides({ ... });
   ```

---

## ✅ Checklist for AI

When modifying the map:
- [ ] Open `app/config/malaysiaSlides.tsx`
- [ ] Find the relevant slide by `id` or `title`
- [ ] Modify only what's needed (camera, layers, legend, sidePanel)
- [ ] Ensure GeoJSON data paths are correct
- [ ] Keep the overall structure intact
- [ ] Don't modify `app/page.tsx` unless adding new data loading

---

## 🚫 What NOT to Touch

- ✅ **DO MODIFY**: `app/config/malaysiaSlides.tsx`
- ❌ **DON'T TOUCH**: `app/components/MapLibrary/` (unless adding library features)
- ⚠️ **RARELY MODIFY**: `app/page.tsx` (only for data loading)

---

## 💡 Pro Tips

1. **Test one slide at a time** - Comment out other slides during testing
2. **Use console.log** - Debug data in sidePanel content
3. **Check data paths** - Ensure files exist at specified paths
4. **Unique IDs** - Each slide and layer needs unique `id`
5. **GeoJSON properties** - Use `['get', 'propertyName']` to access feature properties

---

## 📝 Example: Complete Slide Modification

**Before:**
```tsx
{
  id: 'hotels',
  title: 'Hotels',
  camera: { center: [116, 5], zoom: 8 },
  layers: [/* hotels layer */],
}
```

**After (Modified):**
```tsx
{
  id: 'hotels',
  title: 'Hotel Distribution Analysis',  // Changed title
  camera: { center: [116.5, 5.5], zoom: 10, pitch: 45 },  // Changed camera
  layers: [
    {
      id: 'hotels-source',
      source: { type: 'geojson', data: '/data/malaysia/hotels/sabah_hotels.geojson' },
      layers: [
        {
          id: 'hotels-circles',
          type: 'circle',
          paint: {
            'circle-radius': 12,           // Bigger circles
            'circle-color': '#E74C3C',    // New color
            'circle-opacity': 0.9,        // More opaque
          },
        },
      ],
    },
  ],
  legend: {
    title: 'Hotels',
    entries: [
      { label: 'Hotel Locations', color: '#E74C3C' },  // Updated color
    ],
  },
}
```

---

## 🎯 Summary

**To modify the map, you only need to:**
1. Open `app/config/malaysiaSlides.tsx`
2. Find or add a slide
3. Modify camera, layers, legend, or sidePanel
4. Save the file

That's it! The library handles everything else automatically.

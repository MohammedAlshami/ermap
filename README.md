# 🗺️ ERMAP - Interactive Map Library

A powerful, customizable map visualization library built on Mapbox GL JS with an easy-to-use slide configuration system.

## 🌟 Features

- ✅ **Slide-based presentations** - Create interactive map slideshows
- ✅ **One file to modify** - All changes happen in `app/config/slidesConfig.tsx`
- ✅ **Fully customizable** - Legends, side panels, layers, and more
- ✅ **Type-safe** - Built with TypeScript
- ✅ **Multi-country ready** - Organized data structure for scalability
- ✅ **AI-friendly** - Clear cursor rules for AI assistance

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Mapbox account (free tier available)

### 1. Clone the Repository

```bash
git clone https://github.com/MohammedAlshami/ermap.git
cd ermap
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Get Your Mapbox API Key

1. Go to [Mapbox](https://www.mapbox.com/)
2. Sign up for a free account (or sign in)
3. Go to your [Account Dashboard](https://account.mapbox.com/)
4. Navigate to **Access Tokens**
5. Copy your **Default Public Token** or create a new one
   - For production, create a token with URL restrictions for security

### 4. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Mapbox token:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

⚠️ **Important:** Never commit `.env.local` to git (it's already in `.gitignore`)

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Documentation

All documentation is in the `documentation/` folder:

- **[Quick Start](documentation/index.md)** - Overview and quick reference
- **[How to Use](documentation/instructions/how-to-use.md)** - Complete guide for modifying slides
- **[Component API](documentation/components/MapLibrary.md)** - Full API reference
- **[Project Structure](documentation/PROJECT_STRUCTURE.md)** - Architecture overview

## 🎯 How to Modify the Map

**Only one file needs to be modified:** `app/config/slidesConfig.tsx`

```tsx
// app/config/slidesConfig.tsx

export const createSlides = (data: SlideDataProps): SlideConfig[] => {
  return [
    {
      id: 'my-slide',
      title: 'My Slide',
      camera: {
        center: [longitude, latitude],
        zoom: 8,
      },
      layers: [/* your layers */],
      legend: {/* your legend */},
      sidePanel: {/* your panel */},
    },
    // Add more slides...
  ];
};
```

See [How to Use](documentation/instructions/how-to-use.md) for detailed examples.

## 📂 Project Structure

```
ermap/
├── app/
│   ├── config/
│   │   └── slidesConfig.tsx        ⭐ MODIFY THIS FILE
│   ├── components/MapLibrary/      🔒 Core library
│   └── page.tsx                    Main page
├── documentation/                  📚 All documentation
├── public/data/                    🗺️ Data organized by country
│   └── malaysia/
│       ├── speedmart/
│       ├── hotels/
│       ├── geojson/
│       └── statistics/
└── .cursor/rules/                  🤖 AI rules
```

## 🌍 Adding New Countries

1. Create data structure:
   ```
   public/data/[country-name]/
   ├── hotels/
   ├── speedmart/
   ├── geojson/
   └── statistics/
   ```

2. Add your data files

3. Update `app/config/slidesConfig.tsx` with new slides

See the [country template](app/templates/country-template.tsx) for reference.

## ⌨️ Keyboard Controls

- **← / →** - Navigate between slides
- **Space** - Play/Pause slideshow
- **Click indicators** - Jump to specific slide

## 🛠️ Built With

- [Next.js 15](https://nextjs.org/) - React framework
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) - Map rendering
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## 📋 Cursor Rules

This project has AI rules in `.cursor/rules/`:

- **read-docs-first** - Read documentation before making changes
- **modify-slides-only** - Only modify `slidesConfig.tsx`
- **no-readme** / **no-md** - No README files except in documentation/
- **data-organization** - Data structure conventions
- **typescript-rules** - Code quality standards

## 🔐 Security Notes

- Never commit `.env.local` to version control
- The `.env.example` file is provided as a template
- For production, use environment variables in your hosting platform:
  - **Vercel**: Add `NEXT_PUBLIC_MAPBOX_TOKEN` in project settings
  - **Netlify**: Add in environment variables section
  - **Other platforms**: Follow their environment variable setup

## 📦 Deployment

### Vercel (Recommended)

1. Push your code to GitHub (already done!)
2. Go to [Vercel](https://vercel.com/)
3. Import your repository
4. Add environment variable: `NEXT_PUBLIC_MAPBOX_TOKEN`
5. Deploy

### Other Platforms

Set the environment variable `NEXT_PUBLIC_MAPBOX_TOKEN` in your platform's configuration.

## 🤝 Contributing

This is a proprietary project. For questions or issues, contact the repository owner.

## 📝 License

Private - All rights reserved.

## 🆘 Troubleshooting

### Map doesn't load
- Check that `NEXT_PUBLIC_MAPBOX_TOKEN` is set in `.env.local`
- Verify your Mapbox token is valid
- Check browser console for errors

### Layers not showing
- Verify data file paths are correct
- Check that GeoJSON files exist in `public/data/`
- Ensure layer IDs are unique

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Delete `.next` folder and restart dev server
- Check for TypeScript errors with `npm run build`

## 📞 Support

- **Documentation**: Check the `documentation/` folder
- **Issues**: Open an issue on GitHub
- **Contact**: [Your contact information]

---

**Made with ❤️ for interactive map visualizations**

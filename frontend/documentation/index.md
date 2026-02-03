# Documentation Index

## For AI/Developers: How to Use This Library

📖 **[How to Use the Map Library](instructions/how-to-use.md)**
- Complete guide on modifying slides
- Examples for common modifications
- Layer types reference
- Data-driven styling examples

## Component API Documentation

📚 **[MapLibrary Component API](components/MapLibrary.md)**
- Full API reference
- Component props
- Type definitions
- Advanced features

## Quick Reference

### To Modify the Map:
1. Open `app/config/slidesConfig.tsx` ⭐
2. Find or add a slide
3. Modify camera, layers, legend, or sidePanel
4. Save

**That's it! Only modify this ONE file.**

### Key Files:
- `app/config/slidesConfig.tsx` - **⭐ ONLY FILE TO MODIFY**
- `app/page.tsx` - Data loading (don't touch)
- `app/components/MapLibrary/` - Core library (don't touch)

---

## Cursor Rules

The project has Cursor AI rules in `.cursor/rules/`:
- `read-docs-first.mdc` - Read documentation before making changes
- `modify-slides-only.mdc` - Only modify slide config files
- `no-readme.mdc` / `no-md.mdc` - Never create README files
- `data-organization.mdc` - Data folder structure
- `typescript-rules.mdc` - Code quality standards

**These rules ensure AI follows project conventions automatically.**

# Assets

This folder is referenced by `app.config.ts`. For first run, supply:

- `icon.png` — 1024×1024 app icon
- `splash.png` — splash image (~1284×2778)
- `adaptive-icon.png` — Android adaptive icon
- `notification-icon.png` — monochrome notification icon

Until these are added, you can copy placeholders from `expo init` output
or use Expo's default set via:

```bash
npx create-expo-app@latest --no-install --template blank-typescript ./tmp
cp ./tmp/assets/* ./apps/mobile/assets/
rm -rf ./tmp
```

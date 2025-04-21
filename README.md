# Autoplus Admin Platform

Admin dashboard for the Autoplus automotive platform.

## Project Structure

This project uses a monorepo-like structure with shared code:

- `src/` - Admin platform source code
- `shared/` - Shared utilities, services, and components

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Deployment to Vercel

For proper deployment to Vercel, ensure:

1. The `shared` directory is included in the repository
2. All imports from shared code use the alias `autoplus-shared` instead of relative paths like `../../../../shared`
3. The `vite.config.js` properly aliases `autoplus-shared` to the local shared directory

## Troubleshooting

If deployment fails with "Could not resolve" errors related to shared paths, check:
- All imports are using the alias `autoplus-shared`
- The shared directory is properly included in the deploy
- Build configuration in vercel.json is correct

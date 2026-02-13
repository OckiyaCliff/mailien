# Contributing to Mailien

Thank you for wanting to contribute to Mailien! 🎉

## Getting Started

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/mailien.git
cd mailien

# 2. Install dependencies
pnpm install

# 3. Build all packages
pnpm run build

# 4. Run the demo
cd apps/demo && pnpm run dev
```

## Development Workflow

1. **Create a branch** from `main` for your feature or fix.
2. **Make your changes** in the relevant package(s).
3. **Build** to verify: `pnpm run build`
4. **Test** if applicable: `pnpm run test`
5. **Open a Pull Request** targeting `main`.

## Project Structure

```
mailien/
├── apps/demo/               # Next.js demo application
├── packages/
│   ├── core/                # @mailien/core — headless engine
│   ├── next/                # @mailien/next — webhook handlers
│   ├── ui/                  # @mailien/ui — React components & hooks
│   └── adapters/
│       ├── prisma/          # @mailien/prisma-adapter
│       └── supabase/        # @mailien/supabase-adapter
└── plugins/
    └── stellar/             # @mailien/stellar (experimental)
```

## Code Style

- **TypeScript** for all source files
- **Prettier** for formatting — run `pnpm run format`
- **Functional style** — prefer pure functions and immutability
- **No `any`** unless absolutely necessary (adapters are an exception)

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(core): add bulk message processing
fix(ui): resolve InboxList re-render loop
docs: update API reference with new hook
chore: bump tsup to v9
```

## Adding a New Adapter

1. Create a new directory under `packages/adapters/`
2. Implement the `MailienAdapter` interface from `@mailien/core`
3. Add build scripts (`tsup.config.ts`, `tsconfig.json`)
4. Export your adapter from `src/index.ts`
5. Add to the workspace in `pnpm-workspace.yaml`

## Reporting Issues

Use the [GitHub Issue Templates](.github/ISSUE_TEMPLATE/) to report bugs or request features.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

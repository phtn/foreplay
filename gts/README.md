# gts

Gleam domain modules compiled to JavaScript for the Foreplay Next.js app.

`src/tournament_entry.gleam` owns the pure normalization and validation rules
used by the tournament-entry server action. `src/formatters.gleam` owns the
pure label-formatting rules used by `utils/formatters.ts`. Host APIs such as
`Intl`, Firebase authentication, Convex mutations, and receipt uploads stay in
TypeScript at the application boundary.

From the repository root:

```sh
bun run gleam:build
bun run test:gts
```

The compiler writes JavaScript modules and TypeScript declarations to
`gts/build/dev/javascript`. The root `tsconfig.json` exposes those modules
through the `gts/*` path alias, and the app's `dev`, `build`, and `start`
scripts compile them before starting Next.js.

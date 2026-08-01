# gts

Gleam domain modules compiled to JavaScript for the Foreplay Next.js app.

`src/tournament_entry.gleam` owns the pure normalization and validation rules
used by the tournament-entry server action. `src/formatters.gleam` owns the
pure label-formatting rules used by `utils/formatters.ts`.
`src/staff_list_filter.gleam` owns the staff claim selection, user search, and
ordering rules used by the admin staff list. `src/registration_action.gleam`
owns tournament-registration lifecycle classification and action priority.
Host APIs such as `Intl`, locale normalization and collation, URI encoding,
Firebase authentication, Convex mutations, and receipt uploads stay in
JavaScript or TypeScript at the application boundary.

From the repository root:

```sh
bun run gleam:build
bun run test:gts
```

The compiler writes JavaScript modules and TypeScript declarations to
`gts/build/dev/javascript`. The root `tsconfig.json` exposes those modules
through the `gts/*` path alias, and the app's `dev`, `build`, and `start`
scripts compile them before starting Next.js.

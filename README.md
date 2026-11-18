# RoboValue — Anonymous Review Website

React / Vite website for anonymous review of RoboValue, a fine-grained sim-and-real benchmark for robotic value models.

## Development

Use Node.js 22:

```sh
npm ci
npm run dev
npm run build
```

## Content

- Home: `/`
- Documentation: `/doc/`
- Leaderboard: `/leaderboard/`
- Evaluation: `/eval/`

Documentation covers the dataset, evaluation workflow, model adapter interface, metrics, 15 simulation tasks, 20 real-world tasks, and diagnostic trajectories. Home and Leaderboard share one Overall ranking across evaluation settings, with Setting badges, capability scores, per-condition raw metrics, sorting and CSV export. The current result snapshot contains 24 configurations (17 Zero-Shot and 7 One-Shot), plus SIA-only results in the detailed table. No Full-Shot results are reported.

Results follow the November 19, 2026 research snapshot. Overall uses 30% Understanding, 20% Monitoring, 30% Reasoning and 20% Consistency; fixed-reference calibration retains negative contributions. Published capability scores are preserved without reconstructing unreported raw VROC values. Task specifications and research assets retain their previously reviewed snapshot. Missing values remain missing. Hardware names and the names, sources and logos of evaluated models identify the benchmark setup and related work, rather than project authors.

## Anonymous Review

The review source excludes author names, affiliations, author homepages, social media, news, project video, citation details, community groups, QR codes and links to non-anonymous project resources. Dataset links are withheld. The Home Code button links to the anonymous implementation at https://github.com/robovalue/RoboValue. Media and fonts are served locally. No visitor analytics are included. The evaluation form is display-only during review: submission is disabled, no backend is configured and no application data is sent.

The intended repository is `robovalue/robovalue.github.io`, deployed at `https://robovalue.github.io/`. Keep the repository history, author and committer identities, and publishing account anonymous. Never import another repository's Git history, private documents, credentials or backend operations.

## Deployment

The GitHub Pages workflow in `.github/workflows/pages.yml` installs locked dependencies, builds the frontend and deploys `dist`. The build emits HTML entry files for all registered routes so direct links and refreshes work on GitHub Pages.

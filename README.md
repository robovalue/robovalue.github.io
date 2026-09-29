# RoboValue project website

Anonymous documentation website and interactive leaderboard. A static React / Vite site;
no backend, login, visitor analytics, or external media services are required.

## Run locally

Use Node.js 22 (Node.js 18.20+ is also supported by the current build).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. For a production preview:

```sh
npm run build
npm run preview
```

## Publish to GitHub Pages

The intended repository is `robovalue/robovalue.github.io`.

1. Upload the source using the dedicated project publishing identity, including
   `.github/workflows/pages.yml` and `package-lock.json`. Do not upload
   `node_modules`, `validation`, or an existing `.git` history.
2. In the repository, choose **Settings → Pages → Source → GitHub Actions**.
3. Push to `main`. The workflow builds the site and publishes `dist`.
4. Check the completed workflow and open `https://robovalue.github.io/`.

Alternatively, a maintainer may publish the **contents** of the built `dist`
directory to the root of a dedicated Pages branch, then choose **Deploy from a
branch** in Pages settings. Do not upload a zip file as the website itself.

## Page structure

- Home: `/`
- Get Started: `/get-started/`, with installation, data, evaluation, model adapters, and protocol pages
- Simulation Tasks: `/simulation-tasks/` and a task catalog
- Real-World Tasks: `/real-world-tasks/` and a task catalog
- Leaderboard: `/leaderboard/`

Missing setup instructions intentionally have a title and navigation only.
The task catalogs contain 15 simulation and 20 real-world task pages.
Add entries in `src/navigation.js`, then connect their content in `src/main.jsx`.
The Vite build emits an `index.html` for every registered URL, so direct links and
refreshes work on GitHub Pages without server-side routing. All data and media stay local.

## Update content

| File | Purpose |
| --- | --- |
| `src/navigation.js` | Sidebar groups and page URLs; entries without a `kind` are empty pages |
| `src/main.jsx` | Documentation shell, Home, and page content |
| `src/benchmark.jsx` | Leaderboard, protocol, and diagnostic examples |
| `src/tasks.jsx`, `src/tasks.css` | Task overviews, catalogs, and task details |
| `src/data/tasks.json` | Manuscript task specifications and image references |
| `src/docs.css` | Documentation layout and responsive styles |
| `src/style.css` | Shared benchmark component styles |
| `public/data/results.json` | All leaderboard scores and source identification |
| `public/assets/` | Figures and example frames |

The leaderboard uses Tables 1–2 of the supplied manuscript, with 15 model
variants and 18 evaluation configurations. Values are stored on the paper's
×100 scale. Conditions are `id`, `emb`, and `env`; settings are `zero` and `one`.
Missing results are `null`, never zero. TRR and CSVC are absent under OOD.
FPL is minimized; other metrics are maximized. Best-score highlighting compares
all models in the selected condition and setting, independently of the search.
There is no overall aggregate score. CSV export includes the visible filtered
rows and columns, in their displayed order.

To verify this manuscript snapshot's table extraction, install PyMuPDF in a
Python environment and run:

```sh
python scripts/extract_results.py /path/to/RoboValue.pdf --check
```

The extractor targets Tables 1 and 2 on pages 7 and 8 and fails if
the expected rows or cells change. For a new manuscript, update the extractor
and inspect the tables before replacing the JSON. Update the source hash as
well as the scores. Website users do not need Python.

## Task content

Task pages are based on the supplied manuscript’s Appendices C and D: instructions,
scene descriptions, subtasks, three evaluation conditions, execution examples, and
counterfactual change summaries. The summaries are not full counterfactual prompts.

To regenerate them from the reviewed 86-page manuscript layout, install PyMuPDF
and Pillow in a Python environment and run:

```sh
python scripts/extract_tasks.py --paper /path/to/manuscript.pdf \
  --overview /path/to/dataset3.pdf --audit /path/outside/repo/task-extraction.json
```

This script targets that manuscript layout; inspect its output when the paper
changes. It writes task JSON and metadata-free WebP assets, not the source PDFs.
Source inconsistencies are recorded privately for author review. Task wording
remains aligned with the manuscript until its revision.

## Private input materials

Place unpublished manuscripts, original images, and drafts in the sibling
`../robovalue-website-inputs/` directory (`paper/`, `images/`, `notes/`).
It is outside this repository and is never included in the site build.
Files there are reference materials, not approved public assets.

Paper, arXiv, Code, and Dataset currently have disabled placeholder buttons.
There is no public manuscript PDF in the current source or build. A future
release requires an explicitly provided destination and an anonymity check.
Removing a file from the current site does not remove old Git revisions or
copies published previously.

## Review version

Keep public account details, commit author/committer identities, downloaded
documents, media, and links anonymous. Assets are served locally; no analytics are installed.
Code and dataset links remain marked as forthcoming until anonymous public
destinations are provided. Do not replace those labels with personal links
during review. Review anonymity still needs a check of the published repository
and page after deployment.

The leaderboard currently reflects the previously supplied manuscript; update
its scores only after checking a new manuscript snapshot.

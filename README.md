# RoboValue project website

Anonymous project page and interactive leaderboard. A static React / Vite site;
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

## Update content

| File | Purpose |
| --- | --- |
| `src/main.jsx` | Page text, sections, metric explanations, diagnostic frames |
| `src/style.css` | Responsive layout and colors |
| `public/data/results.json` | All leaderboard scores and source identification |
| `public/assets/` | Figures and example frames |
| `public/RoboValue.pdf` | Anonymous manuscript |

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

## Review version

Keep public account details, commit author/committer identities, downloaded
documents, media, and links anonymous. The original author metadata is empty
in the supplied PDF. Assets are served locally; no analytics are installed.
Code and dataset links remain marked as forthcoming until anonymous public
destinations are provided. Do not replace those labels with personal links
during review. Review anonymity still needs a check of the published repository
and page after deployment.

The manuscript's references to appendix material are preserved. The current
download is the supplied 14-page manuscript, including the start of Appendix A;
the remaining appendices are not included in this file.

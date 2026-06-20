# Civics 128

A single-file study web app for the **2025 USCIS Naturalization Civics Test** (the 128-question
pool used for Form N-400 filed on or after Oct 20, 2025).

You type an answer to each question, the app **auto-grades** it against the official accepted
answers (with a **self-grade override** when it gets it wrong or can't verify), and it **persists
your full study history** — every answer, every grade, and every test score — in your browser
across sessions.

## Features

- **Type-then-check flow** — answer in your own words before the official answer is revealed.
- **Auto-grading** — fuzzy matching that handles parenthetical phrasing, abbreviations
  (D.C., U.S.), and number words vs. digits (`nine` ↔ `9`, `fourteenth` ↔ `14th`).
  "Name two/three/five…" questions require that many *distinct* correct answers. You can always
  override the grade yourself.
- **Four modes**
  - **Practice** — the full 128-question pool, jump anywhere.
  - **Rotation** — the pool split into 7 manageable rounds.
  - **Test** — a scored exam: a random **20-question** subset (pass = 12/20, like the real
    interview) or the **full 128** (pass = 60%). Interrupted tests are **saved and resumable**.
  - **History** — lifetime accuracy, questions seen, and a log of past test scores.
- **Persistent** — all progress is stored in `localStorage`; close the tab and pick up later.
- **Self-contained** — one `index.html`, no build step, no dependencies, works offline.

## How study history is stored

Everything lives under a single versioned `localStorage` key (`civics128:v1`):

| Field        | Purpose |
|--------------|---------|
| `status`     | Latest result per question (drives the board + stats). |
| `attempts`   | Append-only log of every answer: `{ id, ts, answer, auto, result, test }`. `answer === ""` means skipped; `result !== auto` means you overrode the auto-grade; `test` links the attempt to a scored test (else `null`). Capped to the most recent 2,000. |
| `tests`      | One record per completed scored test: `{ id, ts, total, correct, score }`. Pass/fail is computed from the threshold, not stored; the test's questions are derivable from `attempts` (`test === id`). |
| `activeTest` | The in-progress test, if any — saved after every answer so it can be resumed. |

If `localStorage` is unavailable (e.g. private browsing), the app degrades gracefully to
in-memory progress for the session.

## Run locally

It's a static file — just open it:

```sh
open index.html        # macOS
# or serve it:
python3 -m http.server
# then visit http://localhost:8000
```

## Deploy

Any static host works. For **GitHub Pages**: enable Pages on this repo (Settings → Pages →
deploy from branch, root). The app is served directly from `index.html`.

## Accuracy note

Answers to questions about **current officials** (President, Speaker, etc.) and **your state**
(your senators/representative, governor, capital) change over time and can't be auto-graded — the
app flags these as *Varies* and asks you to self-grade. Always verify current answers at
[uscis.gov/citizenship/testupdates](https://www.uscis.gov/citizenship/testupdates).

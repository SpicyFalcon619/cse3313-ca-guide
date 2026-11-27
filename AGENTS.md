# Task: rebuild the CSE 3313 Computer Architecture notes in the style of the CSE 3811 AI guide, and add Lectures 5, 6 and 7

You are continuing work started by another assistant that ran out of budget. Read this whole file first. The owner is Ahmad Maruf Hossain (GitHub `SpicyFalcon619`).

## Goal

Turn the existing single-page CA class-test notes into a multi-page study site with the same design, navigation, visualisers and lesson format as the AI guide. Then add the CT-2 topics: **Lecture 5 (MIPS memory and word addressing), Lecture 6 (MIPS functions and the stack), Lecture 7 (MIPS machine language)**.

The existing notes (CT-1: performance, clock, CPI, power, Amdahl, 20 solved past midterms, drills, quiz) must all be kept. Nothing may be dropped.

## Where everything is

| What | Path |
|---|---|
| The AI guide (the style to copy, and the code to reuse) | `D:\D Drive\Personal Folder\Projects\ai-search-guide` (git repo, remote `SpicyFalcon619/cse3811-ai-guide`, site `https://spicyfalcon619.github.io/cse3811-ai-guide/`) |
| The old CA notes, as one HTML file (237 KB, light/dark, old style) | `reference/old-ca-notes.html` (in this folder) |
| Lecture slides | `D:\D Drive\Personal Folder\University\8th Trimester\Computer Architecture (CSE 3313)\01 Lecture Slides\` |
| Lectures to add | `Lecture 05 - MIPS Memory and Word Addressing (Revised).pptx`, `Lecture 06 - MIPS Functions and the Stack (Revised).pptx`, `Lecture 07 - MIPS Machine Language (Updated).pptx` |
| Past midterms (20 PDFs) | `...\04 Midterm Past Questions\` |
| Class test | `...\05 Class Tests\` |
| Handwritten notes and index | `...\03 Handwritten Notes\` |
| Syllabus | `...\00 Course Info\CSE 3313 - Course Syllabus.pdf` |
| Textbook | `...\02 Textbook\Computer Organization and Design, 5th Edition (Patterson and Hennessy).pdf` |

Make the new project a git repo here (`D:\D Drive\Personal Folder\Projects\cse3313-ca-guide`), but do **not** create a GitHub repo, push or publish until the owner says so.

## How the AI guide is built (reuse this, do not reinvent it)

- Source lives in `src/`: `pages.html` (one `<article class="page" id="..." data-title data-group>` per page), `style.css` (all design tokens and components), `ui.js` (navigation, hero bands, widgets, themes, progress), `engine.js` (the algorithms), `dropdown.js` (themed select), `editor.js`, `data.js`.
- `build.py` inlines everything into one `dist/index.html`. `tests/*.test.js` check the engines against hand-worked answers; the GitHub Action runs the tests and then builds.
- Copy `src/style.css`, the navigation, hero, `.lesson` ("Learn it first" with numbered beats, side cards, check-yourself), `.sim` visualiser frame, `.card`, `.rule`, themed dropdown, three themes (paper, dark, charcoal), progress tracking and the background toggle. Change the wording, the route graphic and the page set, not the design.
- Design system: 8px radius for controls and panels, 12px for large frames, 1px lines, one soft shadow, one blue accent (`--hl`); amber, teal, green and red only for states. Fonts: Young Serif (display), Atkinson Hyperlegible (body), JetBrains Mono. Keep all pages free of horizontal scroll at 390px.
- Store progress under a new localStorage key (for example `cse3313-done`), not `cse3811-done`.

## Page plan

Groups in the top navigation (keep the CT-1 content, add CT-2):

1. **Start here**: course map, plain-English words (the old glossary), "what can come and how to answer it" (old section Q).
2. **Performance (CT-1)**: define performance, time, the clock, clock calculations, CPI, the CPU equation, what affects performance, power wall, multicore, Amdahl's law, class-note problems, fallacies. One page per old section (`s-define`, `s-time`, `s-clock`, `s-clock-calc`, `s-cpi`, `s-eq`, `s-affects`, `s-power`, `s-multi`, `s-amdahl`, `s-notes`, `s-pitfalls`).
3. **MIPS (CT-2)**: new pages, one per lecture topic (see below).
4. **Exam**: the 20 solved past midterms (old section P), drills, quiz, calculators.

Every new page follows the AI guide pattern: a "Learn it first" lesson (short numbered beats, one worked example by hand as a table, "in one line" and "exam habit" side cards, check-yourself questions), then a visualiser or calculator, then the exam-style practice with a worked answer.

### New CT-2 content to build from the three decks

Read each deck (`python-pptx` works; extract the text, and export slides to PNG with PowerPoint COM or `pymupdf` if a slide is an image) and build pages for what they actually teach. Expected topics, to confirm against the slides:

- **Lecture 5, memory and word addressing:** memory as a byte array, word size, byte vs word addressing, address arithmetic (word address x 4 = byte address), `lw` and `sw` with offsets, array access `A[i]`, alignment, big vs little endian, registers vs memory. Visualiser: a memory table where you pick base, offset and `lw`/`sw`, and it shows the address, the bytes touched and the register result.
- **Lecture 6, functions and the stack:** `jal` and `jr $ra`, argument registers `$a0-$a3`, return values `$v0-$v1`, saved vs temporary registers (`$s`, `$t`), the stack pointer `$sp`, push and pop, stack frames, leaf and non-leaf procedures, recursion (for example factorial). Visualiser: step through a call with the stack drawn and `$sp`, `$ra` and registers updating each instruction.
- **Lecture 7, machine language:** R-type, I-type and J-type formats, field widths (6/5/5/5/5/6, 6/5/5/16, 6/26), opcode and funct, register numbers, immediate encoding, branch offsets and jump addresses, translating assembly to hex and back. Visualiser: type an instruction, see the fields and the 32-bit binary and hex; or paste hex and decode it. Tests must check the encoder against known encodings from the slides.

For every number or encoding you show, write a test (`tests/*.test.js`) that checks it against a value taken from the slides or the textbook, as the AI guide does.

## Past papers and exam focus

Only CT-2 questions from the past midterms that touch Lectures 5 to 7 need to be added to the "Exam" group, solved the same way as the existing section P. Read the PDFs with `pymupdf` and view the page images when a figure matters. State assumptions. If a question is ambiguous, say so on the page instead of guessing.

## Rules from the owner (follow all of them)

- **No decorative emojis** anywhere in the UI, pages, README or commits. Use text, numbering or inline SVG instead.
- **Git identity:** commits are authored and committed as `Ahmad Maruf Hossain <hossainmysterio619@gmail.com>`. Check `git config user.email` in this repo and set it locally if it differs.
- **Never credit an AI** in git or GitHub: no `Co-Authored-By` trailer, no "Generated with" line, no AI as author or committer.
- The active `gh` account must stay `SpicyFalcon619`.
- Write for a student who is learning this for the first time: plain words, a worked example before the rule, define every term. The owner said the first AI guide "didn't teach enough", so every topic needs a real explanation, not only rules and tables.
- Do not touch any other course folder. In the University repo, never change `Software Engineering Laboratory (CSE 3422)`.
- Ask before publishing, pushing, or creating anything public.

## Verify before you say you are done

1. `node tests/*.test.js` all pass.
2. `python build.py` succeeds and `dist/index.html` opens from disk.
3. Load every page in headless Chrome and check for script errors (the AI project has a harness: `errcheck.py` idea, loop over each `article.page` id, set `location.hash`, record `window.onerror`).
4. Screenshot at 1300 px and 390 px, in all three themes, for the home page, one lesson page and each visualiser. Look for overlap, clipped text and horizontal scroll.
5. Every old section of `reference/old-ca-notes.html` still exists somewhere in the new site (make a checklist and tick it).

## Suggested order of work

1. `git init`, copy the AI guide's `src/` and `build.py` as the starting point, strip the AI-specific pages, engines and data.
2. Port the old CA content page by page into `pages.html` (glossary, Q, each performance section, the calculators, drills, quiz, the 20 solved papers). Keep the calculators working.
3. Build the Lecture 7 encoder and its tests first (smallest, most checkable), then Lecture 5, then Lecture 6.
4. Write the lessons, the course map, the README (professional, same shape as the AI guide README) and a GitHub Pages workflow file (do not push).
5. Run the verification list, then report what is done and what is not.

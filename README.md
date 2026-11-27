# CSE 3313 Computer Architecture Guide

An interactive study guide for CSE 3313. Start with how a computer runs one instruction, then build up to processor performance and MIPS. Lessons use examples from the course slides, with worked tables, self-check questions and exam practice.

## What it covers

| Part | Topics |
|---|---|
| Start here | Computer basics, a study map, a glossary, and common exam question types |
| Performance (CT-1) | Response and CPU time, clock rate, instruction count, CPI, power, multicore processing, and Amdahl’s law |
| Lecture 5 | Byte and word addresses, load and store, arrays, alignment, byte order, labels, branches and loops |
| Lecture 6 | Arguments, return values, calls, the stack, saved registers, and recursion |
| Lecture 7 | R-, I- and J-type fields, binary and hex, branch and jump targets, and modified instruction formats |
| Exam | Worked CT-1 and CT-2 questions from the 20-paper collection, Class Test 1, calculators, drills, and a 39-question quiz |

## Study tools

- **Performance calculators.** Find CPU time and clock period, compare power, and check what an upgrade can do for the whole program.
- **Word memory.** Enter a base and byte offset, load or store one word, and see which four bytes change.
- **Function calls.** Step forward or back through calls and recursion while watching the registers and active stack words.
- **Instruction encoder and decoder.** Convert an assembly instruction or hex word, and inspect each field, its width and its decimal value. Use numeric byte targets for branch and jump examples.
- **Progress and themes.** Choose paper, dark or charcoal, toggle background animation, and mark pages as understood. The guide saves these preferences in your browser.

## Run it locally

Use Python 3.12 or later to build and Node.js 24 to run the tests. The build and tests use standard libraries.

```sh
node --test 'tests/*.test.js'
python build.py
```

Open `dist/index.html` in your browser. The build inlines the site’s pages, styles and scripts. The original design’s fonts load from Google Fonts when available, and the site uses system fonts offline.

## Project layout

| Path | Contents |
|---|---|
| `src/pages.html` | Course map, lessons, CT-1 notes and practice |
| `src/ct2-papers.html` | CT-2 questions, explanations and machine-code tables |
| `src/style.css` | Theme tokens, responsive layout and components |
| `src/ui.js`, `src/dropdown.js` | Navigation, browser preferences, and themed selects |
| `src/engine.js`, `src/practice.js` | Performance formulas, calculators, drills and quiz |
| `src/mips.js`, `src/mips-ui.js` | Instruction fields, memory bytes, procedure traces and the visualisers |
| `tests/` | Numerical and instruction-field checks |
| `build.py` | Builds the single HTML file in `dist/` |
| `.github/workflows/pages.yml` | Tests, builds and deploys to Pages when run manually |

## How the answers are checked

The tests use Lecture 4 and the Class Test 1 answer key for performance, Lecture 5 and the course textbook for memory, Lecture 6 for calls and stack addresses, and Lecture 7 for machine-code fields and recursive factorial. The past-paper notes spell out assumptions about signed offsets, byte addressing and ambiguous C code. The stack tool uses the lectures’ simplified execution model where a function call links to `PC + 4`.

## GitHub Pages

The Pages workflow has a manual trigger. When publishing is authorised, select GitHub Actions as the Pages source and run the workflow. It uploads only the built `dist/` folder. [GitHub Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Author

Ahmad Maruf Hossain ([@SpicyFalcon619](https://github.com/SpicyFalcon619))

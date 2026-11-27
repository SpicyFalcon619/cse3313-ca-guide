# CSE 3313 · Computer Architecture Study Guide

**[Open the live Computer Architecture guide](https://spicyfalcon619.github.io/cse3313-ca-guide/)**

Learn how a processor runs a program, how to measure its performance, and how MIPS instructions work. The guide uses examples from the course slides, step-by-step visualisers and worked past-paper questions.

## Start studying

- **Starting CT-2?** Take the [beginner course](https://spicyfalcon619.github.io/cse3313-ca-guide/#ct2-start). Its 22 lessons start with how a computer runs a program and build up to full exam questions. Use the [instruction and term index](https://spicyfalcon619.github.io/cse3313-ca-guide/#ct2-words) for a quick lookup.
- **New to computer architecture?** Follow one instruction from storage to the CPU in [How a computer runs a program](https://spicyfalcon619.github.io/cse3313-ca-guide/#earlier).
- **Preparing for the midterm?** Use the [Midterm study route](https://spicyfalcon619.github.io/cse3313-ca-guide/#midterm) to see what to study in order, then work through [past midterm questions](https://spicyfalcon619.github.io/cse3313-ca-guide/#s-past).
- **Reviewing a calculation?** Start with [Performance in four steps](https://spicyfalcon619.github.io/cse3313-ca-guide/#performance-review), then check your work with the [calculators](https://spicyfalcon619.github.io/cse3313-ca-guide/#calculators).

## Course coverage

| Topic | What you can learn and practise |
| --- | --- |
| Performance · CT-1 | Compare CPU and elapsed time, calculate cycles and CPI, and work through dynamic power and Amdahl’s law. |
| [Memory and word addressing](https://spicyfalcon619.github.io/cse3313-ca-guide/#mips-memory) · Lecture 5 | Find a word’s byte address. Run a load or store and see which four bytes it reads or writes. |
| [Functions and the stack](https://spicyfalcon619.github.io/cse3313-ca-guide/#mips-functions) · Lecture 6 | Step through a call or recursive function and watch registers, return addresses and stack words change. |
| [Machine language](https://spicyfalcon619.github.io/cse3313-ca-guide/#mips-machine) · Lecture 7 | Encode or decode an instruction. Inspect its R-, I- or J-format fields and calculate branch and jump targets. |
| Exam practice | Work through questions from 20 past midterms, practise with random drills, or take the 39-question performance quiz. |

The guide runs in your browser. It saves your progress and your choice of paper, dark or charcoal theme on that device.

## Build and test locally

Use Python 3.12 or later and Node.js 24. The build and tests use their standard libraries.

```sh
node --test 'tests/*.test.js'
python build.py
```

Open `dist/index.html` in your browser. The build bundles the lessons, styles and scripts into that one file.

## Repository layout

| Path | Purpose |
| --- | --- |
| `src/pages.html`, `src/ct2-*.html`, `src/midterm-review.html` | Main lessons, CT-2 course and worked questions, and midterm review |
| `src/engine.js`, `src/practice.js` | Performance calculations, drills and quiz |
| `src/mips.js`, `src/mips-ui.js` | MIPS instruction fields, memory and stack traces, and visualisers |
| `src/style.css`, `src/ui.js`, `src/dropdown.js` | Themes, navigation and browser interactions |
| `tests/`, `build.py` | Checks against the course examples and the static HTML build |

The tests check calculations and instruction encodings against worked examples from the lecture slides, class tests and course textbook. The call visualiser follows the lecture model in which `jal` saves `PC + 4`.

## GitHub Pages

The [Pages workflow](.github/workflows/pages.yml) runs on manual dispatch. It runs the tests, builds `dist/index.html`, and publishes the result. [Deployment history](https://github.com/SpicyFalcon619/cse3313-ca-guide/actions/workflows/pages.yml)

## Author

Ahmad Maruf Hossain ([@SpicyFalcon619](https://github.com/SpicyFalcon619))

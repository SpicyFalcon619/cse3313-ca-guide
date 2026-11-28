# CSE 3313 · Computer Architecture Study Guide

**[Open the live Computer Architecture guide](https://spicyfalcon619.github.io/cse3313-ca-guide/)**

A beginner study guide for CSE 3313. Learn how a processor runs instructions, work through performance calculations, then use MIPS to write and trace small programs.

## Study by topic

| Topic | Where to start |
| --- | --- |
| Computer and MIPS basics | [CPU, registers and memory](https://spicyfalcon619.github.io/cse3313-ca-guide/#earlier) · [First MIPS instructions](https://spicyfalcon619.github.io/cse3313-ca-guide/#ct2-registers) · [Binary, bits and bytes](https://spicyfalcon619.github.io/cse3313-ca-guide/#ct2-bits) |
| Processor performance | [CT-1 study order](https://spicyfalcon619.github.io/cse3313-ca-guide/#performance-review) · [CPI](https://spicyfalcon619.github.io/cse3313-ca-guide/#s-cpi) · [Power](https://spicyfalcon619.github.io/cse3313-ca-guide/#s-power) · [Amdahl’s law](https://spicyfalcon619.github.io/cse3313-ca-guide/#s-amdahl) |
| Memory and control flow | [Arrays and word addresses](https://spicyfalcon619.github.io/cse3313-ca-guide/#ct2-arrays) · [Branches](https://spicyfalcon619.github.io/cse3313-ca-guide/#ct2-branches) · [Loops](https://spicyfalcon619.github.io/cse3313-ca-guide/#ct2-loops) |
| Functions and the stack | [Arguments and return addresses](https://spicyfalcon619.github.io/cse3313-ca-guide/#ct2-call) · [Stack frames](https://spicyfalcon619.github.io/cse3313-ca-guide/#ct2-stack) · [Recursion](https://spicyfalcon619.github.io/cse3313-ca-guide/#ct2-recursion) |
| Machine language | [R, I and J formats](https://spicyfalcon619.github.io/cse3313-ca-guide/#ct2-encode) · [Instruction encoder and decoder](https://spicyfalcon619.github.io/cse3313-ca-guide/#mips-machine) |
| Computer arithmetic | [Binary multiplication](https://spicyfalcon619.github.io/cse3313-ca-guide/#midterm-multiply) · [Restoring binary division](https://spicyfalcon619.github.io/cse3313-ca-guide/#binary-division) |

Follow the [CT-2 beginner course](https://spicyfalcon619.github.io/cse3313-ca-guide/#ct2-start) for a guided sequence, trace examples in the [simulator lab](https://spicyfalcon619.github.io/cse3313-ca-guide/#ct2-simulator), and practise on [solved past midterms](https://spicyfalcon619.github.io/cse3313-ca-guide/#s-past).

Worked examples draw on lecture materials, including Tasmin Sanjida’s slides, class tests and the course textbook. The relevant lessons credit their sources.

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
| `src/arithmetic.html` | Restoring binary division lesson |
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

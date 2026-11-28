# CSE 3313 · Computer Architecture Study Guide

**[Open the live Computer Architecture guide](https://spicyfalcon619.github.io/cse3313-ca-guide/)**

A beginner study guide for CSE 3313, organized around Tasmin Sanjida’s nine Computer Architecture decks. Each lesson teaches a worked example from its deck, gives you a question to try, and points to the relevant practice tool.

## Course sequence

| Content | What you will work through |
| --- | --- |
| [01 · Introduction to Computer Architecture](https://spicyfalcon619.github.io/cse3313-ca-guide/#tasmin-01) | Trace how software, memory and the processor work together. |
| [02 · MIPS Assembly Basics](https://spicyfalcon619.github.io/cse3313-ca-guide/#tasmin-02) | Read registers, translate an arithmetic expression and trace bitwise operations. |
| [03 · Processor Performance, Part 1](https://spicyfalcon619.github.io/cse3313-ca-guide/#tasmin-03) | Compare clock rates, CPU time and instruction mixes. |
| [04 · Processor Performance, Part 2](https://spicyfalcon619.github.io/cse3313-ca-guide/#tasmin-04) | Calculate the effect of a voltage change and use Amdahl’s law to estimate speedup. |
| [05 · MIPS Memory and Branches](https://spicyfalcon619.github.io/cse3313-ca-guide/#tasmin-05) | Compute a word address and follow both paths of a conditional branch. |
| [06 · MIPS Loops](https://spicyfalcon619.github.io/cse3313-ca-guide/#tasmin-06) | Trace while, for and do-while loops and calculate a remainder using shifts. |
| [07 · MIPS Functions and Stack](https://spicyfalcon619.github.io/cse3313-ca-guide/#tasmin-07) | Pass arguments, return a result and save registers in a stack frame. |
| [08 · MIPS Machine Language](https://spicyfalcon619.github.io/cse3313-ca-guide/#tasmin-08) | Fill R-, I- and J-format instruction fields and calculate branch displacements. |
| [09 · Computer Arithmetic](https://spicyfalcon619.github.io/cse3313-ca-guide/#tasmin-09) | Multiply with shifts and addition, and divide one quotient bit at a time. |

The [simulator lab](https://spicyfalcon619.github.io/cse3313-ca-guide/#ct2-simulator) lets you change inputs and step through the result. The [supplementary practice library](https://spicyfalcon619.github.io/cse3313-ca-guide/#practice-library) links to the earlier lessons, calculators, quiz and questions from 20 past midterms.

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
| `src/tasmin-course.html` | Nine lessons based on Tasmin Sanjida’s decks |
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

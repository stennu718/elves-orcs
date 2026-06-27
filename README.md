# Elves & Orcs

[![CI](https://github.com/stennu718/elves-orcs/actions/workflows/tests.yml/badge.svg)](https://github.com/stennu718/elves-orcs/actions/workflows/tests.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/github/v/release/stennu718/elves-orcs)](https://github.com/stennu718/elves-orcs/releases)
[![Docker](https://img.shields.io/badge/Docker-Build-2496ED.svg?logo=docker&logoColor=white)](https://github.com/stennu718/elves-orcs/pkgs/container/elves-orcs)

![Gameplay](docs/screenshot.png)

## Description

Elves & Orcs is a digital remake of the Estonian social deduction game **"Kings & Spies"** (*Kuningad & Spioonid*). In this tense deduction challenge, you must identify two hidden spies among your team of characters before time runs out.

Originally a tabletop game popular in Estonia, Kings & Spies tests your ability to analyze behavior, track patterns, and make logical deductions under pressure. This digital adaptation brings the experience to life with an interactive interface and streamlined gameplay.

## Demo

![Demo](docs/demo.gif)

## Features

- **Social deduction gameplay** — Analyze mission results to uncover hidden spies
- **5-day time limit** — Race against the clock to gather enough information
- **Mission system** — Send characters on missions and observe the results
- **Note-taking tools** — Track your observations and narrow down suspects
- **AI opponent** — Play against a computer-controlled adversary
- **Responsive UI** — Clean, modern interface built with React

## How to Play

1. You have **5 in-game days** to identify **2 hidden spies** among your characters.
2. Each day, you may send **up to 3 characters** on a mission.
3. After each mission, the game log tells you **how many spies** were present on that mission.
4. Use your **observation notes** to track which characters appear suspicious.
5. On **Day 5**, you must make your final accusation — choose the 2 characters you believe are the spies.

**Correct guess = Victory. Wrong guess = The kingdom falls.**

The key is to cross-reference mission results: if a mission with 3 characters returned 0 spies, all three are safe. Use logic and deduction to narrow down the suspects!

## Quick Start

```bash
npm install
npm run dev
```

The game will be available at `http://localhost:3000`.

## Tech Stack

- **Language:** TypeScript 5+
- **Framework:** React 19
- **Build Tool:** Vite 6
- **Testing:** Vitest
- **Styling:** Tailwind CSS 4
- **CI/CD:** GitHub Actions
- **Deployment:** Docker

## Project Structure

```
elves-orcs/
├── src/
│   ├── game/
│   │   └── logic.ts       # Core game logic and rules
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── tests/                 # Unit and integration tests
├── .github/workflows/     # CI/CD pipelines
├── Dockerfile             # Container configuration
├── vite.config.ts         # Vite configuration
├── vitest.config.ts       # Vitest configuration
└── tsconfig.json          # TypeScript configuration
```

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please make sure your code passes all existing tests and follows the project's coding style. If you're adding new features, consider adding corresponding tests as well.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

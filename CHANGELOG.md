# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Docker support with multi-stage Dockerfile
- GitHub Actions CI/CD pipeline for automated testing
- GitHub Pages deployment workflow
- Docker image publishing to GitHub Container Registry (GHCR)
- Version badge and live demo badge in README

### Changed
- Replaced broken sort-based shuffle with Fisher-Yates algorithm for spy selection
- Improved README with English translation and badges

### Fixed
- Deterministic RNG injection for reliable test execution

## [0.1.0] - 2025-06-28

### Added
- Initial game implementation with React 19 and TypeScript
- Core game logic module (`src/game/logic.ts`) with pure functions:
  - `selectSpies()` — Fisher-Yates shuffle to select 2 random spies
  - `countSpiesInCouncil()` — Count spies in a mission council
  - `checkAccusation()` — Validate final accusation
  - `toggleNote()` — Toggle note status (unknown/innocent/spy)
  - `combinations()` — Calculate mathematical combinations
- Interactive UI with character roster, mission dispatch, and accusation system
- Note-taking system to mark characters as innocent or spy
- Mission log with animated history entries
- Win/lose screens with reveal of actual spies
- 28 Vitest unit tests covering all game logic functions
- React component tests with Testing Library
- Tailwind CSS 4 styling with dark medieval theme
- Framer Motion animations for UI transitions
- Responsive layout (mobile and desktop)
- Vite 6 build configuration
- MIT License

# MITRE D3FEND™ Navigator

A community-driven, client-side web application designed to mirror the utility of the official ATT&CK Navigator, specifically built for the [MITRE D3FEND™](https://d3fend.mitre.org/) framework. 

**[View the Live Demo](https://WhosWho32.github.io/d3fend-navigator/)**

## Overview
The D3FEND Navigator allows security professionals and researchers to dynamically explore, manipulate, and annotate the D3FEND matrix. It provides a visual canvas for mapping defensive countermeasures, scoring techniques, and exporting data for reporting or presentations. The application is entirely client-side, meaning no data is ever sent to a backend server.

## Key Features
* **Multi-Layer Management:** Create, rename, and toggle between multiple active matrix layers.
* **Technique Scoring & Coloring:** Apply numeric scores to techniques with automatic gradient color mapping.
* **Data Portability:** Export configurations as JSON files for local storage and import them later to resume work.
* **High-Resolution Exports:** Export the active matrix as an SVG or PNG for use in slide decks and reports.
* **Advanced Search:** Instantly locate techniques by name or their official D3FEND ID (e.g., `D3-AVE`).

## Local Development
To run this project locally, ensure you have [Node.js](https://nodejs.org/) installed, then follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/WhosWho32/d3fend-navigator.git
   ```
2. Navigate to the project directory:
   ```bash
   cd d3fend-navigator
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Legal & Disclaimer
This is an unofficial community tool. **D3FEND™** and **ATT&CK®** are trademarks of The MITRE Corporation. This project is not affiliated with, endorsed by, or sponsored by The MITRE Corporation.

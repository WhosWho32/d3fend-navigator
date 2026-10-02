# MITRE D3FEND™ Navigator

A community-driven, client-side web application designed to mirror the utility of the official ATT&CK Navigator, specifically built for the [MITRE D3FEND™](https://d3fend.mitre.org/) framework. 

**[View the Live Demo](https://WhosWho32.github.io/d3fend-navigator/)**

## Overview
The D3FEND Navigator allows security professionals and researchers to dynamically explore, manipulate, and annotate the D3FEND matrix. It provides a visual canvas for mapping defensive countermeasures, scoring techniques, and exporting data for reporting or presentations. The application is entirely client-side, meaning no data is ever sent to a backend server.

<img width="1919" height="911" alt="d3fend-navigator" src="https://github.com/user-attachments/assets/ee0fe1c6-ac5b-45f2-962e-d3eb90452f7c" />

<img width="1919" height="403" alt="d3fend-navigator_2" src="https://github.com/user-attachments/assets/7fd57b4b-62bb-405a-b366-c0443f2d985b" />


## Key Features
* **Interactive Tactical Matrix:** Full support for the D3FEND ontology (Model, Harden, Detect, Isolate, Deceive, Evict, Restore) in a responsive grid.
* **Multi-Layer Management:** Create and manage multiple defense layers simultaneously using a tabbed interface (e.g., "Current State" vs. "Target State").
* **Scoring & Annotations:** Score individual techniques (0-100) to automatically apply gradient color coding. Right-click any cell to add custom metadata, comments, and URL references.
* **Smart Search:** Search by technique ID or name. Matched techniques are highlighted, and even collapsed columns will glow to indicate hidden matches.
* **Collapsible Tactic Columns:** Optimize screen real estate on smaller displays by collapsing full tactic columns into sleek vertical bars, complete with a color-coded mini-map of hidden scored techniques.
* **Comprehensive Exports:**
  * **JSON:** Save and share your layer state locally.
  * **CSV:** Generate spreadsheet-ready reports of all scored and annotated techniques.
  * **SVG / PNG:** Export high-resolution images of your matrix (automatically expands collapsed columns during export to ensure complete documentation).

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

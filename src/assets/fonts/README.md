# Fonts for PDF reports

TrueType copies of Petal's typefaces, used only by the weekly PDF report
(`src/lib/pdf/week-report.tsx`). The web app loads the same families through
`next/font/google`.

- **IBM Plex Sans** (Regular, SemiBold) and **IBM Plex Mono** (Regular) by IBM
- **Instrument Serif** (Regular, Italic) by Instrument

All are licensed under the [SIL Open Font License 1.1](https://openfontlicense.org),
which allows bundling them with software. Plex Sans and Instrument Serif come from
Google Fonts; Plex Mono comes from IBM's own release (github.com/IBM/plex),
because the Google Fonts build of it can't be read by the PDF renderer.

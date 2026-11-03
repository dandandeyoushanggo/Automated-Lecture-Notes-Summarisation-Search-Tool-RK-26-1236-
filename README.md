# Folio — RK-26-1236

Built against PDD_Tang Xinjie.docx, read on 3 November 2026.

## Current state

The source implements a responsive English lecture library, verified Cloudflare Access identity, user-owned note records, private original-file storage and download, PDF/DOCX/TXT browser text extraction, title/text/tag search, subject filters, editable extracted text, annotations, extractive summaries, TXT export, browser print-to-PDF, and revocable read-only sharing links. Email sharing opens the user's mail application; it does not send mail automatically.

This is an initial implementation, not the completed assessed project. An LLM provider is not configured. OCR and knowledge graphs are excluded. Recipients also need permission to visit the site; a note link alone does not grant site access. PDF and DOCX readers load from CDN. Runtime R2 binding and browser behaviour remain unverified until deployment. Deploy to Cloudflare using [DEPLOYMENT.md](DEPLOYMENT.md).

## Verification

`npm test` checks signed identity validation, rejected spoofed headers and tokens, owner isolation, record creation, share creation/revocation, deletion and client JavaScript syntax using an in-memory storage implementation. These are not hosted security or browser acceptance tests.

## Deployment

The original Sites attempt could not connect to its source server. This version is prepared for the user's GitHub repository and Cloudflare deployment instead. It does not trust Sites identity headers. No successful Cloudflare deployment or live URL has been verified yet.

No API keys or repository credentials are saved in this source.

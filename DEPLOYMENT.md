# Cloudflare deployment

## Initial setup

1. In Cloudflare, create an R2 bucket named `lecture-notes-rk-26-1236`. Keep its public access disabled. R2 activation can require account billing setup; the account owner must handle that step.
2. Create a Worker from the GitHub repository. Use worker name `lecture-notes-rk-26-1236`, repository root as the root directory, no build command, and deploy command `npm run deploy`.
3. Enable Cloudflare Access for the entire Worker, including production and previews. Configure allowed email identities. Each verified Access identity has its own note namespace.
4. Configure runtime environment variables `ACCESS_ISSUER` (your exact `https://TEAM.cloudflareaccess.com` origin, without a trailing slash) and `ACCESS_AUD` (the Access application's audience tag). Do not use the test values from the tests. Authentication fails closed until both variables are set and the request has a valid Access JWT.
5. Redeploy, sign in, and complete the acceptance checks below. A successful code upload alone does not verify the running application.

The current release generates a Chinese cloud interface with `npm run build`. The cloud interface does not load the device-local preview adapter. Sharing requires a recipient email and a 1–30 day expiry. Only the verified recipient or owner may open it; the recipient must also pass the site's Access policy. Raw sharing tokens are returned once and are not retained in storage; save the link when creating it, or generate a replacement after refreshing.

No Cloudflare token needs to be stored in the repository when using Cloudflare's native Git integration. Never commit `.dev.vars`, environment secrets, or uploaded lecture files. LLM integration is not configured in this version.

## Sharing

The entire Worker is protected by Access. A shared link grants read-only access to one note only after the visitor has signed in and passed the site's Access policy. Sharing a note does not add a visitor to that policy. Revoking a link prevents future reads through that link, but cannot erase copies a recipient has already downloaded.

## Acceptance checks

- Upload a PDF, DOCX, and TXT; confirm extracted text and original-file download.
- Reject oversized files, unsupported extensions, and textless scanned documents.
- Sign in as two allowed users; confirm private notes and original downloads are isolated.
- Search, change subjects/tags, edit text, add annotations, and reload.
- Generate the labelled extractive summary and compare it to the source.
- Export TXT and use print-to-PDF.
- Share a note, visit it as another allowed user, revoke the link, and confirm it no longer works.
- Delete a disposable test note and confirm its original file and sharing link are unavailable.

## Verification performed locally

`npm test` uses signed test Access JWTs and in-memory R2 to check identity validation, forged/expired tokens, audience mismatch, owner isolation, sharing revocation, deletion and browser-script syntax. These checks do not replace browser, deployment or Cloudflare acceptance testing.

Official references:

- https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- https://developers.cloudflare.com/r2/api/workers/workers-api-usage/

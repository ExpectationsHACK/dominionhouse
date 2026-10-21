@AGENTS.md
@PROJECT.md
@SYSTEM.md
@DESIGN.md

# Working on this site

- The database is shared with the live site: local writes are live. Test
  registrations and payments only on the `dominion-house-mock` preview, and
  delete test data afterwards.
- Preview changes locally and deploy (push to `main`) only when the owner
  says "deploy". Each push costs 15 Netlify credits, so bundle changes.
- Never make real payments, type real passwords, commit secrets or large
  originals, or send email from tests.
- Use the colour and type tokens in DESIGN.md; settle payments only through
  `settlePayment()` (SYSTEM.md).

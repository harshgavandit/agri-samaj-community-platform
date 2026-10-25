# Security

Report suspected vulnerabilities privately to **[harsh.gavand.tech@gmail.com](mailto:harsh.gavand.tech@gmail.com)**. Include the affected repository and commit, route or file, expected behavior, and the smallest reproduction using synthetic data. Do not post credential values, private records, or working exploit payloads in a public issue.

Keep testing within a local or explicitly authorized isolated environment. A public demo does not authorize access to another user's records, disruption, or testing of third-party providers.

If a credential is exposed, revoke or rotate it at its provider and update dependent deployments. Removing it from the current source does not revoke the credential or remove historical copies. Store replacements in server-side environment variables and keep them out of browser bundles, logs, fixtures, and committed archives.

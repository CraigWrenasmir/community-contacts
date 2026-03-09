# Minimum Data Standard

This defines the minimum required fields and quality checks for each Community Contact record.

## Required fields

- `organisation_name`
- `category` (must match taxonomy)
- `suburb`
- `postcode` (4 digits)
- `state`
- `website_url` or `public_email` or `phone` (at least one contact method)
- `workshop_relevance` (one sentence)
- `source_url` (where the info was obtained)
- `last_verified` (ISO date: `YYYY-MM-DD`)

## Recommended fields

- `public_email` (generic/shared inbox preferred)
- `phone`
- `address_line`
- `lga`
- `tags` (comma-separated)
- `contact_form_url`
- `notes`

## Technical fields

- `lat`
- `lon`
- `website_checked` (`true/false`)
- `email_quality` (`valid`, `missing`, `uncertain`)

## Validation rules

- `category` must be one of the 15 approved categories.
- `postcode` must be normalized to 4 digits.
- `public_email` must be syntactically valid if present.
- `website_url` must start with `http://` or `https://`.
- `last_verified` must be a real date.
- `source_url` must be present and reachable at collection time.
- `workshop_relevance` should be specific (no generic placeholder text).

## Verification SLA

- New records: verify within 7 days of capture before publication.
- Published records: re-verify every 6 months.
- High-value channels (councils, disability services, parent/carer orgs): re-verify every 3 months.

## De-duplication policy

- Primary dedupe key: normalized `organisation_name + suburb + postcode`.
- If duplicate records have different contact methods, merge into one record.
- Keep one canonical record with multiple validated contact channels.

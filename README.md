# Community Contacts Radius Search

Standalone static site for finding key local community organisations within a radius of a suburb/postcode.

## Goal

Support Positive Partnerships autism workshop promotion by finding nearby organisations that can help share events and referrals.

## Current status

- NSW prototype page ready at `docs/nsw.html`
- Static data loaded from `docs/data/nsw/contacts.min.json`
- Radius search and copy-email workflow implemented

## CSV schema for imports

Use these columns when preparing source data:

- `organisation_name`
- `category`
- `suburb`
- `postcode`
- `phone`
- `public_email`
- `website_url`
- `workshop_relevance`
- `lat` (optional)
- `lon` (optional)

If `lat/lon` are blank, export script will attempt postcode centroid fallback.

## Export static state data

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install pandas pgeocode
python 01_export_state_static_data.py --state nsw --csv outputs/community_contacts_nsw.csv
```

## Local preview

```bash
python3 -m http.server 4173 --directory docs
```

Open `http://127.0.0.1:4173`

## Planning docs

- Category taxonomy: `docs/planning/category-taxonomy.md`
- Sourcing plan: `docs/planning/sourcing-plan.md`
- Minimum data standard: `docs/planning/minimum-data-standard.md`
- NSW seed source log: `docs/planning/nsw-seed-sources.md`

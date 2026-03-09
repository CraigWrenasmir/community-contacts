import csv
from collections import Counter
from pathlib import Path

p = Path('/Users/craigsmith/community_contacts/outputs/community_contacts_nsw.csv')
rows = list(csv.DictReader(p.open()))

allowed = {
"Schools & Education Networks (non-school orgs)",
"Early Childhood & Family Services",
"Disability & NDIS Services",
"Allied Health (OT, Speech, Psych)",
"Parent/Carer Support Organisations",
"Community Centres & Neighbourhood Houses",
"Councils & Libraries",
"Aboriginal & Torres Strait Islander Services",
"Multicultural & Settlement Services",
"Faith-Based Community Organisations",
"Youth Services",
"Health Services & Primary Health Networks",
"NGOs/Charities (family, disability, mental health)",
"Sport, Recreation & Inclusion Programs",
"Local Media & Community Promotion Channels",
}

missing_required = []
for i, r in enumerate(rows, start=2):
    req = ['organisation_name','category','suburb','postcode','state','workshop_relevance','source_url','last_verified']
    for k in req:
        if not (r.get(k) or '').strip():
            missing_required.append((i,k,r.get('organisation_name','')))

bad_category = [(i,r['category'],r['organisation_name']) for i,r in enumerate(rows, start=2) if r.get('category') not in allowed]

def key(r):
    return (r.get('organisation_name','').strip().lower(), r.get('suburb','').strip().lower(), r.get('postcode','').strip())
counts = Counter(key(r) for r in rows)
dupes = [(k,v) for k,v in counts.items() if v>1]

print('rows', len(rows))
print('missing_required', len(missing_required))
print('bad_category', len(bad_category))
print('dupes', len(dupes))
if missing_required:
    print('sample_missing', missing_required[:5])
if bad_category:
    print('sample_bad_category', bad_category[:5])
if dupes:
    print('sample_dupes', dupes[:5])

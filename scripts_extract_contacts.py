import json, re
import requests
from bs4 import BeautifulSoup

urls = [
"https://www.aspect.org.au/contact-us",
"https://www.northcott.com.au/contact/",
"https://abilityoptions.org.au/contact-us/",
"https://addiroad.org.au/contact/",
"https://www.cityofparramatta.nsw.gov.au/community/library-services/find-a-library",
"https://www.liverpool.nsw.gov.au/library",
"https://www.penrith.city/library",
"https://www.wollongong.nsw.gov.au/library",
"https://www.blacktown.nsw.gov.au/Services/Libraries",
"https://www.centralcoast.nsw.gov.au/library-services/contact-library-services",
"https://www.missionaustralia.com.au/contact-us",
"https://www.sydneycommunityservices.com.au/contact-us/",
"https://www.kingsgrovecommunityaid.com.au/contact",
"https://www.gowriensw.com.au/contact-us/",
"https://www.ssi.org.au/contact/",
"https://www.mccnsw.org.au/contact",
]

email_re = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
phone_re = re.compile(r"(?:\+61\s?[2-478]\s?\d{4}\s?\d{4}|\(?0[2-478]\)?\s?\d{4}\s?\d{4}|1300\s?\d{3}\s?\d{3}|1800\s?\d{3}\s?\d{3})")

for u in urls:
    try:
        r = requests.get(u, timeout=20, headers={"User-Agent":"Mozilla/5.0"})
        html = r.text
        soup = BeautifulSoup(html, 'lxml')
        text = soup.get_text("\n", strip=True)
        emails = sorted(set(email_re.findall(text) + [a.get('href','').replace('mailto:','').split('?')[0] for a in soup.select('a[href^=mailto]')]))
        emails = [e for e in emails if '@' in e and not e.lower().endswith('.png')]
        phones = sorted(set(phone_re.findall(text) + [a.get('href','').replace('tel:','').strip() for a in soup.select('a[href^=tel]')]))
        phones = [p for p in phones if p]

        # Try JSON-LD org info
        orgs = []
        for s in soup.select('script[type="application/ld+json"]'):
            try:
                data = json.loads(s.string or s.text or "")
            except Exception:
                continue
            if isinstance(data, list):
                items = data
            else:
                items = [data]
            for it in items:
                if isinstance(it, dict) and ('Organization' in str(it.get('@type','')) or 'LocalBusiness' in str(it.get('@type',''))):
                    orgs.append({k:it.get(k) for k in ['name','telephone','email','address']})

        print('\n===',u)
        print('emails:', emails[:5])
        print('phones:', phones[:5])
        if orgs:
            print('jsonld:', orgs[:2])
        # address-like lines
        lines = [ln.strip() for ln in text.split('\n') if ln.strip()]
        addr = [ln for ln in lines if re.search(r'NSW\s+\d{4}|\d{4}\s*$', ln)]
        print('address_lines:', addr[:6])
    except Exception as e:
        print('\n===',u)
        print('ERROR',e)

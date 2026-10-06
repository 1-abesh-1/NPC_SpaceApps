import requests
from pathlib import Path

# always save next to the project root, no matter where you run this from
ROOT = Path(__file__).resolve().parent.parent
out = ROOT / 'downloads'
out.mkdir(exist_ok=True)

# paste the 2020 links you copied; the script swaps the year
MODIS_2020 = 'https://firms.modaps.eosdis.nasa.gov/data/country/zips/modis_2020_all_countries.zip'
VIIRS_2020 = 'https://firms.modaps.eosdis.nasa.gov/data/country/zips/viirs-snpp_2020_all_countries.zip'
jobs = [(MODIS_2020, y) for y in range(2003, 2026)] + \
       [(VIIRS_2020, y) for y in range(2012, 2026)]

failed = []
for template, year in jobs:
    url = template.replace('2020', str(year))
    dest = out / url.split('/')[-1]
    if dest.exists() and dest.stat().st_size > 1_000_000:
        print('skip (already have)', dest.name)
        continue
    print('downloading', dest.name, flush=True)
    part = dest.with_name(dest.name + '.part')
    ok = False
    for attempt in range(1, 4):
        try:
            r = requests.get(url, stream=True, timeout=60)
            if r.status_code != 200:
                print('  FAILED', r.status_code)
                break                       # a 404 will not fix itself, so don't retry
            with open(part, 'wb') as f:
                for chunk in r.iter_content(chunk_size=1024 * 1024):
                    f.write(chunk)
            part.replace(dest)              # only a finished file gets the real name
            print('  done', round(dest.stat().st_size / 1e6, 1), 'MB', flush=True)
            ok = True
            break
        except Exception as e:
            print('  ERROR (try', attempt, 'of 3):', e, flush=True)
    if not ok:
        failed.append(dest.name)

print('finished. failed:', failed)
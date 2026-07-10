import urllib.request
import re

html = urllib.request.urlopen('https://secure-healing-production-6347.up.railway.app/').read().decode('utf-8')
script_match = re.search(r'src="(/assets/index-[^\"]+\.js)"', html)
if script_match:
    script = script_match.group(1)
    print('New script chunk:', script)
    js = urllib.request.urlopen('https://secure-healing-production-6347.up.railway.app' + script).read().decode('utf-8')
    print('Trailing slash found:', bool(re.search(r'/api/students/\?limit=10000', js)))
    print('No trailing slash found:', bool(re.search(r'/api/students\?limit=10000', js)))
else:
    print('No script chunk found')

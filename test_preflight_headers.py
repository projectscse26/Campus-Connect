import urllib.request
import urllib.error

req = urllib.request.Request(
    'https://campus-connect-production-003e.up.railway.app/api/students',
    method='OPTIONS',
    headers={
        'Origin': 'https://secure-healing-production-6347.up.railway.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization'
    }
)
try:
    res = urllib.request.urlopen(req)
    print(res.status)
    print(res.headers)
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.headers)

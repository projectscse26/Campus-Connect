import urllib.request
import urllib.error
import json

req = urllib.request.Request(
    'https://campus-connect-production-003e.up.railway.app/api/students/?limit=10000',
    method='GET',
    headers={
        'Origin': 'https://secure-healing-production-6347.up.railway.app',
        # I need a valid token to actually hit the DB, or I'll just get 401 Unauthorized
        # Wait, if I get 401 Unauthorized, it's not a Network Error. 
        # But let's see if the server crashes (500) which strips CORS headers!
        'Authorization': 'Bearer test'
    }
)
try:
    res = urllib.request.urlopen(req)
    print(res.status)
    print(res.headers)
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.headers)
    print(e.read().decode('utf-8'))

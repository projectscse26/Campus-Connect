import urllib.request
import urllib.error

# Note the lack of trailing slash
req = urllib.request.Request(
    'https://campus-connect-production-003e.up.railway.app/api/students?limit=10000',
    method='GET',
    headers={
        'Origin': 'https://secure-healing-production-6347.up.railway.app',
        'Authorization': 'Bearer fake_token_just_to_see_if_it_redirects'
    }
)
try:
    # Disable automatic redirect following so we can see the 307
    class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
        def http_error_307(self, req, fp, code, msg, headers):
            return fp
        def http_error_301(self, req, fp, code, msg, headers):
            return fp
        def http_error_302(self, req, fp, code, msg, headers):
            return fp

    opener = urllib.request.build_opener(NoRedirectHandler)
    urllib.request.install_opener(opener)
    
    res = urllib.request.urlopen(req)
    print(res.status)
    print(res.headers)
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.headers)

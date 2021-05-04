import requests
from google.cloud import storage

def _http_json_post(url: str, obj: dict):
    r = requests.post(url, json=obj)
    assert r.status_code == 200, f'Problem posting data to: {url}: {str(r)}'
    return r.json()

def _upload_to_google_cloud(bucket_name: str, destination_name: str, data: bytes):
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_name)

    blob.upload_from_string(data)
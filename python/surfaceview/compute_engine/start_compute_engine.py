import os
import time
import json
import uuid
import hashlib
from typing import Union

from surfaceview.compute_engine.subfeed_manager import SubfeedManager

from .task_manager import TaskManager, find_taskfunction
from ._common import _http_json_post, _upload_to_google_cloud
import paho.mqtt.client as mqtt

class ComputeEngine:
    def __init__(self, *, google_bucket_name: str, app_url: str, label: str):
        self._google_bucket_name = google_bucket_name
        self._app_url = app_url
        self._label = label
        self._registration: Union[None, dict] = None
        self._registration_timestamp = 0
        self._last_registration_attempt_timestamp = 0
        self._last_report_alive_timestamp = 0
        self._ably_client: Union[mqtt.Client, None] = None
        self._secret: Union[str, None] = None
        def on_publish_message(msg):
            if self._registration is None:
                print('WARNING: unable to publish message. Registration is None')
                return
            if self._ably_client is None:
                print('WARNING: unable to publish message. Ably client is None')
                return
            if not self._ably_client.is_connected():
                print('WARNING: unable to publish message. Ably client is not connected')
                return
            ably_channel = self._registration['serverChannelName']
            self._ably_client.publish(ably_channel, json.dumps(msg).encode('utf-8'), qos=1)
        self._task_manager = TaskManager(on_publish_message=on_publish_message, google_bucket_name=google_bucket_name)
        self._subfeed_manager = SubfeedManager(on_publish_message=on_publish_message, google_bucket_name=google_bucket_name)
    def iterate(self):

        # Check if we need to renew registration
        renew_registration = False
        if (self._registration is None) or (self._registration_age() > 60 * 10):
            renew_registration = True
        elif (self._ably_client is not None) and (not self._ably_client.is_connected()):
            renew_registration = True
        if renew_registration:
            elapsed_since_last_attempt = time.time() - self._last_registration_attempt_timestamp
            if elapsed_since_last_attempt > 15:
                self._renew_registration()
        
        # Check if we need to report alive
        elapsed_since_last_report = min(time.time() - self._last_report_alive_timestamp, time.time() - self._last_report_alive_timestamp)
        if elapsed_since_last_report > 60:
            self._renew_registration(report_only=True)
        
        self._task_manager.iterate()
        self._subfeed_manager.iterate()
    def cleanup(self):
        self._renew_registration(report_only=True, unregister=True)
        
    def _registration_age(self):
        return time.time() - self._registration_timestamp
    def _on_ably_message(self, message: dict):
        type0 = message.get('type', None)
        if type0 == 'initiateTask':
            try:
                task_hash = message.get('taskHash')
                task_data = message.get('task')
                function_id = task_data.get('functionId')
                kwargs = task_data.get('kwargs')
            except Exception as e:
                print(e)
                print('Unexpected problem parsing task payload')
                task_hash = None
                task_data = None
                function_id = None
                kwargs = None
            if task_hash is not None and task_data is not None and function_id is not None and kwargs is not None:
                td = find_taskfunction(function_id)
                if td is not None:
                    try:
                        taskjob = td(**kwargs)
                        self._task_manager.add_task(task_hash, task_data, taskjob)
                    except Exception as e:
                        msg = {'type': 'taskStatusUpdate', 'taskHash': task_hash, 'status': 'error', 'error': f'Unable to create job: {str(e)}'}
                        self._publish_to_task_status(msg)
                else:
                    msg = {'type': 'taskStatusUpdate', 'taskHash': task_hash, 'status': 'error', 'error': f'Unable to find task function: {function_id}'}
                    self._ably_client.publish(self._registration['serverChannelName'], json.dumps(msg).encode('utf-8'), qos=1)
        elif type0 == 'subscribeToSubfeed':
            feed_id = message.get('feedId', None)
            subfeed_hash = message.get('subfeedHash', None)
            if feed_id is not None and subfeed_hash is not None:
                self._subfeed_manager.subscribe_to_subfeed(feed_id=feed_id, subfeed_hash=subfeed_hash)
    def _publish_to_task_status(self, msg: dict):
        self._ably_client.publish(self._registration['serverChannelName'], json.dumps(msg).encode('utf-8'), qos=1)
    def _renew_registration(self, report_only=False, unregister=False):
        if not report_only:
            self._last_registration_attempt_timestamp = time.time()
        else:
            self._last_report_alive_timestamp = time.time()
        google_bucket_base_url = f'https://storage.googleapis.com/{self._google_bucket_name}'
        config_object_name = f'surfaceview-compute-engine/{self._label}.json'
        if not report_only:
            self._secret = _random_id()
            config = {
                'label': self._label,
                'objectStorageUrl': google_bucket_base_url,
                'secretSha1': _sha1_of_string(self._secret)
            }
            _upload_to_google_cloud(self._google_bucket_name, config_object_name, json.dumps(config).encode('utf-8'))
        registration = _http_json_post(f'{self._app_url}/api/register', {
            'type': 'registerComputeEngine',
            'computeEngineConfigUri': f'gs://{self._google_bucket_name}/{config_object_name}',
            'secret': self._secret,
            'reportOnly': report_only,
            'unregister': unregister
        })
        print(f'')
        print(f'==========================================================================================')
        print(f'Compute engine URI: gs://{self._google_bucket_name}/{config_object_name}')
        print(f'')
        if not report_only:
            client_channel_name = registration['clientChannelName']
            server_channel_name = registration['serverChannelName']
            token_details = registration['tokenDetails']
            ably_client = mqtt.Client()
            ably_client.username_pw_set(token_details['token'], '')
            ably_client.tls_set()
            def on_connect(client, userdata, flags, rc):
                old_ably_client = self._ably_client
                self._ably_client = ably_client
                if old_ably_client is not None:
                    old_ably_client.disconnect()
                ably_client.subscribe(client_channel_name)
                print('Ably client connected')
            def on_disconnect(client, userdata, rc):
                print('Ably client disconnected')
                ably_client.loop_stop()
            def on_message(client0, userdata, message: mqtt.MQTTMessage):
                self._on_ably_message(json.loads(message.payload.decode('utf-8')))
            ably_client.on_connect = on_connect
            ably_client.on_disconnect = on_disconnect
            ably_client.on_message = on_message
            ably_client.connect('mqtt.ably.io', port=8883, keepalive=15)
            ably_client.loop_start()
            self._registration = registration
            self._registration_timestamp = time.time()

def start_compute_engine(*, app_url: str, label: str):
    # For uploading to google bucket
    GOOGLE_BUCKET_NAME = os.getenv('GOOGLE_BUCKET_NAME', None)
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', None)
    if GOOGLE_BUCKET_NAME is None:
        raise Exception(f'Environment variable not set: GOOGLE_BUCKET_NAME')
    if GOOGLE_APPLICATION_CREDENTIALS is None:
        raise Exception(f'Environment variable not set: GOOGLE_APPLICATION_CREDENTIALS')
    if not os.path.isfile(GOOGLE_APPLICATION_CREDENTIALS):
        raise Exception(f'Google application credentials file not found: {GOOGLE_APPLICATION_CREDENTIALS}')
    
    X = ComputeEngine(google_bucket_name=GOOGLE_BUCKET_NAME, app_url=app_url, label=label)
    try:
        while True:
            X.iterate()
            time.sleep(0.1)
    finally:
        X.cleanup()

def _random_id():
    return str(uuid.uuid4())[-12:]

def _sha1_of_string(x: str):
    return hashlib.sha1(x.encode('utf-8')).hexdigest()
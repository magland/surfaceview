import os
import time
import json
from typing import Any, Callable, Dict, Union
import paho.mqtt.client as mqtt
import hither2 as hi
from ._serialize import _serialize
from ._http import _http_json_post
from google.cloud import storage

_global_registered_taskfunctions_by_function_id: Dict[str, Callable] = {}

def find_taskfunction(function_id: str) -> Union[Callable, None]:
    if function_id in _global_registered_taskfunctions_by_function_id:
        return _global_registered_taskfunctions_by_function_id[function_id]
    else:
        return None

def taskfunction(function_id: str):
    def wrap(f: Callable[..., Any]):
        _global_registered_taskfunctions_by_function_id[function_id] = f
        return f
    return wrap

job_handler = hi.ParallelJobHandler(4)

@hi.function('return_42', '0.1.0')
def return_42(delay: float):
    time.sleep(delay)
    return {
        'answer': 42,
        'delay': delay
    }

@taskfunction(function_id='test1')
def task_test1(delay: float, dummy: Any):
    with hi.Config(job_handler=job_handler):
        return hi.Job(return_42, {'delay': delay})


class Task:
    def __init__(self, client: mqtt.Client, task_hash: str, task_data: dict, job: hi.Job):
        self._client = client
        self._task_hash = task_hash
        self._task_data = task_data
        self._status = job.status
        self._job = job
        self._publish_status_update()
    @property
    def status(self):
        return self._status
    @property
    def job(self):
        return self._job
    def iterate(self):
        if self._status != self._job.status:
            self._status = self._job.status
            self._publish_status_update()
    def _publish_status_update(self):
        msg = {'type': 'statusUpdate', 'taskHash': self._task_hash, 'status': self._status}
        if self._status == 'error':
            msg['error'] = str(self._job.result.error)
        elif self._status == 'finished':
            return_value_serialized = _serialize(self._job.result.return_value)
            _upload_to_google_cloud(f'task_results/{_pathify_hash(self._task_hash)}', json.dumps(return_value_serialized).encode('utf-8'))
        self._client.publish('task-status', json.dumps(msg).encode('utf-8'), qos=1)

def _pathify_hash(x: str):
    return f'{x[0]}{x[1]}/{x[2]}{x[3]}/{x[4]}{x[5]}/{x}'

def _upload_to_google_cloud(bucket_name: str, destination_name: str, data: bytes):
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_name)

    blob.upload_from_string(data)

class TaskManager:
    def __init__(self, client: mqtt.Client):
        self._tasks: Dict[str, Task] = {}
        self._client = client
    def add_task(self, task_hash: str, task_data: dict, job: hi.Job):
        if task_hash in self._tasks:
            self._tasks[task_hash]._publish_status_update() # do this so the requester knows that it is already running
            return self._tasks[task_hash]
        t = Task(self._client, task_hash, task_data, job)
        self._tasks[task_hash] = t
        return t
    def iterate(self):
        task_hashes = list(self._tasks.keys())
        for task_hash in task_hashes:
            task = self._tasks[task_hash]
            task.iterate()
            if task.status in ['error', 'finished']:
                del self._tasks[task_hash]

class ComputeEngineOpts:
    compute_engine_id: str
    app_url: str
    google_bucket_name: str
    google_application_credentials: str
    ably_api_key: str

class ComputeEngine:
    def __init__(self, opts: ComputeEngineOpts):
        self._opts = opts
        self._ably_client = mqtt.Client()
        self._task_manager = TaskManager(self._ably_client)
        self.connect_to_ably()
    def on_ably_disconnect(self):
        print('Disconnected from ably. Retrying in a few seconds')
        time.sleep(5)
        self.connect_to_ably()
    def on_ably_connect(self):
        print('Ably client connected.')
        self._ably_client.subscribe("task-queue")
        pass
    def on_ably_message(self, message):
        pass
    def connect_to_ably(self):
        client = self._ably_client
        api_key = self._opts.ably_api_key
        client.username_pw_set(api_key.split(':')[0], api_key.split(':')[1])
        client.tls_set()
        def on_connect(client, userdata, flags, rc):
            self.on_ably_connect()
        def on_disconnect(client, userdata, rc):
            print('Ably client disconnected')
            client.loop_stop()
            self.on_ably_disconnect()
        def on_message(client0, userdata, message):
            self.on_ably_message(message)
        client.on_connect = on_connect
        client.on_disconnect = on_disconnect
        client.on_message = on_message
        # client.loop_start()
        client.connect('mqtt.ably.io', port=8883, keepalive=15)
        client.loop_start()

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
    
    google_bucket_base_url = f'https://storage.googleapis.com/{GOOGLE_BUCKET_NAME}'
    config_object_name = f'surfaceview-compute-engine/{name}.json'
    config = {
        'label': label
    }
    _upload_to_google_cloud(GOOGLE_BUCKET_NAME, config_object_name, json.dumps(config).encode('utf-8'))
    register_result = _http_json_post(f'{app_url}/api/registerComputeEngine', {
        'config_url': f'{google_bucket_base_url}/{config_object_name}'
    })
    
    opts = ComputeEngineOpts()
    opts.app_url
    opts.google_bucket_name = GOOGLE_BUCKET_NAME
    X = ComputeEngine(opts)
    
    def on_ably_connect(client, userdata, flags, rc):
        print('Connected')
        client.subscribe("task-queue")

    def on_ably_disconnect(client, userdata, rc):
        print('Disconnected')
        client.loop_stop()
    
    def on_message(client, userdata, message):
        timestamp = message.timestamp
        topic = message.topic
        payload = message.payload
        if topic == 'task-queue':
            x = _safe_parse_json(payload)
            type0 = x.get('type', None)
            if type0 == 'initiateTask':
                try:
                    task_hash = x.get('taskHash')
                    task_data = x.get('task')
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
                            task_manager.add_task(task_hash, task_data, taskjob)
                        except Exception as e:
                            msg = json.dumps({'type': 'statusUpdate', 'taskHash': task_hash, 'status': 'error', 'error': f'Unable to create job: {str(e)}'})
                            client.publish('task-status', json.dumps(msg).encode('utf-8'), qos=1)
                    else:
                        msg = json.dumps({'type': 'statusUpdate', 'taskHash': task_hash, 'status': 'error', 'error': f'Unable to find task function: {function_id}'})
                        client.publish('task-status', json.dumps(msg).encode('utf-8'), qos=1)

    client = mqtt.Client()
    api_key = os.environ['ABLY_API_KEY']
    client.username_pw_set(api_key.split(':')[0], api_key.split(':')[1])
    client.tls_set()
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    # client.loop_start()
    client.connect('mqtt.ably.io', port=8883, keepalive=15)
    client.loop_start()

    task_manager = TaskManager(client)

    try:
        while True:
            hi.wait(0.1)
            task_manager.iterate()
            time.sleep(0.1)
    finally:
        client.loop_stop()

    # while True:
    #     message_page = channel.history()
    #     while True:
    #         for a in message_page.items:
    #             timestamp = a.timestamp
    #             name = a.name
    #             client_id = a.client_id
    #             data = a.data
    #             print(name, data)
    #         if message_page.has_next():
    #             message_page = message_page.next()
    #         else:
    #             break
    #     time.sleep(5)

def _safe_parse_json(x: Any):
    try:
        return json.loads(x)
    except:
        return {}
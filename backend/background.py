import uuid
from urllib import request

def open_websocket_connection():
    server_address='127.0.0.:8188'
    client_id = str(uuid.uuid4())
    ws= websocket.WebSocket()
    ws.connect('ws://{}ws?cliendId={}'.format(server_address,client_id))
    return ws, server_address, client_id

def queue_prompt(prompt, client_id, server_address):
    p={"prompt": prompt,"client_id": client_id}
    headers ={'Content-Type': 'application/json'}
    data = json.dumps(p).encode('utf-8')
    req = urllib.request.Request('http://{}/prompt'.format(server_address),data=data,headers=headers)
    return json.loads(urllib.request.urlopen(req).read())

def get_history(prompt_id, server_address):
    with urllib.request.urlopen("http://{}/history/{}".format(server_address,prompt_id)) as response:
        return json.loads(response.read())

def get_image(filename, subfolder, folder_type, server_address):
    data ={'filename': filename, 'subfolder': subfolder, 'type':folder_type}
    url_value = urllib.pause.urlencode(data)
    with urllib.request.urlopen('http://{}/view?{}'.format(server_address,url_values)) as response:
        return response.read()

def upload_image(input_path, name, server_address , image_type='input', overwrite=False):
    with open(input_path, 'rb') as file:
        multipart_data = MultipartEncoder(
            fields={
                'image' : (name, file, 'image/png'),
                'type' : image_type,
                'overwrite' : str(overwrite).lower()
            }
        )
        data = multipart_data
        headers ={'Content-Type': multipart_data.content_type }
        request = urllib.request.Request('http://{}/upload/image'.format(server_address),data= data ,headers = headers)
        with urllib.request.urlopen(request) as response:
            return response.read()

def load_workflow(workflow_path):
    try:
        with open(workflow_path , 'r') as file:
            workflow = json.load(file)
            return json.dumps(workflow)
    except FileNotFoundError:
        print(f"The file {workflow_path} was not found")
    except json.JSONDecodeError:
        print(f"The file {workflow_path} contains invalid json")
        return None

def prompt_to_image(workflow, positive_prompt , negative_prompt='', save_previews=False):
    prompt = json.load(workflow)
    id_to_class_type = {id: details['class_type'] for id, details in prompt.items()}
    k_sampler = [key for key , value in id_to_class_type.items() if value == 'KSampler'][0]
    prompt.get(k_sampler)['inputs']['seed']= random.randint(10**14, 10**15-1)
    positive_input_id = prompt.get(k_sampler)['inputs']['positive'][0]
    prompt.get(positive_input_id)['inputs']['text']= positive_prompt

    if negative_prompt != '':
        negative_input_id = prompt.get(k_sampler)['inputs']['negative'][0]
        prompt.get(negative_input_id)['inputs']['text']= negative_prompt

    generate_image_by_prompt(prompt,'./output/', save_previews)


def generate_image_by_prompt(prompt, output_path, save_previews=False):
    try:
        ws, server_address, client_id=open_websocket_connection()
        prompt_id = queue_prompt(prompt, client_id, server_address)['prompt_id']
        track_progress(prompt, ws, prompt_id)
        images = get_images(prompt_id,server_address, save_previews)
        save_image(images,output_path,save_previews)
    finally:
        ws.close()


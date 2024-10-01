import os
from dotenv import load_dotenv
from openai import OpenAI
from firebase_admin import credentials, initialize_app, storage
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import uuid
import json
import base64
import os
import aiohttp
from aiohttp import FormData
from fastapi.responses import JSONResponse
from urllib import request


# .env 파일 로드
load_dotenv()

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Firebase 초기화
cred = credentials.Certificate('smartmodeller-firebase-adminsdk-tq05q-e909c9008d.json')
initialize_app(cred, {
    'storageBucket': 'smartmodeller.appspot.com'
})
bucket = storage.bucket()

def upload_image_to_firebase(local_image_path, destination_blob_name):
    bucket = storage.bucket()
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_filename(local_image_path)

    # 파일을 공개적으로 접근 가능하게 설정
    blob.make_public()

    return blob.public_url

app = FastAPI()

# CORS 미들웨어 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://221.148.97.238:3000", "http://221.148.97.238:8000" ,"http://192.168.0.150:3000", 'http://localhost:8002', 
                'http://192.168.0.150:8002' ,'http://127.0.0.1:8002','http://221.148.97.237:8002','http://221.148.97.237:3000'],
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 HTTP 헤더 허용
)


# 파일 업로드 엔드포인트
@app.post("/uploadfile/")
async def create_upload_file(file: UploadFile):
    blob = bucket.blob(f'createdImageUrl/{file.filename}')
    blob.upload_from_file(file.file)
    blob.make_public()
    print("File URL:", blob.public_url)
    return {
        "result": blob.public_url
    }

# 모든 이미지 URL 가져오기 엔드포인트
@app.get("/findAllImageUrl/")
async def findAllImageUrl():
    blobs = bucket.list_blobs(prefix="createdImageUrl/")
    imageUrlList = []
    for blob in blobs:
        blob.make_public()
        imageUrlList.append(blob.public_url)
    return {
        "result": imageUrlList
    }

# 이미지 삭제 엔드포인트
@app.post("/deleteImage")
async def deleteByImage(imageUrl: str):
    blobs = bucket.list_blobs(prefix="createdImageUrl/")
    beforeDelete = []
    afterDelete = []
    for blob in blobs:
        beforeDelete.append(blob.public_url)
        blob.make_public()
        if blob.public_url == imageUrl:
            print('blob.public_url:' + blob.public_url)
            blob.delete()
        else:
            afterDelete.append(blob.public_url)
    return {
        "삭제 전 이미지 리스트": beforeDelete,
        "삭제 후 이미지 리스트": afterDelete
    }

from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    negative_prompt: str = ""
    width: int = 512
    height: int = 512
    gender: str = ""
    num_images: int = 1

@app.post("/chat")
async def chat_with_gpt(request: ChatRequest):
    try:
        message = request.message
        negative_prompt = request.negative_prompt
        width = request.width
        height = request.height
        gender = request.gender.lower()
        num_images = request.num_images 
        # 사용자 입력을 프롬프트로 변환
        converted_prompt = await convert_to_prompt(message)
        
        # 기본 프롬프트 설정
        base_prompt = "A highly detailed, ultra-realistic portrait, soft lighting, sharp focus, natural skin texture, cinematic, 35mm photography, bokeh background, 4k resolution, vibrant colors, looking directly at the camera, realistic"
        
        # 성별에 따라 프롬프트 조정
        if gender == 'male':
            base_prompt = base_prompt.replace("portrait", "portrait of a man")
            full_prompt = f"(man:1.3), {base_prompt}, {converted_prompt}, masculine features, strong jawline"
            negative_prompt += ", female, woman, feminine features"
        elif gender == 'female':
            base_prompt = base_prompt.replace("portrait", "portrait of a woman")
            full_prompt = f"(woman:1.3), {base_prompt}, {converted_prompt}, feminine features"
            negative_prompt += ", male, man, masculine features"
        else:
            full_prompt = f"{base_prompt}, {converted_prompt}"
        
        
        # Stable Diffusion API 요청 형식에 맞게 응답 구성
        full_prompt = f"{base_prompt}, {converted_prompt}"
        
        response = {
            "prompt": full_prompt,
            "negative_prompt": negative_prompt or "low quality, blurry, deformed, extra limbs, bad anatomy, cartoon, painting, drawing, unrealistic, overexposed, underexposed, noisy, grain",
            "steps": 20,
            "cfg_scale": 7.5,
            "width": width,
            "height": height,
            "batch_size": num_images  # 생성할 이미지 수 설정
        }
        
        return response
    except Exception as e:
        return {"error": str(e)}

async def convert_to_prompt(user_input: str) -> str:
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "당신은 사용자의 자연어 입력을 Stable Diffusion API에 적합한 간결하고 명확한 영어 프롬프트로 변환하는 AI입니다. 추가 설명 없이 변환된 프롬프트만 출력하세요."},
                {"role": "user", "content": user_input}
            ]
        )
        prompt = response.choices[0].message.content.strip()
        return prompt
    except Exception as e:
        return f"Error in conversion: {str(e)}"
    


COMFY_API_URL = "http://127.0.0.1:8188"  # ComfyUI 서버 주소

async def load_workflow(file_path: str):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            print(1)
            workflow = json.load(file)
        return workflow
    except FileNotFoundError:
        print(2)
        raise HTTPException(status_code=404, detail=f"Workflow file '{file_path}' not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail=f"File '{file_path}' is not a valid JSON file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while loading the workflow: {str(e)}")

async def queue_prompt(workflow: dict, client_id: str = ""):
    print('queue')
    prompt_url = f"{COMFY_API_URL}/prompt"
    print(1)
    payload = {
        "prompt": workflow,
        "client_id": client_id
    }
    print(2)
    async with aiohttp.ClientSession() as session:
        print(3)
        async with session.post(prompt_url, json=payload) as response:
            print(4)
            if response.status != 200:
                raise HTTPException(status_code=response.status, detail=f"Error queuing prompt: {await response.text()}")
            result = await response.json()

            print(result.get('prompt_id'))
            return result.get('prompt_id')

async def check_progress(prompt_id: str):
    print('history')
    history_url = f"{COMFY_API_URL}/history/{prompt_id}"
    print(1)
    async with aiohttp.ClientSession() as session:
        print(2)
        while True:
            print(3)
            async with session.get(history_url) as response:
                if response.status == 200:
                    history = await response.json()
                    if prompt_id in history:
                        return history[prompt_id]
            await asyncio.sleep(1)

class PromptData(BaseModel):
    day: str
    gender: str
    category: str
    light: str
    info: str

COMFYUI_OUTPUT_DIR = r"C:\Users\201-30\Downloads\Data\Packages\ComfyUI\output"

@app.post('/background')
async def generate_image(prompt: str= Form(...), image: UploadFile = File(...)):
    print('http 통신 시작')
    try:
        parsed_data = json.loads(prompt)
        prompt_data = PromptData(**parsed_data)

        # 워크플로우 JSON 파일 로드
        workflow = await load_workflow('backworkflow.json')
        print(3)
        print(prompt_data.light)
        print(workflow['94'])
        if prompt_data.light == 'Top':
            workflow['94']['inputs']['image']='top.png'
        elif prompt_data.light == 'Bottom':
            workflow['94']['inputs']['image'] = 'bottom.png'
        elif prompt_data.light == 'Left':
            workflow['94']['inputs']['image'] = 'left02.png'
        elif prompt_data.light == 'Right':
            workflow['94']['inputs']['image'] = 'right02.png'
        elif prompt_data.light == 'Center':
            workflow['94']['inputs']['image'] = 'center.png'
        

        print(11)
        gender = None
        if prompt_data.gender == 'male':
            gender ='hansome guy'
        elif prompt_data.gender == 'female':
            gender = 'beautiful woman'

        workflow["4"]["inputs"]["text"] = f"{gender}, detailed face, asian, {prompt_data.category}, {prompt_data.day}, {prompt_data.info}, 4k resolution, looking directly at the camera"
        workflow["5"]["inputs"]["text"] = "embedding:UnrealisticDream, CyberRealistic_Negative, CyberRealistic_Negative_Anime, 6 fingers"
        
        # 워크플로우에 사용자 입력 적용 (예: 프롬프트, 이미지 URL 등)
        # 이 부분은 실제 워크플로우 구조에 따라 조정해야 합니다
        # 이미지 업로드 및 URL 설정 로직이 필요할 수 있습니다
        url = f"{COMFY_API_URL}/upload/image"
        file_content = await image.read()
        print(10)
        form = FormData()
        form.add_field('image', file_content, filename=image.filename, content_type=image.content_type)
        form.add_field('overwrite', 'true')

        async with aiohttp.ClientSession() as session:
            print('crayayay')
            async with session.post(url, data = form) as response:
                print(12)
                response_text= await response.text()
                print(13)
                if response.status == 200:
                    print(14)
                    workflow['9']['inputs']['image']=image.filename
                    print(15)
                    # 프롬프트 큐에 추가
                    prompt_id = await queue_prompt(workflow)
                    print(16)
                    # 진행 상황 확인
                    result = await check_progress(prompt_id)
                    print(result)
                    # 결과 이미지 URL 찾기

                    print(17)
                    final_image_url = result['outputs']['96']['images'][0]['filename']
                    print(final_image_url)

        print(18)
        print(final_image_url)
        if final_image_url:
            local_image_path = os.path.join(r"C:\Users\201-30\Downloads\Data\Packages\ComfyUI\output", final_image_url)
            destination_blob_name=f"generated_images/{final_image_url}"
            firebase_url = upload_image_to_firebase(local_image_path,destination_blob_name)
            return {'status': 'completed', 'image_url': firebase_url}
        else:
            return {'status': 'completed', 'image_url': None}
        
        
        
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
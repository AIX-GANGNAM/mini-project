import os
from dotenv import load_dotenv
from openai import OpenAI
from firebase_admin import credentials, initialize_app, storage
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import uuid
import json
import base64
import websockets
import os
import aiohttp
from fastapi.responses import JSONResponse



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

app = FastAPI()

# CORS 미들웨어 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://221.148.97.238:3000", "http://221.148.97.238:8000" ,"http://192.168.0.150:3000", 'http://localhost:8002', 
                'http://192.168.0.150:8002' ],
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
        base_prompt = "A highly detailed, ultra-realistic portrait, soft lighting, sharp focus, natural skin texture, cinematic, 35mm photography, bokeh background, 4k resolution, vibrant colors, looking directly at the camera, realistic lighting"
        
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
    


COMFY_API_URL = "http://192.168.0.150:8188"  # ComfyUI 서버 주소

async def load_workflow():
    with open('backworkflow.json', 'r') as file:
        return json.load(file)

async def run_workflow(workflow, prompt_data, image):
    async with aiohttp.ClientSession() as session:
        # 워크플로우 실행 요청
        async with session.post(f"{COMFY_API_URL}/prompt", json={"prompt": workflow}) as response:
            if response.status != 200:
                return {"error": "Failed to start workflow"}
            prompt_id = await response.json()

        # 실행 완료 대기
        while True:
            async with session.get(f"{COMFY_API_URL}/history/{prompt_id['prompt_id']}") as response:
                if response.status != 200:
                    return {"error": "Failed to get workflow status"}
                history = await response.json()
                if history[prompt_id['prompt_id']]['status']['status'] == 'complete':
                    break
            await asyncio.sleep(1)

        # 결과 가져오기
        result = history[prompt_id['prompt_id']]['outputs']
        return result
    
def get_image_path(light):
    base_path = r'C:\Users\201-30\Downloads\sample-image'
    image_paths = {
        'Top': os.path.join(base_path, 'top.png'),
        'Bottom': os.path.join(base_path, 'bottom.png'),
        'Center': os.path.join(base_path, 'center.png'),
        'Left': os.path.join(base_path, 'left02.png'),
        'Right': os.path.join(base_path, 'right02.png')
    }
    return image_paths.get(light, os.path.join(base_path, 'top.png'))  

def encode_image(image_path):
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")
    
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    return encoded_string
class PromptData(BaseModel):
    day: str = ""
    category: str = ""
    info: str = ""
    gender: str = ""
    light: str=""

@app.post("/background")
async def generate_image(image: UploadFile = File(...), prompt: str = Form(...)):
    print('http 통신 시작')
    print(prompt)

    prompt_dict = json.loads(prompt)
    prompt_data = PromptData(**prompt_dict)

    workflow = await load_workflow()

    # 프롬프트 업데이트
    for node in workflow['nodes']:
            if node['id'] == 4:
                node['inputs'][0] = f"detailed face, asian, 4k resolution, looking directly at the camera, {prompt_data.day}, {prompt_data.category}, {prompt_data.info}"
            elif node['id'] == 94:  # 문자열 '94'를 정수 94로 변경
                    image_path = get_image_path(prompt_data.light)
                    try:
                        encoded_image = encode_image(image_path)
                        node['inputs'] = [{'name': 'image', 'type': 'STRING', 'value': encoded_image}]
                    except FileNotFoundError as e:
                        print(f"ERROR : {e}")

    # 이미지 업데이트
    if image:
        image_data = await image.read()
        encoded_image = base64.b64encode(image_data).decode('utf-8')
        for node in workflow['nodes']:
            if node['id'] == 9:  # LoadImage 노드 (picture input)
                node['inputs'] = [{'image': encoded_image}]

    result = await run_workflow(workflow, prompt_data, image)

    # 결과에서 이미지 URL 추출
    image_url = result['36']['images'][0]  # 36은 PreviewImage 노드의 ID

    return JSONResponse(content={"image_url": f"{COMFY_API_URL}/view?filename={image_url}"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
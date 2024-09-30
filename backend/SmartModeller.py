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
from fastapi.responses import JSONResponse



# .env 파일 로드
load_dotenv()

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=OPENAI_API_KEY)

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

class PromptData(BaseModel):
    day: str
    gender : str
    category : str
    light : str
    info : str

async def queue_prompt(workflow):
    async with aiohttp.ClientSession() as session:
        print(1)
        async with session.post(f"{COMFY_API_URL}/prompt", json={"prompt": workflow}) as response:
            print(2)
            if response.status != 200:
                error_text = await response.text()
                print(f"Error status: {response.status}")
                raise HTTPException(status_code=response.status, detail=f"ComfyUI Error: {response.reason}")
                print(4)
            result = await response.json()
            return result['prompt_id']

async def get_image(prompt_id):
    async with aiohttp.ClientSession() as session:
        while True:
            async with session.get(f"{COMFY_API_URL}/history/{prompt_id}") as response:
                if response.status != 200:
                    raise HTTPException(status_code=response.status, detail="Failed to get history")
                history = await response.json()
                if prompt_id in history:
                    if history[prompt_id]['status']['status'] == 'completed':
                        for node_id, node_output in history[prompt_id]['outputs'].items():
                            if 'images' in node_output:
                                return node_output['images'][0]
                    elif history[prompt_id]['status']['status'] == 'error':
                        raise HTTPException(status_code=500, detail="Workflow execution failed")
            await asyncio.sleep(1)


@app.post("/background")
async def generate_image(
    image : UploadFile = File(...),
    prompt : str = Form(...)
):
    print('http 통신 성공')
    print(prompt)
    try:
        parsed_data = json.loads(prompt)
        prompt_data = PromptData(**parsed_data)
        if(prompt_data.gender=='male'):
            gender = 'handsome guy'
        elif(prompt_data.gender=='female'):
            gender = 'beautiful woman'
        current_dir = os.path.dirname(os.path.abspath(__file__))
        workflow_path = os.path.join(current_dir, 'backworkflow.json')
        workflow = json.loads(open(workflow_path, 'r', encoding='utf-8').read())

       
        # 프롬프트 업데이트
        print(1)
        workflow["4"]["inputs"]["text"] = f"{gender}, detailed face, asian, {prompt_data.category}, {prompt_data.day}, {prompt_data.info} , 4k resolution, looking directly at the camera"
        print(2)
        workflow["5"]["inputs"]["text"] = "embedding:UnrealisticDream, CyberRealistic_Negative, CyberRealistic_Negative_Anime, 6 fingers"

        # 입력 이미지 업데이트
        print(3)
        image_data = await image.read()
        print(4)
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        print(5)
        workflow["9"]["inputs"]["image"] = image_base64
        print(6)
        # 배경 이미지 업데이트

        back_image_path = os.path.join('common', 'images', 'background.webp')
        with open(back_image_path, "rb") as back_file:
            back_image_base64 = base64.b64encode(back_file.read()).decode('utf-8')
        workflow["51"]["inputs"]["image"] = back_image_base64

        # LoadImage 노드의 다른 필요한 설정 추가
        workflow["51"]["inputs"]["upload"] = "data:image/webp;base64"
        print(8)
        # 조명 이미지 업데이트
        print(9)
        light = prompt_data.light
        base_light_path = os.path.join('common', 'images')
        light_image_map = {
            'Top': 'top.png',
            'Bottom': 'bottom.png',
            'Left': 'left02.png',
            'Right': 'right02.png',
            'Center': 'center.png'
        }

        light_image_path = os.path.join(base_light_path, light_image_map.get(light, 'top.png'))

        with open(light_image_path, "rb") as light_file:
            light_image_base64 = base64.b64encode(light_file.read()).decode('utf-8')
        workflow["94"]["inputs"]["image"] = f"data:image/png;base64,{light_image_base64}"


        print(json.dumps(workflow, indent=2))
        prompt_id = await queue_prompt(workflow)
        print(10)
        image_filename = await get_image(prompt_id)
        return JSONResponse(content={"image_url": f"{COMFY_API_URL}/view?filename={image_filename}"})
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in workflow file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
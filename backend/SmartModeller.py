import os
from dotenv import load_dotenv
from openai import OpenAI
from firebase_admin import credentials, initialize_app, storage
from fastapi import FastAPI, File, UploadFile, Form, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import asyncio
import uuid
import json
import base64
import aiohttp
from aiohttp import FormData
import io
from PIL import Image
import uvicorn
import requests
import logging
import traceback 

load_dotenv()

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

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
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... (기존 코드 유지)

COMFYUI_SERVER = 'http://localhost:8188'

class PromptData(BaseModel):
    day: str
    gender: str
    category: str
    light: str
    info: str

async def queue_prompt(prompt_workflow, ip):
    p = {"prompt": prompt_workflow}
    data = json.dumps(p)

    url = f"http://{ip}/prompt"
    headers = {'Content-Type': 'application/json'}
    
    try:
        logger.debug(f"Sending request to {url}")
        logger.debug(f"Request data: {data}")
        logger.debug(f"Request headers: {headers}")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, data=data, headers=headers) as response:
                logger.debug(f"Response status code: {response.status}")
                response_text = await response.text()
                logger.debug(f"Response content: {response_text}")
                
                if response.status != 200:
                    raise Exception(f"Error response from ComfyUI: {response.status}")
                
                response_json = await response.json()
                return response_json['prompt_id']
    except Exception as e:
        logger.error(f"Error occurred while making the request: {str(e)}")
        raise

async def wait_for_image(prompt_id):
    max_attempts = 60  # 최대 60초 대기
    for _ in range(max_attempts):
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{COMFYUI_SERVER}/history/{prompt_id}") as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get(prompt_id, {}).get("outputs"):
                            output = data[prompt_id]["outputs"]
                            if output and "images" in output[0]:
                                image_filename = output[0]["images"][0]["filename"]
                                async with session.get(f"{COMFYUI_SERVER}/view/{image_filename}") as img_response:
                                    return await img_response.read()
        except Exception as e:
            logger.error(f"Error while waiting for image: {str(e)}")
        await asyncio.sleep(1)  # 1초 대기 후 다시 확인
    raise Exception("Timeout waiting for image generation")

@app.post("/background")
async def upload_image(
    request: Request,
    image: UploadFile = File(...),
    prompt: str = Form(...)
):
    try:
        # 요청 로깅
        logger.info(f"Received request. Headers: {request.headers}")
        logger.info(f"Prompt: {prompt}")
        logger.info(f"Image filename: {image.filename}")

        parsed_data = json.loads(prompt)
        prompt_data = PromptData(**parsed_data)

        current_dir = os.path.dirname(os.path.abspath(__file__))
        workflow_path = os.path.join(current_dir, 'backworkflow.json')
        with open(workflow_path, 'r', encoding='utf-8') as f:
            workflow = json.load(f)

        if prompt_data.light == 'Top':
            workflow['94']['inputs']['image'] = 'top.png'
        elif prompt_data.light == 'Bottom':
            workflow['94']['inputs']['image'] = 'bottom.png'
        elif prompt_data.light == 'Left':
            workflow['94']['inputs']['image'] = 'left02.png'
        elif prompt_data.light == 'Right':
            workflow['94']['inputs']['image'] = 'right02.png'
        elif prompt_data.light == 'Center':
            workflow['94']['inputs']['image'] = 'center.png'

        gender = 'handsome guy' if prompt_data.gender == 'male' else 'beautiful woman'

        workflow["4"]["inputs"]["text"] = f"{gender}, detailed face, asian, {prompt_data.category}, {prompt_data.day}, {prompt_data.info}, 4k resolution, looking directly at the camera"
        workflow["5"]["inputs"]["text"] = "embedding:UnrealisticDream, CyberRealistic_Negative, CyberRealistic_Negative_Anime, 6 fingers"
        
        url = f"{COMFYUI_SERVER}/upload/image"
        
        file_content = await image.read()
        
        form = FormData()
        form.add_field('image', file_content, filename=image.filename, content_type=image.content_type)
        form.add_field('overwrite', 'true')
        
        logger.debug(f"Sending request to ComfyUI server. URL: {url}")
        logger.debug(f"Form data: {form}")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, data=form) as response:
                logger.debug(f"ComfyUI server response status code: {response.status}")
                response_text = await response.text()
                logger.debug(f"ComfyUI server response content: {response_text}")
                
                if response.status == 200:
                    logger.info("Image uploaded successfully")
                    workflow['9']['inputs']['image'] = image.filename
                    prompt_id = await queue_prompt(workflow, 'localhost:8188')
                    logger.info(f"Prompt queued with ID: {prompt_id}")
                    image_output = await wait_for_image(prompt_id)
                    logger.info("Image generated successfully")
                    
                    accept_header = request.headers.get("accept", "")
                    logger.info(f"Accept header: {accept_header}")

                    if "image/png" in accept_header.lower():
                        logger.info("Returning PNG image")
                        return Response(content=image_output, media_type="image/png")
                    else:
                        logger.info("Returning Base64 encoded image")
                        image_base64 = base64.b64encode(image_output).decode('utf-8')
                        return JSONResponse(content={"image": image_base64})
                else:
                    logger.error(f"Failed to upload image. Status: {response.status}")
                    return JSONResponse(content={
                        "error": "Failed to upload image",
                        "status_code": response.status,
                        "response": response_text
                    }, status_code=response.status)

    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(content={
            "error": "An unexpected error occurred",
            "details": str(e)
        }, status_code=500)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
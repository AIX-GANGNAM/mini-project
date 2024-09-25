import os
from dotenv import load_dotenv
from openai import OpenAI
from firebase_admin import credentials, initialize_app, storage
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
    allow_origins=["http://localhost:3000"],  # React 앱의 주소
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

@app.post("/chat")
async def chat_with_gpt(request: ChatRequest):
    try:
        message = request.message
        negative_prompt = request.negative_prompt
        # 사용자 입력을 프롬프트로 변환
        converted_prompt = await convert_to_prompt(message)
        
        # Stable Diffusion API 요청 형식에 맞게 응답 구성
        full_prompt = f"A highly detailed, ultra-realistic portrait, soft lighting, sharp focus, natural skin texture, cinematic, 35mm photography, bokeh background, 4k resolution, vibrant colors, looking directly at the camera, realistic lighting, {converted_prompt}"
        
        response = {
            "prompt": full_prompt,
            "negative_prompt": negative_prompt or "low quality, blurry, deformed, extra limbs, bad anatomy, cartoon, painting, drawing, unrealistic, overexposed, underexposed, noisy, grain",
            "steps": 20,
            "cfg_scale": 7.5,
            "width": 512,
            "height": 512
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
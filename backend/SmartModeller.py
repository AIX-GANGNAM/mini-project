from firebase_admin import credentials, initialize_app, storage
from fastapi import FastAPI, File, UploadFile

cred = credentials.Certificate('smartmodeller-firebase-adminsdk-tq05q-e909c9008d.json')
initialize_app(cred, {
    'storageBucket': 'smartmodeller.appspot.com'
})
bucket = storage.bucket()

app =FastAPI()


#이미지 생성하기 후 FaceSwap하기 할 때 이미지를 DB에 저장한다
# 나중에 로그인을 한 후 이미지를 저장하면 경로를 'ID/imageUrl/{file.filename} 으로 작성한다
@app.post("/uploadfile/")
async def create_upload_file(file: UploadFile):
    #이미지 읽어오고
    blob = bucket.blob(f'createdImageUrl/{file.filename}') #저장한 사진을 파이어베이스 storage의 imageUrl라는 이름의 디렉토리에 저장
    blob.upload_from_file(file.file)
    blob.make_public()
    print("File URL:", blob.public_url)
    return {
        "result" : blob.public_url
    }


# 저장된 이미지 리스트들 다 불러오기
# 나중에 로그인을 한 후 이미지 가져오기 경로를 'ID/imageUrl/{file.filename} 으로 작성한다
@app.get("/findAllImageUrl/")
async def findAllImageUrl():

    blobs = bucket.list_blobs(prefix="createdImageUrl/")  # imageUrl 폴더 안에 있는 이미지 불러오기
    imageUrlList = []

    # bobs에 저장된 이미지들을 하나씩 리스트에 넣기
    for blob in blobs:
        blob.make_public()  # Ensure each file is public
        imageUrlList.append(blob.public_url)
    
    # Return all image URLs
    return {
        "result": imageUrlList
    }


# 내보내기 할 때 데이터베이스에서 제거한다 
# FaceSwap 후 내보내기 할 때 생성한 이미지를 DB에서 지운다
# 나중에 로그인을 한 후 이미지를 샂게하면 경로를 'ID/imageUrl/{file.filename} 으로 작성한다
@app.post("/deleteImage")
async def deleteByImage(imageUrl:str):
      
    blobs = bucket.list_blobs(prefix="createdImageUrl/")  # imageUrl 폴더 안에 있는 이미지 불러오기
    beforeDelete = []
    afterDelete=[]

    # bobs에 저장된 이미지들을 하나씩 리스트에 넣기
    for blob in blobs:
        beforeDelete.append(blob.public_url)
        blob.make_public()  # Ensure each file is public
        if blob.public_url == imageUrl : 
            print('blob.public_url:'+blob.public_url)
            blob.delete()
        else:
            afterDelete.append(blob.public_url)

    
    return {
        "삭제 전 이미지 리스트" : beforeDelete,
        "삭제 후 이미지 리스트":afterDelete}
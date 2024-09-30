import React, { useState } from 'react';
import axios from 'axios';
import './Create.css';
import { useSelector } from 'react-redux';
import { ref, uploadString } from "firebase/storage";
import { format } from 'date-fns';
import { storage } from './firebase/config';
import { Link, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const translations = {
    en: {
        title: "Image Generation",
        viewImages: "View My Generated Images",
        gender: "Gender",
        male: "Male",
        female: "Female",
        prompt: "Prompt:",
        promptPlaceholder: "Enter a description for the image you want to generate.",
        imageSize: "Image Size:",
        numImages: "Number of Images:",
        image: "Image",
        images: "Images",
        generateImages: "Generate Images",
        processingPrompt: "Processing Prompt...",
        generatingImages: "Generating Images...",
        proMode: "Pro Mode",
        proModeTooltip: "It takes about a minute, but generates a perfect model.",
        downloadImage: "Download Image",
        selectNumImages: "Select Number of Images",
        cancel: "Cancel",
        placeholder: "Your generated images will appear here.",
        go: "Go To Swap"
    },
    ko: {
        title: "이미지 생성",
        viewImages: "내 생성된 이미지 보기",
        gender: "성별",
        male: "남성",
        female: "여성",
        prompt: "프롬프트:",
        promptPlaceholder: "생성하고 싶은 이미지에 대한 설명을 입력하세요.",
        imageSize: "이미지 크기:",
        numImages: "이미지 수:",
        image: "이미지",
        images: "이미지",
        generateImages: "이미지 생성",
        processingPrompt: "프롬프트 처리 중...",
        generatingImages: "이미지 생성 중...",
        proMode: "프로 모드",
        proModeTooltip: "1분 정도 걸리지만 완벽한 모델을 생성합니다.",
        downloadImage: "이미지 다운로드",
        selectNumImages: "이미지 수 선택",
        cancel: "취소",
        placeholder: "생성된 이미지가 여기에 표시됩니다.",
        go: "스왑 하기"
    }
};

export default function Create() {
    const location = useLocation();
    const { selectedImage } = location.state || {}; // UserImages 컴포넌트에서 전달된 이미지


    const base64ToBlob = (base64, mime) => {
        const byteString = atob(base64.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mime });
      };

    const [prompt, setPrompt] = useState('');
    const [generatedImages, setGeneratedImages] = useState(selectedImage ? [selectedImage]:[]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPromptLoading, setIsPromptLoading] = useState(false);
    const [imageSize, setImageSize] = useState('512x512');
    const [gender, setGender] = useState('');
    const [numImages, setNumImages] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [language, setLanguage] = useState('en');
    const navigate = useNavigate();

    const toggleModal = () => setModalOpen(!modalOpen);

    const handleGenerate = async () => {
        setIsPromptLoading(true);
        try {
            const [width, height] = imageSize.split('x').map(Number);

            // FastAPI 서버에 요청을 보냅니다. width, height, gender, numImages를 포함시킵니다.
            const promptResponse = await axios.post('http://localhost:8000/chat', {
                message: prompt,
                width: width,
                height: height,
                gender: gender,
                num_images: numImages
            });
            setIsPromptLoading(false);
            setIsLoading(true);

            // FastAPI 서버의 응답을 사용하여 Stable Diffusion API에 요청을 보냅니다.
            const response = await axios.post('http://192.168.0.162:7860/sdapi/v1/txt2img', promptResponse.data);

            if (response.data.images && response.data.images.length > 0) {
                const images = response.data.images.map(img => `data:image/png;base64,${img}`);
                setGeneratedImages(images);

                // Save images to Firebase Storage
                for (let i = 0; i < images.length; i++) {
                    await saveImageToFirebase(images[i], i);
                }
            }
        } catch (error) {
            console.error('Error generating image:', error);
        }
        setIsLoading(false);
    };

    const handleDownload = (image, index) => {
        const link = document.createElement('a');
        link.href = image;
        link.download = `generated-image-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const user = useSelector(state => state.auth.user);
    console.log(user.uid);

    const saveImageToFirebase = async (imageData, index) => {
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        const imagePath = `create/${user.uid}/${timestamp}/image_${index + 1}.png`;
        const imageRef = ref(storage, imagePath);  // 여기서 직접 storage를 사용합니다.

        try {
            await uploadString(imageRef, imageData.split(',')[1], 'base64');
            console.log(`Image ${index + 1} uploaded successfully`);
        } catch (error) {
            console.error(`Error uploading image ${index + 1}:`, error);
        }
    };

    const handleProModeClick = () => {
        navigate('/main/pro-mode');
    };

    const toggleLanguage = () => {
        setLanguage(prevLang => prevLang === 'en' ? 'ko' : 'en');
    };

    const t = translations[language];

    return (
        <div className="create-container">
            <div className="input-section">
                <div className="header">
                    <h2>{t.title}</h2>
                    <button onClick={toggleLanguage} className="language-toggle">
                        {language === 'en' ? '한국어' : 'English'}
                    </button>
                </div>
                <Link
                    to="/my-images"
                    state={{ from: "create" }}
                    className="view-images-link"
                >
                    {t.viewImages}
                </Link>
                <div className="gender-selector">
                    <label>{t.gender}:</label>
                    <div className="gender-buttons">
                        <button
                            className={`gender-button ${gender === 'male' ? 'active' : ''}`}
                            onClick={() => setGender('male')}
                            data-gender="male"
                        >
                            {t.male}
                        </button>
                        <button
                            className={`gender-button ${gender === 'female' ? 'active' : ''}`}
                            onClick={() => setGender('female')}
                            data-gender="female"
                        >
                            {t.female}
                        </button>
                    </div>
                </div>
                <label>{t.prompt}</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t.promptPlaceholder}
                />
                <div className="image-size-selector">
                    <label>{t.imageSize}</label>
                    <select value={imageSize} onChange={(e) => setImageSize(e.target.value)}>
                        <option value="256x256">256x256</option>
                        <option value="512x512">512x512</option>
                        <option value="1024x1024">1024x1024</option>
                    </select>
                </div>
                <div className="num-images-selector">
                    <label>{t.numImages}</label>
                    <button onClick={toggleModal} className="select-num-images-button">
                        {numImages} {numImages === 1 ? t.image : t.images}
                    </button>
                </div>
                <div className="button-group">
                    <button
                        className="generate-button"
                        onClick={handleGenerate}
                        disabled={isPromptLoading || isLoading}
                    >
                        {isPromptLoading ? t.processingPrompt : isLoading ? t.generatingImages : t.generateImages}
                    </button>
                    <div className="pro-mode-tooltip">
                        <button
                            className="pro-mode-button"
                            onClick={handleProModeClick}
                        >
                            {t.proMode}
                        </button>
                        <span className="pro-mode-tooltiptext">{t.proModeTooltip}</span>
                    </div>
                </div>
            </div>
            <div className="result-section">
                {isPromptLoading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <p>{t.processingPrompt}</p>
                    </div>
                )}
                {isLoading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <p>{t.generatingImages}</p>
                    </div>
                )}
                {generatedImages.length > 0 ? (
                    <div className="generated-images">
                        {generatedImages.map((image, index) => (
                            <div key={index} className="generated-image-container">
                                <img src={image} alt={`Generated ${index + 1}`} />
                                <button className="download-button" onClick={() => handleDownload(image, index)}>
                                    {t.downloadImage}
                                </button>
                            </div>
                        ))}
                        <div>
                            <br></br>
                            <Link
                                to="/main/swap"
                                state={{ generatedImage: generatedImages[0] }} // 첫 번째 생성된 이미지만 전달
                                className="view-images-link"
                            >
                                {t.go}
                            </Link></div>
                    </div>
                ) : (
                    <div className="placeholder">
                        {t.placeholder}
                    </div>
                )}


            </div>

            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{t.selectNumImages}</h2>
                        <div className="image-count-buttons">
                            {[1, 2, 3, 4].map(count => (
                                <button
                                    key={count}
                                    className={`count-button ${numImages === count ? 'active' : ''}`}
                                    onClick={() => {
                                        setNumImages(count);
                                        toggleModal();
                                    }}
                                >
                                    {count}
                                </button>
                            ))}
                        </div>
                        <button className="modal-close" onClick={toggleModal}>{t.cancel}</button>
                    </div>
                </div>
            )}
        </div>
    );
}
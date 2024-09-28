import React, { useState } from 'react';
import axios from 'axios';
import './ProMode.css';

// 로딩 컴포넌트 추가
const LoadingSpinner = ({ language }) => {
  const text = language === 'en' ? 'It takes about 1 minute...' : '1분 정도 소요됩니다...';
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="ai-brain">
          <div className="circle"></div>
          <div className="circle"></div>
          <div className="circle"></div>
        </div>
        <p>{text}</p>
      </div>
    </div>
  );
};

const translations = {
  en: {
    title: "Pro Mode Image Generation",
    prompt: "Prompt:",
    promptPlaceholder: "Enter a detailed description for your image",
    samplingMethod: "Sampling Method:",
    steps: "Steps:",
    cfgScale: "CFG Scale:",
    seed: "Seed:",
    generateImage: "Generate Image",
    processing: "Processing...",
    downloadImage: "Download Image",
    imageSize: "Image Size:",
    upscale: "Upscale:",
    faceRestoration: "Face Restoration:",
  },
  ko: {
    title: "프로 모드 이미지 생성",
    prompt: "프롬프트:",
    promptPlaceholder: "이미지에 대한 상세한 설명을 입력하세요",
    samplingMethod: "샘플링 방법:",
    steps: "스텝:",
    cfgScale: "CFG 스케일:",
    seed: "시드:",
    generateImage: "이미지 생성",
    processing: "처리 중...",
    downloadImage: "이미지 다운로드",
    imageSize: "이미지 크기:",
    upscale: "업스케일:",
    faceRestoration: "얼굴 복원:",
  }
};

export default function ProMode() {
    const [prompt, setPrompt] = useState('');
    const [samplingMethod, setSamplingMethod] = useState('dpmpp_sde');
    const [steps, setSteps] = useState(20);
    const [cfgScale, setCfgScale] = useState(7);
    const [seed, setSeed] = useState(-1);
    const [imageSize, setImageSize] = useState('512x512');
    const [upscale, setUpscale] = useState(false);
    const [faceRestoration, setFaceRestoration] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState('en');
    const [error, setError] = useState(null);

    const toggleLanguage = () => {
        setLanguage(prevLang => prevLang === 'en' ? 'ko' : 'en');
    };

    const t = translations[language];

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [width, height] = imageSize.split('x').map(Number);
            
            const params = {
                prompt: prompt,
                sampling_method: samplingMethod,
                steps: steps,
                cfg_scale: cfgScale,
                seed: seed,
                width: width,
                height: height,
                upscale: upscale,
                face_restoration: faceRestoration
            };
    
            const response = await axios.post('http://221.148.97.237:8000/generate', params);
    
            if (response.data && response.data.image_url) {
                setGeneratedImageUrl(response.data.image_url);
            } else {
                setError('이미지 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error generating image:', error);
            setError('이미지 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
        }
        setIsLoading(false);
    };

    const handleDownload = () => {
        if (generatedImageUrl) {
            window.open(generatedImageUrl, '_blank');
        }
    };

    return (
        <div className="pro-mode-container">
            <div className="header">
                <h1>{t.title}</h1>
                <button onClick={toggleLanguage} className="language-toggle">
                    {language === 'en' ? '한국어' : 'English'}
                </button>
            </div>
            <div className="input-section">
                <label>{t.prompt}</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t.promptPlaceholder}
                />
                <div className="input-group">
                    <label>{t.samplingMethod}</label>
                    <select value={samplingMethod} onChange={(e) => setSamplingMethod(e.target.value)}>
                        <option value="dpmpp_sde">DPM++ SDE</option>
                        <option value="dpmpp_2m">DPM++ 2M</option>
                        <option value="euler_a">Euler a</option>
                        <option value="euler">Euler</option>
                        <option value="ddim">DDIM</option>
                    </select>
                </div>
                <div className="input-group">
                    <label>{t.steps}</label>
                    <input type="number" value={steps} onChange={(e) => setSteps(Number(e.target.value))} min="1" max="150" />
                </div>
                <div className="input-group">
                    <label>{t.cfgScale}</label>
                    <input type="number" value={cfgScale} onChange={(e) => setCfgScale(Number(e.target.value))} min="1" max="30" step="0.5" />
                </div>
                <div className="input-group">
                    <label>{t.seed}</label>
                    <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} min="-1" />
                </div>
                <div className="input-group">
                    <label>{t.imageSize}</label>
                    <select value={imageSize} onChange={(e) => setImageSize(e.target.value)}>
                        <option value="512x512">512x512</option>
                        <option value="768x768">768x768</option>
                        <option value="1024x1024">1024x1024</option>
                    </select>
                </div>
                <div className="input-group">
                    <label>{t.upscale}</label>
                    <input type="checkbox" checked={upscale} onChange={(e) => setUpscale(e.target.checked)} />
                </div>
                <div className="input-group">
                    <label>{t.faceRestoration}</label>
                    <input type="checkbox" checked={faceRestoration} onChange={(e) => setFaceRestoration(e.target.checked)} />
                </div>
                <button className="generate-button" onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? t.processing : t.generateImage}
                </button>
            </div>
            <div className="result-section">
                {generatedImageUrl && (
                    <div className="generated-image-container">
                        <img src={generatedImageUrl} alt="Generated" />
                        <button className="download-button" onClick={handleDownload}>
                            {t.downloadImage}
                        </button>
                    </div>
                )}
            </div>
            
            {/* 로딩 스피너 추가 */}
            {isLoading && <LoadingSpinner language={language} />}
            {error && <div className="error-message">{error}</div>}
        </div>
    );
}
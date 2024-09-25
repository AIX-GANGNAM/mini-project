import React, { useState } from 'react';
import axios from 'axios';
import './Create.css';

export default function Create() {
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPromptLoading, setIsPromptLoading] = useState(false);

    const handleGenerate = async () => {
        setIsPromptLoading(true);
        try {
            // FastAPI 서버에 요청을 보냅니다.
            const promptResponse = await axios.post('http://localhost:8000/chat', {
                message: prompt,
                negative_prompt: negativePrompt
            });
            setIsPromptLoading(false);
            setIsLoading(true);

            // FastAPI 서버의 응답을 사용하여 Stable Diffusion API에 요청을 보냅니다.
            const response = await axios.post('http://221.148.97.237:7860/sdapi/v1/txt2img', promptResponse.data);

            if (response.data.images && response.data.images.length > 0) {
                setGeneratedImage(`data:image/png;base64,${response.data.images[0]}`);
            }
        } catch (error) {
            console.error('Error generating image:', error);
        }
        setIsLoading(false);
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = 'generated-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="create-container">
            <div className="input-section">
                <h2>Image Generation</h2>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter a description for the image you want to generate."
                />
                <textarea
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="Enter negative prompts (optional)"
                />
                <button
                    className="generate-button"
                    onClick={handleGenerate}
                    disabled={isPromptLoading || isLoading}
                >
                    {isPromptLoading ? 'Processing Prompt...' : isLoading ? 'Generating Image...' : 'Generate Image'}
                </button>
            </div>
            <div className="result-section">
                {isPromptLoading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <p>Processing prompt...</p>
                    </div>
                )}
                {isLoading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <p>Generating image...</p>
                    </div>
                )}
                {generatedImage ? (
                    <>
                        <img src={generatedImage} alt="Generated Image" />
                        <button className="download-button" onClick={handleDownload}>
                            Download Image
                        </button>
                    </>
                ) : (
                    <div className="placeholder">
                        Your generated image will appear here.
                    </div>
                )}
            </div>
        </div>
    );
}
import React, { useState } from 'react';
import axios from 'axios';
import './Create.css';

export default function Create() {
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post('http://221.148.97.237:7860/sdapi/v1/txt2img', {
                prompt: prompt,
                negative_prompt: negativePrompt,
                steps: 20,
                cfg_scale: 7.5,
                width: 512,
                height: 512
            });
            
            if (response.data.images && response.data.images.length > 0) {
                setGeneratedImage(`data:image/png;base64,${response.data.images[0]}`);
            }
        } catch (error) {
            console.error('Error generating image:', error);
        }
        setIsLoading(false);
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
                <button className="generate-button" onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? 'Generating...' : 'Generate Image'}
                </button>
            </div>
            <div className="result-section">
                {generatedImage ? (
                    <img src={generatedImage} alt="Generated Image" />
                ) : (
                    <div className="placeholder">
                        Your generated image will appear here.
                    </div>
                )}
            </div>
        </div>
    );
}
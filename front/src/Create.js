import React, { useState } from 'react';
import axios from 'axios';
import './Create.css';
import { useSelector } from 'react-redux';
import { ref, uploadString } from "firebase/storage";
import { format } from 'date-fns';
import { storage } from './firebase/config';
import { Link } from 'react-router-dom';

export default function Create() {
    const [prompt, setPrompt] = useState('');
    const [generatedImages, setGeneratedImages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPromptLoading, setIsPromptLoading] = useState(false);
    const [imageSize, setImageSize] = useState('512x512');
    const [gender, setGender] = useState('');
    const [numImages, setNumImages] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);

    const toggleModal = () => setModalOpen(!modalOpen);

    const handleGenerate = async () => {
        setIsPromptLoading(true);
        try {
            const [width, height] = imageSize.split('x').map(Number);
            
            // FastAPI 서버에 요청을 보냅니다. width, height, gender, numImages를 포함시킵니다.
            const promptResponse = await axios.post('http://221.148.97.238:8000/chat', {
                message: prompt,
                width: width,
                height: height,
                gender: gender,
                num_images: numImages
            });
            setIsPromptLoading(false);
            setIsLoading(true);

            // FastAPI 서버의 응답을 사용하여 Stable Diffusion API에 요청을 보냅니다.
            const response = await axios.post('http://221.148.97.237:7860/sdapi/v1/txt2img', promptResponse.data);

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

    return (
        <div className="create-container">
            <div className="input-section">
                <h2>Image Generation</h2>
                <Link 
                    to="/my-images"
                    state={{ from: "create" }}
                    className="view-images-link"
                >
                    View My Generated Images
                </Link>
                <div className="gender-selector">
                    <label>Gender:</label>
                    <div className="gender-buttons">
                        <button
                            className={`gender-button ${gender === 'male' ? 'active' : ''}`}
                            onClick={() => setGender('male')}
                            data-gender="male"
                        >
                            Male
                        </button>
                        <button
                            className={`gender-button ${gender === 'female' ? 'active' : ''}`}
                            onClick={() => setGender('female')}
                            data-gender="female"
                        >
                            Female
                        </button>
                    </div>
                </div>
                <label>Prompt:</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter a description for the image you want to generate."
                />
                <div className="image-size-selector">
                    <label>Image Size:</label>
                    <select value={imageSize} onChange={(e) => setImageSize(e.target.value)}>
                        <option value="256x256">256x256</option>
                        <option value="512x512">512x512</option>
                        <option value="1024x1024">1024x1024</option>
                    </select>
                </div>
                <div className="num-images-selector">
                    <label>Number of Images:</label>
                    <button onClick={toggleModal} className="select-num-images-button">
                        {numImages} {numImages === 1 ? 'Image' : 'Images'}
                    </button>
                </div>
                <button
                    className="generate-button"
                    onClick={handleGenerate}
                    disabled={isPromptLoading || isLoading}
                >
                    {isPromptLoading ? 'Processing Prompt...' : isLoading ? 'Generating Images...' : 'Generate Images'}
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
                        <p>Generating images...</p>
                    </div>
                )}
                {generatedImages.length > 0 ? (
                    <div className="generated-images">
                        {generatedImages.map((image, index) => (
                            <div key={index} className="generated-image-container">
                                <img src={image} alt={`Generated ${index + 1}`} />
                                <button className="download-button" onClick={() => handleDownload(image, index)}>
                                    Download Image
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="placeholder">
                        Your generated images will appear here.
                    </div>
                )}
            </div>
    
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Select Number of Images</h2>
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
                        <button className="modal-close" onClick={toggleModal}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}
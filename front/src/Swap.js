import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Link } from 'react-router-dom';
import './Swap.css';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { ref, uploadString } from "firebase/storage";
import { format } from 'date-fns';
import { storage } from './firebase/config';
import { useLocation } from 'react-router-dom';

const translations = {
  en: {
    title: "Face Swap",
    originalImage: "Original Image Upload",
    swapImage: "Swap Face Upload",
    processPrompt: "Processing...",
    generate: "Generate",
    placeholder: "Please add a photo.",
    viewImages: "View My Images",
    swapPrompt: "Swap Faces with One Click",
    swappedImage: "Swapped Image",
    processingMessage: "Processing the image, please wait...",
    download: "Download File",
    reset: "Reset"
  },
  ko: {
    title: "얼굴 교체",
    originalImage: "원본 이미지 업로드",
    swapImage: "교체 얼굴 업로드",
    processPrompt: "처리 중...",
    generate: "교체",
    placeholder: "사진을 추가 해주세요.",
    viewImages: "내 생성된 이미지 보기",
    swapPrompt: "한 번의 클릭으로 얼굴 교체",
    swappedImage: "교체된 이미지",
    processingMessage: "이미지를 처리하는 중입니다. 잠시만 기다려 주세요...",
    download: "파일 다운로드",
    reset: "다시 변환하기"
  }
};

const Swap = () => {
  const location = useLocation();
  const { generatedImage } = location.state || {}; // 전달된 이미지가 없을 경우 빈 객체

  const [originalImage, setOriginalImage] = useState(generatedImage ? generatedImage : null);
  const [swapImage, setSwapImage] = useState(null);
  const [swappedImage, setSwappedImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');

  const user = useSelector(state => state.auth.user);

  const onDropOriginal = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    setOriginalImage(file);
  }, []);

  const onDropSwap = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    setSwapImage(file);
  }, []);

  const { getRootProps: getRootPropsOriginal, getInputProps: getInputPropsOriginal } = useDropzone({
    onDrop: onDropOriginal,
    accept: 'image/*',
  });

  const { getRootProps: getRootPropsSwap, getInputProps: getInputPropsSwap } = useDropzone({
    onDrop: onDropSwap,
    accept: 'image/*',
  });

  const saveImageToFirebase = async (blob, index) => {
    if (!user || !user.uid) return;

    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const imagePath = `swap/${user.uid}/${timestamp}/image_${index + 1}.png`;
    const imageRef = ref(storage, imagePath);

    try {
      const base64String = await blobToBase64(blob);
      await uploadString(imageRef, base64String, 'data_url');
      console.log(`Image ${index + 1} uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading image ${index + 1}:`, error);
    }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSwapClick = async () => {
    if (!originalImage || !swapImage) {
      alert(translations[language].placeholder);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file1", originalImage);
    formData.append("file2", swapImage);

    try {
      const response = await axios.post("http://localhost:8001/uploadfile", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'image/jpeg' });
      const newSwappedImage = URL.createObjectURL(blob);

      setSwappedImage(newSwappedImage);
      setHistory(prevHistory => [...prevHistory, newSwappedImage]);

      // Firebase에 이미지 저장
      await saveImageToFirebase(blob, history.length);

    } catch (error) {
      console.error("이미지 교체 중 오류 발생:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadClick = () => {
    if (swappedImage) {
      const link = document.createElement('a');
      link.href = swappedImage;
      link.download = 'swapped_image.jpg'; // 다운로드할 파일 이름 지정
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleResetClick = () => {
    setOriginalImage(null);
    setSwapImage(null);
    setSwappedImage(null);
  };

  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'en' ? 'ko' : 'en');
  };

  return (
    <div className="container">
      <div className="header">
        <h1>{translations[language].title}</h1>
        <button onClick={toggleLanguage} className="language-toggle2">
          {language === 'en' ? '한국어' : 'English'}
        </button>
      </div>

      <div className='viewImageSwap'>
        <Link 
          to="/my-images"
          state={{ from: "swap" }}
          className="view-images-link"
        >
          {translations[language].viewImages}
        </Link>
      </div>

      <div className="upload-section">
        <div className="upload-box" {...getRootPropsOriginal()}>
          <input {...getInputPropsOriginal()} />
          {originalImage ? (
            <img src={URL.createObjectURL(originalImage)} alt="Original" className="uploaded-image" />
          ) : (
            <div className="upload-content">
              <h3>{translations[language].originalImage}</h3>
              <p className="middle-text">{translations[language].placeholder}</p>
            </div>
          )}
        </div>

        <div className="upload-box" {...getRootPropsSwap()}>
          <input {...getInputPropsSwap()} />
          {swapImage ? (
            <img src={URL.createObjectURL(swapImage)} alt="Swap" className="uploaded-image" />
          ) : (
            <div className="upload-content">
              <h3>{translations[language].swapImage}</h3>
              <p>{translations[language].placeholder}</p>
            </div>
          )}
        </div>
      </div>

      <div className="swap-section">
        <h3>{translations[language].swapPrompt}</h3>
        <br />
        <button className="swap-button" onClick={handleSwapClick} disabled={loading}>
          {loading ? translations[language].processPrompt : translations[language].generate}
        </button>
      </div>

      <div className="scroll-container">
        {loading && <p className='imageLoading'>{translations[language].processPrompt}</p>}
        {swappedImage && (
          <div className="result-section">
            <h3>{translations[language].swappedImage}</h3>
            <img src={swappedImage} alt="Swapped" className="swapped-image" />
            <br />
            <button className="swap-button" onClick={handleDownloadClick}>{translations[language].download}</button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <button className="swap-button" onClick={handleResetClick}>{translations[language].reset}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Swap;

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Link } from 'react-router-dom';
import './Swap.css';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { ref, uploadString } from "firebase/storage";
import { format } from 'date-fns';
import { storage } from './firebase/config';

const Swap = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [swapImage, setSwapImage] = useState(null);
  const [swappedImage, setSwappedImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

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
      alert("이미지를 먼저 업로드하세요.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file1", originalImage);
    formData.append("file2", swapImage);

    try {

      const response = await axios.post("http://221.148.97.237:8001/uploadfile", formData, {
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

  return (
    <div className="container">
      <div className="header">
        <div className="tab active">face swap</div>
        <Link 
                to="/my-images"
                state={{ from: "swap" }}
                className="view-images-link"
            >
          내 생성된 이미지 보기
        </Link>
      </div>

      <div className="upload-section">
        <div className="upload-box" {...getRootPropsOriginal()}>
          <input {...getInputPropsOriginal()} />
          {originalImage ? (
            <img src={URL.createObjectURL(originalImage)} alt="Original" className="uploaded-image" />
          ) : (
            <div className="upload-content">
              <h3>원본 이미지 업로드</h3>
              <p className="middle-text">얼굴 이외의 영역을 유지합니다</p>
              <p className="bottom-text">사진을 추가 해주세요</p>
            </div>
          )}
        </div>

        <div className="upload-box" {...getRootPropsSwap()}>
          <input {...getInputPropsSwap()} />
          {swapImage ? (
            <img src={URL.createObjectURL(swapImage)} alt="Swap" className="uploaded-image" />
          ) : (
            <div className="upload-content">
              <h3>교체 얼굴 업로드</h3>
              <p>원본 이미지에서 얼굴을 교체합니다</p>
              <p>사진을 추가 해주세요</p>
            </div>
          )}
        </div>
      </div>

      <div className="swap-section">
        <h3>한 번의 클릭으로 얼굴 교체</h3>
        <br />
        <button className="swap-button" onClick={handleSwapClick} disabled={loading}>
          {loading ? "교체 중..." : "교체"}
        </button>
      </div>

      <div className="scroll-container">
        {loading && <p className='imageLoading'>이미지를 처리하는 중입니다. 잠시만 기다려 주세요...</p>}
        {swappedImage && (
          <div className="result-section">
            <h3>교체된 이미지</h3>
            <img src={swappedImage} alt="Swapped" className="swapped-image" />
            <br />
            <br />
            <button className="swap-button" onClick={handleDownloadClick}>파일 다운로드</button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <button className="swap-button" onClick={handleResetClick}>다시 변환하기</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Swap;

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './Swap.css'; // CSS 파일을 통해 스타일 적용
import axios from 'axios';

const Swap = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [swapImage, setSwapImage] = useState(null);
  const [swappedImage, setSwappedImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false); // 로딩 상태 추가

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

  const handleSwapClick = async () => {
    if (!originalImage || !swapImage) {
      alert("이미지를 먼저 업로드하세요.");
      return;
    }

    setLoading(true); // 로딩 시작
    const formData = new FormData();
    formData.append("file1", originalImage);
    formData.append("file2", swapImage);

    try {
      //const response = await axios.post("http://221.148.97.238:8001/uploadfile", formData, {
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

    } catch (error) {
      console.error("이미지 교체 중 오류 발생:", error);
    } finally {
      setLoading(false); // 로딩 끝
    }
  };

  const handleDownloadClick = () => {
    if (swappedImage) {
      const link = document.createElement('a');
      link.href = swappedImage;
      link.download = 'swapped_image.jpg';
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
        <button className="swap-button" onClick={handleSwapClick} disabled={loading}>
          {loading ? "교체 중..." : "교체"}
        </button>
      </div>

      <div className="scroll-container">
        {loading && <p>이미지를 처리하는 중입니다. 잠시만 기다려 주세요...</p>}
        {swappedImage && (
          <div className="result-section">
            <h3>교체된 이미지</h3>
            <img src={swappedImage} alt="Swapped" className="swapped-image" />
            <button className="swap-button" onClick={handleDownloadClick}>파일 다운로드</button>
            <button className="swap-button" onClick={handleResetClick}>다시 변환하기</button>
          </div>
        )}

        {history.length > 0 && (
          <div className="history-section">
            <h3>히스토리</h3>
            <div className="history-images">
              {history.map((img, index) => (
                <img key={index} src={img} alt={`History ${index + 1}`} className="history-image" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Swap;

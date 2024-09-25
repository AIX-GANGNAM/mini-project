import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './Swap.css'; // CSS 파일을 통해 스타일 적용

const Swap = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [swapImage, setSwapImage] = useState(null);
  const [swappedImage, setSwappedImage] = useState(null);
  const [history, setHistory] = useState([]);

  const onDropOriginal = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    setOriginalImage(URL.createObjectURL(file));
  }, []);

  const onDropSwap = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    setSwapImage(URL.createObjectURL(file));
  }, []);

  const { getRootProps: getRootPropsOriginal, getInputProps: getInputPropsOriginal } = useDropzone({
    onDrop: onDropOriginal,
    accept: 'image/*',
  });

  const { getRootProps: getRootPropsSwap, getInputProps: getInputPropsSwap } = useDropzone({
    onDrop: onDropSwap,
    accept: 'image/*',
  });

  const handleSwapClick = () => {
    console.log('이미지 교체');
    const newSwappedImage = `https://via.placeholder.com/300?text=Swapped+${Date.now()}`;
    setSwappedImage(newSwappedImage);
    setHistory(prevHistory => [...prevHistory, newSwappedImage]);
  };

  const handleSaveClick = () => {
    console.log('이미지 저장');
    // 이미지 저장 로직 추가
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
            <img src={originalImage} alt="Original" className="uploaded-image" />
          ) : (
            <div className="upload-content">
              <h3>원본 이미지 업로드</h3>
              <p className="middle-text">얼굴 이외의 영역을 유지합니다</p>
              <p className="bottom-text">여기에 파일을 드래그 앤 드롭 하세요</p>
            </div>
          )}
        </div>

        <div className="upload-box" {...getRootPropsSwap()}>
          <input {...getInputPropsSwap()} />
          {swapImage ? (
            <img src={swapImage} alt="Swap" className="uploaded-image" />
          ) : (
            <div className="upload-content">
              <h3>교체 얼굴 업로드</h3>
              <p>원본 이미지에서 얼굴을 교체합니다</p>
              <p>여기에 파일을 드래그 앤 드롭 하세요</p>
            </div>
          )}
        </div>
      </div>

      <div className="swap-section">
        <h3>한 번의 클릭으로 얼굴 교체</h3>
        <button className="swap-button" onClick={handleSwapClick}>교체</button>
        <button className="upload-button" onClick={handleSaveClick}>저장하기</button>
      </div>

      {swappedImage && (
        <div className="result-section">
          <h3>교체된 이미지</h3>
          <img src={swappedImage} alt="Swapped" />
        </div>
      )}

      {history.length > 0 && (
        <div className="history-section">
          <h3>히스토리</h3>
          <div className="history-images">
            {history.map((img, index) => (
              <img key={index} src={img} alt={`History ${index + 1}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Swap;
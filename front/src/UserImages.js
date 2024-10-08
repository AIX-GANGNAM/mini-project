import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import './UserImages.css';
import { useLocation, Link ,useNavigate } from 'react-router-dom';


export default function UserImages() {
    const navigate = useNavigate();  // useNavigate 훅 선언
    const [images, setImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = useSelector(state => state.auth.user);
    const location = useLocation();
    const { from } = location.state || {};
    console.log("from:", from);
    useEffect(() => {
        const fetchImages = async () => {
            if (!user || !user.uid) return;


            const storage = getStorage();
            const listRef = ref(storage, `${from}/${user.uid}`);

            try {
                const res = await listAll(listRef);
                const folderPromises = res.prefixes.map(async (folderRef) => {
                    const folderContents = await listAll(folderRef);
                    const itemPromises = folderContents.items.map(async (itemRef) => {
                        const url = await getDownloadURL(itemRef);
                        return { 
                            url: `${url}&t=${new Date().getTime()}`, 
                            name: itemRef.name, 
                            timestamp: folderRef.name // timestamp 값이 최신 순으로 정렬하는 데 사용될 값입니다.
                        };
                    });
                    return Promise.all(itemPromises);
                });
                const allImages = await Promise.all(folderPromises);
                const flattenedImages = allImages.flat();
    
                // 최신순으로 정렬 (timestamp를 기준으로 역순 정렬)
                const sortedImages = flattenedImages.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    
                console.log("All images:", sortedImages);
                setImages(sortedImages);
            } catch (error) {
                console.error("Error fetching images: ", error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchImages();
    }, [user, from]);


    const handleDownload1 = async (image) => {
        try {
            const storage = getStorage();
            const imageRef = ref(storage, `${from}/${user.uid}/${image.timestamp}/${image.name}`);
            
            const downloadURL = await getDownloadURL(imageRef);
            
            window.open(downloadURL, '_blank');
        } catch (error) {
            console.error("Download failed:", error);
            alert("다운로드에 실패했습니다. 다시 시도해 주세요.");
        }
    };


    const handleDownload2 = async (image) => {
        // handleDownload1과 동일한 방식으로 처리
        try {
            const storage = getStorage();
            const imageRef = ref(storage, `${from}/${user.uid}/${image.timestamp}/${image.name}`);
            
            const downloadURL = await getDownloadURL(imageRef);
            
            window.open(downloadURL, '_blank');
        } catch (error) {
            console.error("Download failed:", error);
            alert("다운로드에 실패했습니다. 다시 시도해 주세요.");
        }
    };

    const handleDownload = (image) => {
        if (from === 'swap') {
            handleDownload1(image);
        } else {
            handleDownload2(image);
        }

    const handleSelectImage = (image) => {
         // 이미지 선택 후 Create 페이지로 이동
         navigate('/main/create', { state: { selectedImage: image.url } });

    };

    const handleImageClick = (image) => {
        setSelectedImage(image);
    };

    const closeModal = () => {
        setSelectedImage(null);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="user-images-container">
            <h2>{from === 'swap' ? 'Your Swapped Images' : 'Your Generated Images'}</h2>
            <div className="image-grid">
                {images.map((image, index) => (
                    <div key={index} className="image-item" onClick={() => handleImageClick(image)}>
                        <img 
                            src={image.url} 
                            alt={`Generated ${index + 1}`} 
                            onError={(e) => {
                                console.error("Image load error for:", image.url);
                                e.target.src = 'https://via.placeholder.com/150?text=Image+Load+Error';
                            }}
                        />
                        <p>{image.timestamp}: {image.name}</p>
                        <button onClick={() => handleDownload(image)}>다운로드</button>
                        <button onClick={() => handleSelectImage(image)}>가져가기</button>
                    </div>
                ))}
            </div>

        
        </div>
    );
}
}
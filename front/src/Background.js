import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Plus } from 'lucide-react';
import './Backgroundcss.css';
import axios from 'axios';

export default function Background() {
  const [day, setDay] = useState(null);
  const [gender, setGender] = useState(null);
  const [category, setCategory] = useState(null);
  const [light, setLight] = useState(null);
  const [image, setImage] = useState(null);
  const [info , setInfo] = useState(null);
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback(acceptedFiles => {
    setImage(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'image/*',
    maxSize: 5242880, // 5MB
  });



  const sendMessage= async ()=>{
    const promptData = {
      day,
      gender,
      category,
      light,
      info
    }

    const formdata = new FormData();
    formdata.append('image', image);
    formdata.append('prompt', JSON.stringify(promptData));

    console.log('formdata 확인', Object.fromEntries(formdata))

    setLoading(true)

    try{
      const response = await axios.post('http://localhost:8002/background',formdata,{
        withCredentials: true,
        headers:{
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob'
      })

      const blob = new Blob([response.data], {type: 'image/jpeg'});
      const newImage = URL.createObjectURL(blob)

      console.log(response.data)
    } catch(error){
      console.log('이미지 생성중 오류 발생')
    } finally{
      setLoading(false)
    }
    
  }

  return (
    <div className="back-layout">
      <div className='back-container'>
        <div className="back-input">
          <div {...getRootProps()} className='back-image'>
            <input {...getInputProps()} />
            {image ? (
              <img src={URL.createObjectURL(image)} alt="Uploaded" />
            ) : (
              <div className="upload-placeholder">
                <Plus size={48} />
                <p>Drag and drop an image here, or click to select</p>
              </div>
            )}
          </div>
          <div className='back-prompt'>
            <label>Prompt : </label>
            <textarea style={{maxHeight: '60%'}} onChange={e=>setInfo(e.target.value)}></textarea>
          </div>
          <div className='back-select'>
            <label>Select Daytime :</label>
            <div className='back-day'>
            <button
              className={`select-button ${day === 'daylight' ? 'active' : ''}`}
              onClick={() => setDay('daylight')}
              >
              Daylight
            </button>
            <button
              className={`select-button ${day === 'nighttime' ? 'active' : ''}`}
              onClick={() => setDay('nighttime')}
              >
              Nighttime
              </button>
            </div>
            <label>Select Gender : </label>
            <div className='back-gender'>
            <button
              className={`gender-button ${gender === 'male' ? 'active' : ''}`}
              onClick={() => setGender('male')}
              data-gender='male'
              >
              Male
            </button>
            <button
              className={`gender-button ${gender === 'female' ? 'active' : ''}`}
              onClick={() => setGender('female')}
              data-gender='female'
              >
              Female
              </button>
            </div>
            <label>Select background :</label>
            <div className='back-category'>
            <button
              className={`select-button ${category === 'Beach' ? 'active' : ''}`}
              onClick={() => setCategory('Beach')}
              >
              Beach
            </button>
            <button
              className={`select-button ${category === 'Neon City' ? 'active' : ''}`}
              onClick={() => setCategory('Neon City')}
              >
              Neon City
            </button>
            <button
              className={`select-button ${category === 'City' ? 'active' : ''}`}
              onClick={() => setCategory('newyork City')}
              >
              City
            </button>
            <button
              className={`select-button ${category === 'underwater' ? 'active' : ''}`}
              onClick={() => setCategory('underwater')}
              >
              Underwater
            </button>
            </div>
            <label>Direction of light :</label>
            <div className='back-light'>
            <button
              className={`select-button ${light === 'Top' ? 'active' : ''}`}
              onClick={() => setLight('Top')}
              >
              Top
            </button>
            <button
              className={`select-button ${light === 'Bottom' ? 'active' : ''}`}
              onClick={() => setLight('Bottom')}
              >
              Bottom
            </button>
            
              <button
              className={`select-button ${light === 'Left' ? 'active' : ''}`}
              onClick={() => setLight('Left')}
              >
              Left
            </button>
            <button
              className={`select-button ${light === 'Right' ? 'active' : ''}`}
              onClick={() => setLight('Right')}
              >
              Right
              </button>
              <button
              className={`select-button ${light === 'Center' ? 'active' : ''}`}
              onClick={() => setLight('Center')}
              >
              Center
              </button>
            </div>
          </div>
          <button className='back-generate-button' onClick={sendMessage}>background generate</button>
        </div>
        <div className="back-output"></div>
      </div>
    </div>
  );
}
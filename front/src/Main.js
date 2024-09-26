import { NavLink } from "react-router-dom"
import CustomButton from "./CustomButton"
import './MainCss.css'
import createImage from '../src/common/images/createImage.jpg'
import faceSwap from '../src/common/images/faceSwap.webp'
import 'animate.css'
import { useEffect } from "react"
import { useSelector } from "react-redux"
import { checkAndResetImageCount } from "./utils/ImageCountReset"

const images = [
    {url: createImage, title: 'Create Model'},
    {url: faceSwap, title: 'Face Swap'}
]

export default function Main(){

    const user = useSelector(state => state.auth.user);

  useEffect(() => {
    if (user) {
      checkAndResetImageCount(user.uid)
        .then(wasReset => {
          if (wasReset) {
            console.log("이미지 카운트가 리셋되었거나 새로 생성되었습니다.");
          } else {
            console.log("이미지 카운트 리셋이 필요하지 않습니다.");
          }
        })
        .catch(error => {
          console.error("이미지 카운트 확인 중 오류 발생:", error);
        });
    }
  }, [user]);
    return(
        <div className="main_outline">
            <div className="main_content">
                <div className="main_title">SmartModeler</div>
                <div className="image_create animate__animated animate__fadeInUp">
                    <NavLink to='create' style={{width: '100%', height: '100%', display: 'block'}}>
                        <CustomButton image={images[0]} />
                    </NavLink>
                </div>
                <div className="image_swap animate__animated animate__fadeInUp">
                    <NavLink to='swap' style={{width: '100%', height: '100%', display: 'block'}}>
                        <CustomButton image={images[1]} />
                    </NavLink>
                </div>
            </div>            
        </div>
    )
}
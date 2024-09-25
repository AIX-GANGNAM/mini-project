import { NavLink } from "react-router-dom"
import CustomButton from "./CustomButton"
import './MainCss.css'
import createImage from '../src/common/images/createImage.jpg'
import faceSwap from '../src/common/images/faceSwap.webp'
import 'animate.css'

const images = [
    {url: createImage, title: 'Create Model'},
    {url: faceSwap, title: 'Face Swap'}
]

export default function Main(){
    return(
        <div className="main_outline">
            <div className="main_content">
                <div className="main_title">SmartModeler</div>
                <div className="image_create animate__animated animate__fadeInUp">
                    <NavLink to='/create' style={{width: '100%', height: '100%', display: 'block'}}>
                        <CustomButton image={images[0]} />
                    </NavLink>
                </div>
                <div className="image_swap animate__animated animate__fadeInUp">
                    <NavLink to='/swap' style={{width: '100%', height: '100%', display: 'block'}}>
                        <CustomButton image={images[1]} />
                    </NavLink>
                </div>
            </div>            
        </div>
    )
}
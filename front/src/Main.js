
import { NavLink } from "react-router-dom"
import CustomButton from "./CustomButton"
import './MainCss.css'


const image = 
    {
      url: '/static/images/buttons/breakfast.jpg',
      title: 'Breakfast',
      width: '40%',
            }

        export default function Main(){
            return(
                <div className="main_outline">
                    <div className="main_content">
                        <div className="main_title">SmartModeler</div>
                        <div className="image_create">
                            <NavLink to='/create'>
                                <CustomButton image={image}/>
                            </NavLink>
                        </div>
                        <div className="image_swap">
                            <NavLink to='/swap'>
                                <CustomButton image={image}/>
                            </NavLink>
                        </div>
                    </div>            
                </div>
            )
        }
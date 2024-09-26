import { Outlet } from "react-router-dom"
import { Header } from "./header"
import './layoutCss.css'
export default function Layout(){
    return(
        <div className="layout_outline">
            <div className="layout_header">
                <Header/>
            </div>
            <div className="layout_outlet">
                <Outlet/>
            </div>
        </div>
    )
}
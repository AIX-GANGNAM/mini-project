import React from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import './headerCss.css'
import { Button, styled } from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { logoutUser } from './redux/authSlice';  // logoutUser 액션을 import
import { IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const BlackButton = styled(Button)(({ theme }) => ({
    color: 'white',
    backgroundColor: 'black',
    '&:hover': {
      backgroundColor: '#333',
    },
    fontFamily: "Pacifico",  // 원하는 폰트로 변경 가능
    fontWeight: 'bold',
  }));

export function Header() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const path = location.pathname;


    const target = path.split('/')[2]

    const handleLogout = async () => {
        try {
            await dispatch(logoutUser()).unwrap();  // logoutUser 액션을 디스패치하고 완료될 때까지 기다립니다.
            navigate('/login');  // 로그아웃이 성공적으로 완료된 후 로그인 페이지로 리다이렉트합니다.
        } catch (error) {
            console.error('Logout failed:', error);
            // 여기에 사용자에게 에러 메시지를 표시하는 로직을 추가할 수 있습니다.
        }
    };

    const backpage=()=>{
        navigate(-1)
    }

    return (
        <div className='common_header'>
            <div className='header-back'>
            {
                target && <IconButton onClick={backpage}><ArrowBackIcon></ArrowBackIcon></IconButton>
            }
            </div>
            <div className='header-info'>
            <BlackButton 
                variant="contained"
                startIcon={<PowerSettingsNewIcon />}
                onClick={handleLogout}
            >
                LogOut
            </BlackButton>
            <Avatar/>
            </div>
        </div>
    )
}
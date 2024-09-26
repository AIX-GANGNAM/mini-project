import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import './headerCss.css'
import { Button, styled } from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { logout } from './redux/authSlice';
import { auth } from './firebase/config';  // Firebase auth 객체 import

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

    const handleLogout = async () => {
        try {
            await auth.signOut();  // Firebase에서 로그아웃
            dispatch(logout());    // Redux 상태 업데이트
            navigate('/login');    // 로그인 페이지로 리다이렉트
        } catch (error) {
            console.error('Logout failed:', error);
            // 여기에 에러 메시지를 표시하는 로직을 추가할 수 있습니다.
        }
    };

    return (
        <div className='common_header'>
            <BlackButton 
                variant="contained"  // outlined에서 contained로 변경
                startIcon={<PowerSettingsNewIcon />}
                onClick={handleLogout}
            >
                LogOut
            </BlackButton>
            <Avatar/>
        </div>
    )
}
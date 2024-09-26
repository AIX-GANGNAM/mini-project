// src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  
  if (!user) {
    // 사용자가 인증되지 않았다면 로그인 페이지로 리다이렉트
    return <Navigate to="/login" replace />;
  }

  // 사용자가 인증되었다면 자식 컴포넌트를 렌더링
  return children;
};

export default PrivateRoute;
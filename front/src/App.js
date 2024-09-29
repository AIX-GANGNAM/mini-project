import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { initializeAuth } from './redux/authSlice';
import Create from "./Create";
import Swap from "./Swap";
import Main from "./Main";
import Login from "./Login";
import Layout from "./Layouts";
import Background from './Background';
import PrivateRoute from './component/privateRoute';
import UserImages from './UserImages';  // 이 줄을 추가하세요
import ProMode from './ProMode';

function App() {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    dispatch(initializeAuth())
      .unwrap()
      .finally(() => setIsLoading(false));
  }, [dispatch]);

  if (isLoading) {
    return <div className="loading-overlay">
    <div className="loading-spinner"></div>
    <p>Loading ...</p>
</div>; // 또는 로딩 스피너 컴포넌트
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/main" /> : <Login />} />
        <Route path="/login" element={user ? <Navigate to="/main" /> : <Login />} />
        <Route 
          path="/main" 
          element={user ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Main />} />
          <Route path="create" element={<Create />} />
          <Route path="swap" element={<Swap />} />
          <Route path='back' element={<Background/>}/>
          <Route path="pro-mode" element={<ProMode />} />
        </Route>
        <Route 
          path="/my-images" 
          element={user ? <UserImages /> : <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Create from "./Create";
import Swap from "./Swap";
import Main from "./Main";
import Login from "./Login";
import Layout from "./Layouts";
import PrivateRoute from './component/privateRoute';
import UserImages from './UserImages';  // 이 줄을 추가하세요

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />}>
              <Route index element={<Login />} />
              <Route path="login" element={<Login />} />
            </Route>
            <Route path="main" element={<PrivateRoute><Layout/></PrivateRoute>}>
              <Route index element={<Main />} />
              <Route path="create" element={<Create />} />
              <Route path="swap" element={<Swap />} />
            </Route>
            <Route path="my-images" element={<PrivateRoute><UserImages /></PrivateRoute>} />
          </Routes>
        </BrowserRouter>
      </div>
    </Provider>
  );
}

export default App;
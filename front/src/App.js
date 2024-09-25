import { BrowserRouter, Routes, Route } from "react-router-dom";
import Create from "./Create";
import Swap from "./Swap";
import Main from "./Main";
import Login from "./Login";


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login/>}>
            <Route index element={<Login/>}/>
            <Route path="login" element={<Login/>}/>
          </Route>
          <Route path='main' element={<Main/>}/>
          <Route path="create" element={<Create/>}/>
          <Route path="swap" element={<Swap/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

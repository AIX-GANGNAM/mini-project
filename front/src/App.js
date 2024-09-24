import { BrowserRouter, Routes, Route } from "react-router-dom";
import Create from "./Create";
import Swap from "./Swap";
import Main from "./Main";
import CustomButton from "./CustomButton";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Main/>}>
            <Route index element={<Main/>}/>
            <Route path="main" element={<Main/>}/>
          </Route>
          <Route path="create" element={<Create/>}/>
          <Route path="swap" element={<Swap/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

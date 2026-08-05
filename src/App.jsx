import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Add more routes as the app grows, e.g.: */}
        {/* <Route path="/login" element={<Login />} /> */}
        {/* <Route path="/account" element={<Account />} /> */}
        {/* <Route path="/trips/:id" element={<TripTracking />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

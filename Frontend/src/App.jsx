import { Routes, Route } from "react-router-dom";
import BookParkingSpot from "./Pages/BookParkingSpot";
import Login from "./Pages/login";
import SecureIdRegistration from "./Pages/SignUp";
import MyParkingLand from "./Pages/MyParkingLand";
import ParkEase from "./Pages/LandingPage";
import LandOwner from "./Pages/LandOwnerDashBoard";
import ChooseRole from "./Pages/ChooseRole";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<ParkEase />} />
      <Route path="/choose-role" element={<ChooseRole />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SecureIdRegistration />} />
      <Route path="/book-parking" element={<BookParkingSpot />} />
      <Route path="/my-parking-land" element={<MyParkingLand />} />
      <Route path="/landowner-dashboard" element={<LandOwner />} />
    </Routes>
  );
};

export default App;
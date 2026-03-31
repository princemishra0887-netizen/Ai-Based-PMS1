import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BookParkingSpot from "./Pages/BookParkingSpot";
import SecureIdRegistration from "./Pages/SignUp";
import MyParkingLand from "./Pages/MyParkingLand";
import ParkEase from "./Pages/LandingPage";
import LandOwner from "./Pages/LandOwnerDashBoard";
import ParkEaseAuthChoice from "./Pages/ParkEaseAuth";
import SecureRegistration from "./Pages/SecureRegistration";
import ParkEaseAuthForm from "./Components/ParkEaseAuthForm";
import WhoAmI from "./Pages/WhoAmI";
import Login from "./Pages/Login";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ParkEase />} />
        <Route path="/auth/parkease" element={<ParkEaseAuthChoice />} />
        <Route path="/auth/signup" element={<SecureIdRegistration />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/dashboard" element={<LandOwner />} />
      </Routes>
    </Router>
  );
};

export default App;


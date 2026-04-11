import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SecureIdRegistration from "./Pages/SignUp";
import ParkEase from "./Pages/LandingPage";
import LandOwnerDashBoard from "./Pages/LandOwnerDashBoard";
import UserDashboard from "./Pages/UserDashboard";
import ParkEaseAuthChoice from "./Pages/ParkEaseAuth";
import Login from "./Pages/Login";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ParkEase />} />
        <Route path="/auth/parkease" element={<ParkEaseAuthChoice />} />
        <Route path="/auth/signup" element={<SecureIdRegistration />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/dashboard/landowner" element={<LandOwnerDashBoard />} />
        <Route path="/dashboard/user" element={<UserDashboard />} />
        {/* Fallback: old /dashboard route → landowner for backward compat */}
        <Route path="/dashboard" element={<LandOwnerDashBoard />} />
      </Routes>
    </Router>
  );
};

export default App;

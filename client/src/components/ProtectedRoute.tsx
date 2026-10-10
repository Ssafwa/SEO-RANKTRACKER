import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import LoadingComponent from "./Loading"; 

export default function ProtectedRoute() {
    const { token, loading } = useApp();
    const location = useLocation();

    if (loading) {
        // Render the component you imported to cleanly resolve the unused variable warning
        return <LoadingComponent />; 
    }

    if (!token) {
        const redirect = `${location.pathname}${location.search}`;
        return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
    }

    return <Outlet />;
}
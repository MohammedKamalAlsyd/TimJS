// routes.js
import React, { useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import EmptyPage from '../assets/pages/empty';
import Dashboard from '../assets/pages/TimeTracker';

const routes = [
    {
        path: 'dashboard',
        element: <Dashboard />,
    },
    {
        path: '*',
        element: <EmptyPage />, // Fallback route for any undefined paths
    },
];

const AppRoutes = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const currentPath = window.location.pathname;
        // Check if the current path is /homepage/homepage.html
        if (currentPath === '/src/homepage/homepage.html') {
            // Redirect to /dashboard
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    return (
        <Routes>
            {routes.map((route, index) => (
                <Route key={index} {...route} />
            ))}
        </Routes>
    );
};

export default AppRoutes;

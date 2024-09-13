// routes.js
import React from 'react';
import {Route, Routes} from 'react-router-dom';
import EmptyPage from './assets/pages/empty';
import Dashboard from './assets/pages/HomePage';


const routes = [
    {
        path: 'dashboard',
        element: <Dashboard/>,
    },
];

const AppRoutes = () => (
    <Routes>
        {routes.map((route, index) => (
            <Route key={index} {...route} />
        ))}
    </Routes>
);

export default AppRoutes;
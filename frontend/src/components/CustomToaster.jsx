// components/CustomToaster.jsx
import React from 'react';
import { Toaster } from 'react-hot-toast';

const CustomToaster = () => (
    <Toaster
        position="top-right"
        toastOptions={{
            duration: 3000,
            style: {
                background: '#363636',
                color: '#fff',
            },
            success: {
                style: {
                    background: '#10b981',
                },
            },
            error: {
                style: {
                    background: '#ef4444',
                },
            },
        }}
    />
);

export default CustomToaster;

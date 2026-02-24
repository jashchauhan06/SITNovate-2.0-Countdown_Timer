import React from 'react';

function LoadingScreen({ fadeOut }) {
    return (
        <div className={`loading-screen ${fadeOut ? 'loading-fade-out' : ''}`}>
            <div className="loading-content">
                <h1 className="loading-title">
                    SITN<span className="loading-title-small">ovate</span> 2.0
                </h1>
                <div className="loading-bar-container">
                    <div className="loading-bar" />
                </div>
            </div>
        </div>
    );
}

export default LoadingScreen;

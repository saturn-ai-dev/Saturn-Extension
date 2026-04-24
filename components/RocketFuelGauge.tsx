import React from 'react';
import { getRemainingUsage, MAX_LIMITS } from '../services/usageService';

const RocketFuelGauge: React.FC = () => {
    const remaining = getRemainingUsage();
    const totalMax = MAX_LIMITS.fast + MAX_LIMITS.web + MAX_LIMITS.deep;
    const totalRemaining = remaining.fast + remaining.web + remaining.deep;
    const fuelPercent = (totalRemaining / totalMax) * 100;

    // Rocket state based on fuel
    const isLow = fuelPercent < 30;
    const isCritical = fuelPercent < 10;
    const isEmpty = fuelPercent === 0;

    return (
        <div className="flex items-center select-none">
            <div className="relative">
                <div className={`relative z-10 ${isEmpty ? 'opacity-40' : ''}`}>
                    <svg
                        viewBox="0 0 100 100"
                        className={`w-7 h-7 drop-shadow-lg transition-colors duration-500 ${isEmpty ? '' : 'animate-spin'}`}
                        style={{
                            animationDuration: `${1 * Math.pow(1 / 0.95, totalMax - totalRemaining)}s`,
                            color: isEmpty ? '#6c6258' : isCritical ? '#ef4444' : isLow ? '#f59e0b' : 'var(--accent-color)'
                        }}
                    >
                        <circle cx="50" cy="50" r="20" fill="currentColor" />
                        <ellipse cx="50" cy="50" rx="40" ry="10" fill="none" stroke="currentColor" strokeWidth="4" transform="rotate(-15 50 50)" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default RocketFuelGauge;

'use client';

import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useRef } from "react";

// Initial custom CSS for the driver.js popovers to match our dark theme
const driverJsTheme = `
  .driver-popover.driverjs-theme {
    background-color: #171717;
    color: #ffffff;
    border: 1px solid #262626;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  }
  .driver-popover.driverjs-theme .driver-popover-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #ffffff;
  }
  .driver-popover.driverjs-theme .driver-popover-description {
    font-size: 14px;
    color: #a3a3a3;
    line-height: 1.5;
  }
  .driver-popover.driverjs-theme button {
    background-color: #262626;
    color: #ffffff;
    border: 1px solid #404040;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s;
  }
  .driver-popover.driverjs-theme button:hover {
    background-color: #404040;
  }
  .driver-popover.driverjs-theme button.driver-popover-next-btn {
    background-color: #6366f1; /* Indigo-500 */
    border-color: #6366f1;
    color: white;
  }
  .driver-popover.driverjs-theme button.driver-popover-next-btn:hover {
    background-color: #4f46e5; /* Indigo-600 */
  }
  .driver-popover.driverjs-theme .driver-popover-progress-text {
    color: #525252;
  }
`;

export type TourSteps = DriveStep[];

export function useTour() {
    const driverObj = useRef<any>(null);

    useEffect(() => {
        // Inject styles
        const style = document.createElement('style');
        style.innerText = driverJsTheme;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
            if (driverObj.current) {
                driverObj.current.destroy();
            }
        }
    }, []);

    const startTour = (steps: TourSteps) => {
        driverObj.current = driver({
            showProgress: true,
            steps: steps,
            popoverClass: 'driverjs-theme',
            animate: true,
            allowClose: true,
            doneBtnText: 'Finish',
            nextBtnText: 'Next',
            prevBtnText: 'Back',
        });

        driverObj.current.drive();
    };

    return { startTour };
}

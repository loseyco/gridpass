import SceneController from './components/SceneController';

export const metadata = {
    title: 'GridPass Live Studio',
    description: 'Internal broadcast view for 24/7 stream',
    robots: 'noindex',
};

export default function LiveStudioPage() {
    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
            {/* 
         Scale the 1920x1080 content to fit the viewport 
         Using a fixed aspect ratio container and CSS scaling
       */}
            <div className="relative w-[1920px] h-[1080px] bg-black shadow-2xl origin-center" style={{ zoom: '0.67' }}>
                <SceneController />
            </div>
        </div>
    );
}

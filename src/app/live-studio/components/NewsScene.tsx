export default function NewsScene() {
    return (
        <div className="w-full h-full bg-slate-900 flex flex-col p-24">
            <div className="flex-1 flex flex-col justify-center">
                <h2 className="text-4xl text-red-500 font-bold mb-8 uppercase tracking-widest">Latest News</h2>

                <div className="space-y-12">
                    <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl">
                        <h3 className="text-6xl font-black mb-4 text-white">GridPass 2.0 Alpha</h3>
                        <p className="text-2xl text-slate-300 leading-relaxed">
                            The new era of motorsport networking is here. New profiles, better stats, and seamless integration with your favorite sims.
                        </p>
                    </div>

                    <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl opacity-75 transform scale-95 origin-left">
                        <h3 className="text-5xl font-bold mb-4 text-gray-200">New Community Features</h3>
                        <p className="text-xl text-slate-400">
                            Connect with drivers, mechanics, and team owners directly through the platform.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

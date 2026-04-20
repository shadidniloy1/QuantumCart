import Link from "next/link";
import { Sparkles, Upload, Zap, CheckCircle } from "lucide-react";

export default function AIBanner() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-900 rounded-3xl overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
            {/* Left */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-violet-500/20 text-violet-300 text-sm font-medium px-3 py-1.5 rounded-full mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Powered by AI
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                See it on you
                <br />
                before you buy
              </h2>
              <p className="text-gray-400 mb-8 text-lg">
                Our AI virtual fitting room lets you try on any item from our
                catalog using just your photo.
              </p>

              {/* Steps */}
              <div className="flex flex-col gap-3 mb-8">
                {[
                  { icon: Upload, text: "Upload your photo" },
                  { icon: Zap, text: "AI generates your look" },
                  { icon: CheckCircle, text: "Shop with full confidence" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="text-gray-300 text-sm">{text}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-violet-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-violet-700 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Try it Free
              </Link>
            </div>

            {/* Right — visual */}
            <div className="flex-1 flex justify-center">
              <div className="relative w-64 h-72">
                {/* Phone frame */}
                <div className="absolute inset-0 bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400"
                      alt="Before"
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-xs font-medium bg-black/40 px-2 py-1 rounded-full">
                        Before
                      </span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden border-t border-violet-500/30">
                    <img
                      src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-xs font-medium bg-violet-600/80 px-2 py-1 rounded-full">
                        AI Result
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sparkle dot */}
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Footer() {
  return (
    <footer id="contact" className="relative bg-slate-900 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 1200 400">
          <path
            d="M 0 200 Q 300 100 600 200 T 1200 200"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            className="text-cyan-500"
          />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-12 mb-12 sm:mb-16">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <img 
                src="https://public.readdy.ai/ai/img_res/1bf0ff4a-a6ed-4759-a280-82047bb4bb6b.png" 
                alt="Go Smart System Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg sm:text-xl font-bold font-display">Go Smart System</span>
            </div>

            <div className="mb-6 sm:mb-8">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 pr-14 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition-colors text-sm"
                />
                <button className="absolute right-1 top-1 w-10 h-10 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg flex items-center justify-center hover:shadow-lg transition-all">
                  <i className="ri-notification-line text-white"></i>
                </button>
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-semibold font-serif leading-tight">
              <div>Empowering Schools</div>
              <div>Across Rwanda</div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4 sm:mb-6">Platform</h4>
            <ul className="space-y-3 sm:space-y-4">
              <li><a href="#features" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Features</a></li>
              <li><a href="#pricing" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Pricing</a></li>
              <li><a href="#demo" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Demo Request</a></li>
              <li><a href="#cases" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Case Studies</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4 sm:mb-6">Solutions</h4>
            <ul className="space-y-3 sm:space-y-4">
              <li><a href="#nursery" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Nursery Schools</a></li>
              <li><a href="#primary" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Primary Schools</a></li>
              <li><a href="#multi" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Multi-Campus</a></li>
              <li><a href="#enterprise" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Enterprise</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4 sm:mb-6">Resources</h4>
            <ul className="space-y-3 sm:space-y-4">
              <li><a href="#docs" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Documentation</a></li>
              <li><a href="#api" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">API Reference</a></li>
              <li><a href="#tutorials" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Video Tutorials</a></li>
              <li><a href="#blog" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4 sm:mb-6">Company</h4>
            <ul className="space-y-3 sm:space-y-4">
              <li><a href="#about" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">About Us</a></li>
              <li><a href="#careers" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Careers</a></li>
              <li><a href="#contact" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Contact</a></li>
              <li><a href="#support" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Support</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 sm:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-xs sm:text-sm text-gray-400 text-center md:text-left">
              © 2025 Go Smart System. All rights reserved.
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <a href="#linkedin" className="w-10 h-10 border border-white/20 rounded-lg flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/5 hover:border-cyan-400 transition-all">
                <i className="ri-linkedin-fill text-lg"></i>
              </a>
              <a href="#twitter" className="w-10 h-10 border border-white/20 rounded-lg flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/5 hover:border-cyan-400 transition-all">
                <i className="ri-twitter-x-fill text-lg"></i>
              </a>
              <a href="#facebook" className="w-10 h-10 border border-white/20 rounded-lg flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/5 hover:border-cyan-400 transition-all">
                <i className="ri-facebook-fill text-lg"></i>
              </a>
              <a href="#instagram" className="w-10 h-10 border border-white/20 rounded-lg flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/5 hover:border-cyan-400 transition-all">
                <i className="ri-instagram-fill text-lg"></i>
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
              <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <span className="hidden sm:inline text-gray-600">|</span>
              <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
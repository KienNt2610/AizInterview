import { useNavigate } from 'react-router-dom';
import { 
  Github, 
  Linkedin, 
  Mail, 
  Facebook, 
  Twitter,
  Video,
  BarChart3,
  CreditCard,
  Home
} from 'lucide-react';

const AppFooter = () => {
  const navigate = useNavigate();

  const footerLinks = {
    product: [
      { label: 'Home', path: '/', icon: Home },
      { label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
      { label: 'Interview', path: '/interview', icon: Video },
      { label: 'History', path: '/history', icon: BarChart3 },
    ],
    company: [
      { label: 'About Us', path: '/about' },
      { label: 'Contact', path: '/contact' },
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
    ],
    resources: [
      { label: 'Documentation', path: '/docs' },
      { label: 'Support', path: '/support' },
      { label: 'Pricing', path: '/payment', icon: CreditCard },
      { label: 'FAQ', path: '/faq' },
    ],
  };

  const socialLinks = [
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Mail, href: 'mailto:support@interviewai.com', label: 'Email' },
  ];

  return (
    <footer className="bg-[#0B0C10] border-t border-[#66FCF1]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#66FCF1] to-[#45A29E] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-[#0B0C10] font-bold text-lg">AI</span>
              </div>
              <h3 className="text-xl font-bold text-white">Interview AI</h3>
            </div>
            <p className="text-white/60 text-sm">
              AI-powered interview practice platform to help you ace your next job interview.
            </p>
            <div className="flex items-center gap-4 pt-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-[#1F2833] hover:bg-[#66FCF1]/20 rounded-lg flex items-center justify-center text-white/60 hover:text-[#66FCF1] transition-all duration-300 border border-white/10 hover:border-[#66FCF1]/30"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.path}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="flex items-center gap-2 text-white/60 hover:text-[#66FCF1] transition-colors text-sm group"
                    >
                      {Icon && <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                      {link.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-white/60 hover:text-[#66FCF1] transition-colors text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.path}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="flex items-center gap-2 text-white/60 hover:text-[#66FCF1] transition-colors text-sm group"
                    >
                      {Icon && <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                      {link.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} Interview AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <button
                onClick={() => navigate('/privacy')}
                className="text-white/60 hover:text-[#66FCF1] transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => navigate('/terms')}
                className="text-white/60 hover:text-[#66FCF1] transition-colors"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;

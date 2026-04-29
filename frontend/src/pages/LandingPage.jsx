import { Link } from 'react-router-dom';
import { ArrowRight, Code, Users, TrendingUp, CalendarCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-section">
        {/* Decorative sparkles */}
        <div className="sparkle" style={{ top: '20%', left: '10%', animationDelay: '0s' }}></div>
        <div className="sparkle" style={{ top: '30%', right: '15%', animationDelay: '0.5s' }}></div>
        <div className="sparkle" style={{ bottom: '25%', left: '20%', animationDelay: '1s' }}></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              RPL Smart<br />
              <span className="text-gradient">Ecosystem</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Platform pembelajaran jurusan RPL yang modern, terintegrasi, dan siap untuk masa depan
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/simulator" className="btn btn-glass inline-flex items-center justify-center gap-2">
                Career Simulator
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn btn-outline inline-flex items-center justify-center gap-2">
                Login
              </Link>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 right-10 w-20 h-20 bg-primary-500/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-accent-cyan/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white dark:bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '450+', label: 'Siswa Aktif', icon: Users },
              { value: '32', label: 'Guru', icon: Users },
              { value: '120+', label: 'Project', icon: Code },
              { value: '15', label: 'Jurusan', icon: TrendingUp },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/10 to-primary-600/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <div className="text-4xl font-bold text-gradient mb-2">{stat.value}</div>
                  <div className="text-gray-600 dark:text-dark-muted">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-dark-bg/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">
            Fitur <span className="text-gradient">Unggulan</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: CalendarCheck,
                title: 'Absensi Smart',
                description: 'Absensi harian dengan validasi lokasi GPS dan foto selfie real-time',
                color: 'from-primary-500 to-primary-600',
              },
              {
                icon: Code,
                title: 'Project Tracking',
                description: 'Kelola dan track progress project coding dengan Git integration',
                color: 'from-accent-cyan to-blue-500',
              },
              {
                icon: TrendingUp,
                title: 'Skill Analytics',
                description: 'Track dan visualisasi perkembangan skill programming kamu',
                color: 'from-accent-pink to-primary-500',
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="card group hover:scale-105 transition-all duration-300">
                  <div className={`w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-dark-muted leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
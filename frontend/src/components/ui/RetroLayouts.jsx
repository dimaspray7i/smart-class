import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home, Layout } from 'lucide-react';
import { Link } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

/**
 * 🏷️ Page Header Component
 * Standard header for all dashboard pages with breadcrumbs and actions
 */
export function PageHeader({ title, icon: Icon, breadcrumbs = [], actions, description }) {
  return (
    <div className="mb-8 relative">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-retro-mono text-base-black/50 mb-3 uppercase tracking-widest">
        <Link to="/dashboard" className="hover:text-retro-orange flex items-center gap-1 transition-colors">
          <Home className="w-3 h-3" />
          Home
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="w-2.5 h-2.5" />
            <Link 
              to={crumb.path} 
              className={twMerge(
                "hover:text-retro-orange transition-colors",
                index === breadcrumbs.length - 1 && "text-base-black font-black"
              )}
            >
              {crumb.label}
            </Link>
          </React.Fragment>
        ))}
      </nav>

      {/* Main Header Content */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="w-14 h-14 retro-card bg-retro-orange border-4 border-base-black flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0px_0px_#111111]">
              <Icon className="w-7 h-7 text-base-white" />
            </div>
          )}
          <div>
            <h1 className="retro-heading retro-heading-lg text-base-black leading-none mb-2">
              {title}
            </h1>
            {description && (
              <p className="font-retro-mono text-xs text-base-black/60 max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {actions && (
          <div className="flex items-center gap-3 self-end md:self-auto">
            {actions}
          </div>
        )}
      </div>

      {/* Decorative Line */}
      <div className="absolute -bottom-4 left-0 w-full h-1 bg-base-black/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-full bg-gradient-to-r from-retro-orange via-retro-blue to-transparent opacity-30"
        />
      </div>
    </div>
  );
}

/**
 * 📦 Retro Section Wrapper
 */
export function RetroSection({ children, className, title, icon: Icon }) {
  return (
    <section className={twMerge("space-y-4", className)}>
      {(title || Icon) && (
        <div className="flex items-center gap-2 mb-4">
          {Icon && <Icon className="w-5 h-5 text-retro-orange" />}
          {title && <h3 className="font-retro-display font-black text-base-black uppercase tracking-tight">{title}</h3>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * 📊 Stat Grid
 */
export function StatGrid({ children, cols = 4 }) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={twMerge("grid gap-4 md:gap-6", colClasses[cols])}>
      {children}
    </div>
  );
}

/**
 * 🗂️ Retro Card (Standardized)
 */
export function RetroCard({ children, className, variant = 'white', noPadding = false }) {
  const variants = {
    white: 'bg-base-white border-base-black',
    orange: 'bg-retro-orange/10 border-retro-orange',
    blue: 'bg-retro-blue/10 border-retro-blue',
    purple: 'bg-retro-purple/10 border-retro-purple',
    lime: 'bg-retro-lime/10 border-retro-lime',
    ghost: 'bg-transparent border-base-black/20',
  };

  return (
    <div className={twMerge(
      "retro-card border-4 relative overflow-hidden",
      variants[variant],
      !noPadding && "p-4 md:p-6",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * 📈 Retro Stat Widget
 */
export function RetroStatWidget({ title, value, icon: Icon, color = 'orange', trend, badge, onClick }) {
  const colors = {
    orange: 'text-retro-orange bg-retro-orange/10 border-retro-orange',
    blue: 'text-retro-blue bg-retro-blue/10 border-retro-blue',
    purple: 'text-retro-purple bg-retro-purple/10 border-retro-purple',
    lime: 'text-retro-lime bg-retro-lime/10 border-retro-lime',
  };

  const shadowColors = {
    orange: 'shadow-[4px_4px_0px_0px_rgba(255,107,0,1)]',
    blue: 'shadow-[4px_4px_0px_0px_rgba(45,156,219,1)]',
    purple: 'shadow-[4px_4px_0px_0px_rgba(155,81,224,1)]',
    lime: 'shadow-[4px_4px_0px_0px_rgba(186,230,126,1)]',
  };

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={onClick}
      className={twMerge(
        "retro-card p-4 flex flex-col justify-between group relative cursor-pointer overflow-hidden transition-all",
        onClick && "hover:shadow-hard-lg"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={twMerge(
          "w-12 h-12 rounded-retro border-2 flex items-center justify-center transition-transform group-hover:rotate-6",
          colors[color]
        )}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
        {badge && (
          <span className="retro-sticker bg-retro-yellow text-base-black text-[8px] px-2 py-0.5 font-black">
            {badge}
          </span>
        )}
      </div>

      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-base-black/50 mb-1">
          {title}
        </h4>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-retro-display font-black text-base-black">
            {value}
          </span>
          {trend && (
            <span className={twMerge(
              "text-[10px] font-black",
              trend > 0 ? "text-success" : "text-danger"
            )}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>

      {/* Background Decorative Element */}
      <div className={twMerge(
        "absolute -bottom-4 -right-4 w-16 h-16 opacity-10 group-hover:opacity-20 transition-opacity rotate-12",
        color === 'orange' ? 'text-retro-orange' : 'text-base-black'
      )}>
        {Icon && <Icon className="w-full h-full" />}
      </div>
    </motion.div>
  );
}

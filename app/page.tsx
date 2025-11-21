'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, Sparkles, Zap, Target, TrendingUp, Users, Brain, Rocket, Award, Clock, Play, Mail, ChevronDown, Calendar, FileText, Repeat, BarChart3, X } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { trackButtonClick } from '@/lib/analytics';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ========================================
// 📝 CONTACT MODAL COMPONENT
// ========================================
function ContactModal({ isOpen, onClose, ctaType }: { isOpen: boolean; onClose: () => void; ctaType: string }) {
  const [formData, setFormData] = useState({ name: '', email: '', company: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          ctaType, 
          timestamp: new Date().toISOString() 
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setFormData({ name: '', email: '', company: '' });
        }, 2000);
      } else {
        alert('Failed to submit. Please try again.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {!submitted ? (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Started with CapyLearn</h3>
              <p className="text-gray-600">Tell us a bit about yourself</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company (Optional)</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  placeholder="Acme Inc."
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Continue
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Thanks!</h3>
            <p className="text-gray-600">We'll be in touch soon.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ========================================
// 🎯 FLOATING NAVIGATION ANCHOR
// ========================================
function FloatingNav() {
  const [activeSection, setActiveSection] = useState(0);
  const sections = ['hero', 'examples', 'consultation', 'projects', 'testimonials', 'team', 'subscribe'];
  const sectionLabels = ['Home', 'AI Prompts', '1-on-1', 'Projects', 'Reviews', 'Team', 'Subscribe'];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for better detection
      const sectionElements = sections.map(id => document.getElementById(id));
      
      let foundActive = false;
      sectionElements.forEach((element, index) => {
        if (element && !foundActive) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(index);
            foundActive = true;
          }
        }
      });
    };

    handleScroll(); // Initial check
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (index: number) => {
    const element = document.getElementById(sections[index]);
    if (element) {
      const offset = 80; // Header offset
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="fixed right-8 top-1/2 transform -translate-y-1/2 z-50 hidden lg:flex flex-col gap-4"
    >
      {sections.map((section, index) => (
        <motion.button
          key={section}
          onClick={() => scrollToSection(index)}
          className={`group relative transition-all duration-300 ${
            activeSection === index 
              ? 'w-4 h-4' 
              : 'w-3 h-3'
          }`}
          whileHover={{ scale: 1.3 }}
          whileTap={{ scale: 0.9 }}
          aria-label={`Scroll to ${sectionLabels[index]}`}
        >
          <div className={`w-full h-full rounded-full transition-all duration-300 ${
            activeSection === index 
              ? 'bg-blue-600 shadow-lg shadow-blue-500/50' 
              : 'bg-gray-300 hover:bg-blue-400'
          }`} />
          <span className="absolute right-8 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none shadow-xl scale-95 group-hover:scale-100">
            {sectionLabels[index]}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}

// ========================================
// 🎯 HERO SECTION WITH PARALLAX
// ========================================
function HeroSection({ openModal }: { openModal: (type: string) => void }) {
  const ref = useRef(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  useEffect(() => {
    setIsLoaded(true);
    
    if (heroContentRef.current) {
      const ctx = gsap.context(() => {
        const elements = heroContentRef.current?.querySelectorAll('.animate-on-load');
        
        if (elements) {
          gsap.fromTo(
            elements,
            { 
              opacity: 0, 
              y: 30,
              scale: 0.95
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              stagger: 0.15,
              ease: 'power3.out',
              clearProps: 'all'
            }
          );
        }

        // Animate buttons specifically
        gsap.fromTo('.hero-button', 
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            stagger: 0.1,
            delay: 0.6,
            clearProps: 'all'
          }
        );
      }, heroContentRef);

      return () => ctx.revert();
    }
  }, []);

  return (
    <section id="hero" ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-blue-50/20 pt-20">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Parallax Background Elements */}
      <motion.div 
        style={{ y }}
        className="absolute inset-0 -z-10 pointer-events-none"
      >
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-3xl opacity-30" />
        
        {/* More dramatic floating geometric shapes */}
        <motion.div
          animate={{ 
            y: [0, -50, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 left-[15%] w-24 h-24 border-4 border-blue-300/40 rounded-2xl backdrop-blur-sm"
        />
        <motion.div
          animate={{ 
            y: [0, 50, 0],
            scale: [1, 1.6, 1],
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-32 right-[15%] w-20 h-20 bg-blue-200/40 rounded-full"
        />
        <motion.div
          animate={{ 
            x: [0, 60, 0],
            rotate: [0, -180, 0],
            scale: [1, 0.7, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] right-[20%] w-16 h-16 bg-blue-300/30 rotate-45"
        />
        <motion.div
          animate={{ 
            y: [0, -30, 0],
            x: [0, 30, 0],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[30%] left-[20%] w-24 h-24 border-2 border-blue-200/40 rounded-full"
        />
      </motion.div>

      <div 
        ref={heroContentRef}
        className="relative z-20 max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-24"
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Main Message */}
          <div 
            className="hero-headline text-left"
          >
            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]">
              Build AI Tools
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
                Not Theory
              </span>
            </h1>

            {/* Subheadline */}
            <p className="hero-subheadline text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed">
              Skip the 40-hour courses. Build practical AI projects in 10 minutes that you can use at work today.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 relative z-40">
              <Button
                size="lg"
                className="hero-button bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all group"
                style={{ opacity: 1, visibility: 'visible' }}
                onClick={() => {
                  trackButtonClick('hero-get-started');
                  openModal('hero-get-started');
                }}
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="hero-button border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 text-gray-900 bg-white px-8 py-6 text-lg font-semibold rounded-xl transition-all group"
                style={{ opacity: 1, visibility: 'visible' }}
                onClick={() => {
                  trackButtonClick('hero-watch-demo');
                  openModal('hero-watch-demo');
                }}
              >
                <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <div className="trust-indicator flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>No credit card</span>
              </div>
              <div className="trust-indicator flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Free forever</span>
              </div>
              <div className="trust-indicator flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>10 min projects</span>
              </div>
            </div>
          </div>

          {/* Right Column - Powerful Quote */}
          <div
            className="relative"
          >
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-10 border border-blue-100 shadow-xl">
              {/* Quote */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <p className="text-xl text-gray-700 italic mb-4 leading-relaxed">
                  "The people who master AI won't be the ones who took the longest courses. They'll be the ones who built the most tools. Speed matters. Action beats theory. Every day you wait, someone else is building what you're still learning about."
                </p>
                <p className="text-sm text-gray-500">— Why Learning AI Efficiently Matters</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConsultationSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (ref.current) {
      const ctx = gsap.context(() => {
        gsap.from('.consultation-card', {
          scrollTrigger: {
            trigger: '.consultation-card',
            start: 'top 80%',
            toggleActions: 'play none none none'
          },
          opacity: 0,
          scale: 0.95,
          y: 30,
          duration: 0.8,
          ease: 'back.out(1.2)'
        });
      }, ref);

      return () => ctx.revert();
    }
  }, []);

  return (
    <section id="consultation" ref={ref} className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-5xl mx-auto px-8 sm:px-12 lg:px-16">
        <motion.div>
          <div className="consultation-card bg-white border-2 border-blue-200 rounded-2xl p-8 lg:p-10 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-8 flex-col lg:flex-row">
              {/* Left side - Icon and Content */}
              <div className="flex-1 w-full">
                <div className="flex items-start gap-5 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-full mb-3">
                      <Sparkles className="w-3 h-3" />
                      <span>LIMITED AVAILABILITY</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-2xl lg:text-3xl mb-3">
                      Free 1-on-1 AI Strategy Session
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      <span className="font-semibold text-gray-900">Stop guessing.</span> Get a personalized roadmap to implement AI in your role. We'll identify quick wins you can deploy this week.
                    </p>
                  </div>
                </div>
                
                {/* Benefits Grid */}
                <div className="grid sm:grid-cols-3 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="font-medium">30-min call</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="font-medium">Action plan</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="font-medium">No obligation</span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                  Limited availability this month
                </p>
              </div>
              
              {/* Right side - CTA Button */}
              <div className="lg:w-auto w-full flex lg:flex-col gap-3">
                <Button
                  size="lg"
                  className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-6 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all group"
                  onClick={() => window.open('https://calendly.com/alexziao05/meeting-with-capylearn', '_blank')}
                >
                  <Calendar className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                  Book Your Spot
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ========================================
// � PROJECT-BASED LEARNING SHOWCASE
// ========================================
function ProjectBasedLearningSection() {
  const ref = useRef(null);
  const headerRef = useRef(null);
  const timelineRef = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (ref.current) {
      const ctx = gsap.context(() => {
        // Animate section header
        gsap.from('.projects-header', {
          scrollTrigger: {
            trigger: '.projects-header',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none none'
          },
          opacity: 0,
          y: 50,
          duration: 1,
          ease: 'power3.out'
        });

        // Animate timeline items with stagger
        gsap.from('.timeline-item', {
          scrollTrigger: {
            trigger: '.timeline-container',
            start: 'top 70%',
            end: 'bottom 20%',
            toggleActions: 'play none none none'
          },
          opacity: 0,
          x: (index) => (index % 2 === 0 ? -50 : 50),
          duration: 0.8,
          stagger: 0.2,
          ease: 'power2.out'
        });

        // Animate comparison cards
        gsap.from('.comparison-card', {
          scrollTrigger: {
            trigger: '.comparison-section',
            start: 'top 75%',
            toggleActions: 'play none none none'
          },
          opacity: 0,
          y: 30,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power2.out'
        });
      }, ref);

      return () => ctx.revert();
    }
  }, []);

  return (
    <section id="projects" ref={ref} className="py-32 bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="max-w-7xl mx-auto px-12 sm:px-16 lg:px-24">
        {/* Section header */}
        <motion.div 
          className="projects-header text-center mb-24"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            Stop Learning Theory.<br />
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
              Start Building Real Tools.
            </span>
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto font-light leading-relaxed">
            Every project is hands-on and solves real problems you face at work. 
            No fluff. No endless theory. Just practical AI tools you can build and use today.
          </p>
        </motion.div>

        {/* Journey Timeline */}
        <div className="timeline-container relative max-w-6xl mx-auto mb-20">
          {/* Center Dividing Line */}
          <div className="hidden md:block absolute left-1/2 top-20 bottom-20 w-0.5 bg-gradient-to-b from-red-200 via-gray-200 to-blue-200 transform -translate-x-1/2"></div>
          
          {/* VS Badge */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm">
            <span className="text-xs font-semibold text-gray-400">VS</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 md:gap-24 relative">
            {/* LEFT: The Problem */}
            <motion.div
              className="timeline-item relative"
            >
              {/* Timeline Connector Dot */}
              <div className="hidden md:block absolute -right-3.5 top-16 w-7 h-7 bg-red-100 rounded-full border-2 border-red-300 z-10"></div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-8 hover:border-red-200 transition-colors">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg text-red-600 text-xs font-semibold mb-6">
                  <span>Traditional Courses</span>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Month 1-3
                </h3>
                <p className="text-gray-500 text-sm mb-8">Still learning fundamentals</p>
                
                <div className="space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-400">W1</span>
                      </div>
                      <div className="font-medium text-gray-400 text-sm">Setup Python Environment</div>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed ml-13">Debug installation errors. Still can't get it working.</p>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-400">W2</span>
                      </div>
                      <div className="font-medium text-gray-400 text-sm">ML Theory & Prerequisites</div>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed ml-13">Linear algebra, statistics. You zone out after 10 minutes.</p>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-400">W5</span>
                      </div>
                      <div className="font-medium text-gray-400 text-sm">Practice: Iris Classification</div>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed ml-13">Build a flower classifier. Can't apply it to your work.</p>
                  </motion.div>
                </div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 1.0 }}
                  className="mt-8 pt-6 border-t border-gray-100"
                >
                  <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Result</div>
                  <div className="text-xl font-bold text-red-600 mb-1">$0 saved</div>
                  <p className="text-sm text-gray-500">Still watching tutorials while others are building...</p>
                </motion.div>
              </div>
            </motion.div>

            {/* RIGHT: The Solution */}
            <motion.div
              className="timeline-item relative"
            >
              {/* Timeline Connector Dot */}
              <div className="hidden md:block absolute -left-3.5 top-16 w-7 h-7 bg-blue-100 rounded-full border-2 border-blue-300 z-10"></div>
              
              <div className="bg-white border border-blue-200 rounded-xl p-8 hover:border-blue-300 transition-colors">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-blue-600 text-xs font-semibold mb-6">
                  <span>CapyLearn</span>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Day 1
                </h3>
                <p className="text-blue-600 text-sm font-medium mb-8">Build production-ready tools</p>
                
                <div className="space-y-6">
                  {/* Project 1 */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-xs text-white font-bold">10m</span>
                      </div>
                      <div className="font-semibold text-gray-900 text-sm">AI Contract Analyzer</div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed ml-13 mb-3">Extract clauses, risks, and deadlines from 50-page contracts instantly</p>
                    
                    <div className="bg-blue-50 rounded-lg p-4 ml-13">
                      <div className="text-lg font-bold text-blue-900 mb-1">4 hours saved per contract</div>
                      <p className="text-xs text-blue-700">$800/week in time saved. Your boss notices.</p>
                    </div>
                  </motion.div>
                  
                  {/* Project 2 */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 1.2 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-xs text-white font-bold">10m</span>
                      </div>
                      <div className="font-semibold text-gray-900 text-sm">Smart Meeting Assistant</div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed ml-13 mb-3">Turn 90-min meetings into action items and decisions</p>
                    
                    <div className="bg-purple-50 rounded-lg p-4 ml-13">
                      <div className="text-lg font-bold text-purple-900 mb-1">Never miss a detail</div>
                      <p className="text-xs text-purple-700">Teammates start asking for your tool. Management notices.</p>
                    </div>
                  </motion.div>
                </div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 1.8 }}
                  className="mt-8 pt-6 border-t border-gray-100"
                >
                  <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Result</div>
                  <div className="text-xl font-bold text-blue-600 mb-1">$3,200/month saved</div>
                  <p className="text-sm text-gray-600">You're the AI expert everyone comes to 🚀</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          className="comparison-section grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <div className="comparison-card">
            <div className="text-4xl font-bold text-blue-600 mb-2">10 min</div>
            <div className="text-sm text-gray-600 font-light">Per Project</div>
          </div>
          <div className="comparison-card">
            <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
            <div className="text-sm text-gray-600 font-light">Hands-On</div>
          </div>
          <div className="comparison-card">
            <div className="text-4xl font-bold text-blue-600 mb-2">0</div>
            <div className="text-sm text-gray-600 font-light">Theory Hours</div>
          </div>
          <div className="comparison-card">
            <div className="text-4xl font-bold text-blue-600 mb-2">Day 1</div>
            <div className="text-sm text-gray-600 font-light">ROI</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ========================================
// 🚀 REAL-WORLD PROJECTS SECTION
// ========================================
function ExampleProjectsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      // Track the button click
      trackButtonClick('free-prompts-get-started', email);

      // Subscribe the user
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        // Reset after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
          setEmail('');
        }, 3000);
      } else {
        alert('Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  useEffect(() => {
    if (ref.current) {
      const ctx = gsap.context(() => {
        // Animate section title
        gsap.from('.projects-title', {
          scrollTrigger: {
            trigger: '.projects-title',
            start: 'top 80%',
            toggleActions: 'play none none none'
          },
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: 'power3.out'
        });

        // Animate project cards with stagger
        gsap.from('.project-card', {
          scrollTrigger: {
            trigger: '.projects-grid',
            start: 'top 75%',
            toggleActions: 'play none none none'
          },
          opacity: 0,
          y: 50,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power2.out'
        });
      }, ref);

      return () => ctx.revert();
    }
  }, []);

  const projects = [
    {
      title: "Email Response Generator",
      description: "Turn 30 minutes of email writing into 30 seconds",
      impact: "Save 5+ hours per week",
      realExample: "Auto-generate professional, personalized responses to common customer inquiries and requests",
      time: "10 min",
      icon: "✉️",
      tag: "Communication"
    },
    {
      title: "Document Summarizer",
      description: "Summarize any document instantly",
      impact: "Process 10x more information",
      realExample: "Extract key points from reports, contracts, and long emails in seconds instead of hours",
      time: "8 min",
      icon: "📋",
      tag: "Productivity"
    },
    {
      title: "Data Extractor",
      description: "Pull structured data from any document",
      impact: "Eliminate 3 hours of data entry daily",
      realExample: "Extract names, dates, numbers from PDFs, scanned forms, and images automatically",
      time: "12 min",
      icon: "�",
      tag: "Automation"
    },
    {
      title: "Meeting Notes Assistant",
      description: "Turn recordings into actionable summaries",
      impact: "Never miss action items again",
      realExample: "Generate meeting notes with key decisions, action items, and follow-ups from audio/video",
      time: "10 min",
      icon: "🎙️",
      tag: "Meetings"
    },
    {
      title: "Smart FAQ Bot",
      description: "Extract policy data from any document",
      impact: "Eliminate 3 hours of data entry daily",
      realExample: "Pull names, dates, coverage amounts from PDFs, scanned forms, and handwritten documents automatically",
      time: "10 min",
      icon: "�",
      tag: "Operations"
    },
    {
      title: "Smart FAQ Responder",
      description: "Answer customer questions instantly",
      impact: "Handle 50% more inquiries",
      realExample: "Build an AI assistant that answers common questions about coverage, deductibles, and claim status 24/7",
      time: "15 min",
      icon: "💬",
      tag: "Customer Service"
    },
    {
      title: "Executive Report Builder",
      description: "Turn raw data into insights in minutes",
      impact: "Save 4 hours per report",
      realExample: "Generate loss ratio analyses, claims trends, and underwriting performance reports with natural language",
      time: "10 min",
      icon: "�",
      tag: "Analytics"
    }
  ];

  return (
    <section id="examples" ref={ref} className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
        {/* Coming Soon Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            We're Building Something<br />
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
              Tactical & Powerful
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            While we craft the perfect 10-minute AI projects, here's something you can use right now.
          </p>
        </motion.div>

        {/* Free Prompts Offer - Full Width Professional Design */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-6xl mx-auto mb-16"
        >
          <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-10 sm:p-12 border border-gray-200">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full mb-4">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">Limited Time: Free Access</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Start Using AI Today—Not Next Month
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-3">
                Get 6 battle-tested AI prompts that saved our beta users <span className="font-bold text-blue-600">20+ hours this week</span>.
              </p>
              <p className="text-base text-gray-500 max-w-xl mx-auto">
                While others watch tutorials, you'll be automating work.
              </p>
            </div>

            {/* 6-Box Value Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {/* Email Response Generator */}
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-gray-900 mb-2">Email Response Generator</p>
                <p className="text-sm text-gray-600 mb-3">Turn "I need to think about this..." into professional, context-aware replies in 30 seconds</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full font-semibold">5hrs/week saved</span>
                </div>
              </div>
              
              {/* Meeting Notes Summarizer */}
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-gray-900 mb-2">Meeting Notes Summarizer</p>
                <p className="text-sm text-gray-600 mb-3">Extract decisions, action items, and deadlines from any transcript or recording instantly</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full font-semibold">2hrs/day saved</span>
                </div>
              </div>
              
              {/* Document Intelligence */}
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-gray-900 mb-2">Document Intelligence</p>
                <p className="text-sm text-gray-600 mb-3">Ask questions about any PDF, contract, or report—get instant answers with page references</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full font-semibold">3hrs/document saved</span>
                </div>
              </div>
              
              {/* Competitive Intelligence */}
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-gray-900 mb-2">Competitive Intel Analyzer</p>
                <p className="text-sm text-gray-600 mb-3">Analyze competitor websites, pricing, and strategies—generate comparison reports in minutes</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full font-semibold">6hrs/analysis saved</span>
                </div>
              </div>
              
              {/* LinkedIn Content */}
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-gray-900 mb-2">LinkedIn Content Creator</p>
                <p className="text-sm text-gray-600 mb-3">Turn your expertise into engaging posts that get engagement—posts, carousels, and comments</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full font-semibold">10x your reach</span>
                </div>
              </div>
              
              {/* Data to Insights */}
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-gray-900 mb-2">Data to Insights</p>
                <p className="text-sm text-gray-600 mb-3">Paste your spreadsheet data—get charts, trends, and executive summaries your boss will love</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full font-semibold">4hrs/report saved</span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">Most popular</span>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="relative">
              {/* Pulsing border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-20 animate-pulse"></div>
              
              <div className="relative bg-white rounded-xl p-6 border-2 border-blue-200 shadow-lg">
                {!submitted ? (
                  <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="Enter your work email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-base transition-all"
                    />
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-4 font-bold rounded-lg whitespace-nowrap text-base h-auto shadow-lg hover:shadow-xl transition-all group"
                    >
                      Get Free Prompts
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center gap-3 text-green-600">
                      <CheckCircle2 className="w-6 h-6" />
                      <p className="font-bold text-lg">Success! Check your email for the prompts 🎉</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* What's Coming */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            What's Coming: <span className="text-blue-600">The Full Platform</span>
          </h3>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            We're building <span className="font-semibold text-blue-600">10-minute AI projects</span> that turn you into the go-to AI expert at work. 
            <span className="block mt-2 text-gray-500 text-base">Each project solves a real problem. Built in 10 minutes. Used the same day.</span>
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <p className="font-bold text-gray-900 mb-2 text-lg">10 Minutes</p>
              <p className="text-sm text-gray-600 mb-3">Build it fast, use it forever</p>
              <p className="text-xs text-blue-600 font-semibold">While others watch 40hr courses</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl p-6 hover:border-purple-400 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Target className="w-7 h-7 text-white" />
              </div>
              <p className="font-bold text-gray-900 mb-2 text-lg">Zero Theory</p>
              <p className="text-sm text-gray-600 mb-3">Only practical, working tools</p>
              <p className="text-xs text-purple-600 font-semibold">Skip the boring fundamentals</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-6 hover:border-green-400 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <p className="font-bold text-gray-900 mb-2 text-lg">Real ROI</p>
              <p className="text-sm text-gray-600 mb-3">Use it at work day one</p>
              <p className="text-xs text-green-600 font-semibold">Boss notices immediately</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ========================================
// 💬 TESTIMONIALS SECTION
// ========================================
function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const testimonials = [
    {
      quote: "I built an email response tool in my lunch break. Saved 5 hours this week alone. My boss asked how I'm getting so much done. This is exactly what I needed.",
      author: "Sarah M.",
      role: "Operations Manager",
      project: "Email Response Generator",
      result: "5 hrs/week saved"
    },
    {
      quote: "Finally, AI training that shows me how to build actual tools for my work. Built 3 tools in my first day. My team is already asking me to share them.",
      author: "Michael T.",
      role: "Product Manager",
      project: "Document Summarizer",
      result: "3 tools deployed"
    },
    {
      quote: "Built my first AI email assistant in 10 minutes. Used it the same day. My response time dropped from hours to seconds. Teammates think I hired help.",
      author: "Jennifer L.",
      role: "Customer Success Lead",
      project: "Email Response Generator",
      result: "Response time: hours → seconds"
    }
  ];

  return (
    <section id="testimonials" ref={ref} className="py-32 bg-gradient-to-b from-gray-50 via-blue-50/20 to-white">
      <div className="max-w-7xl mx-auto px-12 sm:px-16 lg:px-24">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-full mb-4">
            ✓ Real Results from Real People
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            They Built Tools. <span className="text-blue-600">You Can Too.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            These professionals went from "watching tutorials" to "everyone asking for my tool" in one day.
          </p>
        </motion.div>
        
        {/* Testimonials - Dynamic shaped cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="h-full"
            >
              <Card className={`border-2 border-gray-200 hover:shadow-xl hover:border-blue-400 transition-all h-full flex flex-col relative overflow-hidden ${
                index === 0 ? 'rounded-[2rem] rounded-tl-sm' :
                index === 1 ? 'rounded-[2.5rem] rounded-br-sm' :
                'rounded-[2rem] rounded-tr-sm rounded-bl-sm'
              }`}>
                {/* Decorative accent */}
                <div className={`absolute w-20 h-20 bg-gradient-to-br from-blue-100 to-transparent opacity-40 ${
                  index === 0 ? 'top-0 left-0 rounded-br-full' :
                  index === 1 ? 'bottom-0 right-0 rounded-tl-full' :
                  'top-0 right-0 rounded-bl-full'
                }`} />
                
                <CardContent className="p-8 flex flex-col h-full relative z-10">
                  <blockquote className="text-gray-700 mb-6 leading-relaxed flex-grow">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold">
                        Built: {testimonial.project}
                      </Badge>
                      <Badge className="bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold">
                        ⚡ {testimonial.result}
                      </Badge>
                    </div>
                    <div className="font-bold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ========================================
// 💰 PRICING SECTION
// ========================================
function PricingSection({ openModal }: { openModal: (type: string) => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Start learning",
      features: [
        "3 core lessons",
        "Community access",
        "Basic tools"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Pro",
      price: "$1",
      period: "/mo",
      description: "For professionals",
      features: [
        "Unlimited lessons",
        "1-on-1 coaching",
        "Priority support",
        "Certifications"
      ],
      cta: "Start Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For teams",
      features: [
        "Everything in Pro",
        "Team analytics",
        "Custom content",
        "Dedicated support"
      ],
      cta: "Contact Us",
      popular: false
    }
  ];

  return (
    <section id="pricing" ref={ref} className="py-32 bg-gradient-to-b from-white via-blue-50/20 to-white">
      <div className="max-w-7xl mx-auto px-12 sm:px-16 lg:px-24">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple Pricing
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto font-light">
            Choose the plan that fits your needs
          </p>
        </motion.div>
        
        {/* Pricing cards - Uniform heights */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="h-full"
            >
              <Card className={`relative h-full flex flex-col ${
                plan.popular 
                  ? 'border-blue-600 border-2 shadow-2xl rounded-[2.5rem] rounded-tl-sm' 
                  : index === 0 
                    ? 'border-2 border-gray-200 rounded-[2rem] rounded-br-sm'
                    : 'border-2 border-gray-200 rounded-[2rem] rounded-bl-sm'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-1 shadow-lg">
                      ⭐ Popular
                    </Badge>
                  </div>
                )}
                
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline mb-2">
                      <span className="text-5xl font-bold text-gray-900">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="ml-2 text-gray-500">{plan.period}</span>
                      )}
                    </div>
                    <p className="text-gray-600 font-light">
                      {plan.description}
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 font-light">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full py-6 text-lg font-semibold mt-auto rounded-xl ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl' 
                        : 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-blue-500'
                    }`}
                    onClick={() => {
                      const buttonType = `pricing-${plan.name.toLowerCase()}`;
                      trackButtonClick(buttonType);
                      openModal(buttonType);
                    }}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ========================================
// 🎓 EMAIL SUBSCRIPTION SECTION
// ========================================
function FinalCTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        alert('Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <section id="subscribe" ref={ref} className="py-40 relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-blue-50/20">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating elements */}
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 10, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-[10%] w-32 h-32 border-4 border-blue-200/40 rounded-3xl"
      />
      <motion.div
        animate={{ 
          y: [0, 20, 0],
          rotate: [0, -10, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-[10%] w-24 h-24 bg-blue-200/40 rounded-full"
      />
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-[5%] w-16 h-16 bg-blue-300/30 rotate-45"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="relative max-w-6xl mx-auto px-12 sm:px-16 lg:px-24 text-center"
      >
        {/* Envelope Icon Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={isInView ? { scale: 1, rotate: 0 } : {}}
          transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
          className="mb-12 flex justify-center"
        >
          <div className="relative">
            <motion.div 
              className="w-32 h-32 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl"
              animate={{ 
                boxShadow: [
                  "0 20px 60px rgba(59, 130, 246, 0.3)",
                  "0 20px 80px rgba(139, 92, 246, 0.4)",
                  "0 20px 60px rgba(59, 130, 246, 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Mail className="w-16 h-16 text-white" />
            </motion.div>
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-3 -right-3 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-xl"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 text-gray-900 leading-tight"
        >
          Projects Delivered to<br />
          <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
            Your Inbox
          </span>
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-2xl sm:text-3xl text-gray-600 mb-20 max-w-4xl mx-auto font-light leading-relaxed"
        >
          Bite-sized <span className="text-gray-900 font-semibold">10-minute projects</span> delivered every 2 days.<br />
          For busy professionals who learn by doing, not watching.
        </motion.p>
        
        {/* Enhanced Form */}
        {!submitted ? (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto mb-16"
          >
            <div className="relative">
              <div className="relative bg-white rounded-2xl p-3 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 px-6 py-4 rounded-xl text-gray-900 text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border border-gray-200"
                  />
                  <Button 
                    type="submit"
                    size="lg" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl whitespace-nowrap transition-colors h-auto"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex items-center justify-center gap-8 flex-wrap text-gray-600"
            >
              <span className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                Free forever
              </span>
              <span className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                Unsubscribe anytime
              </span>
              <span className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                New project every 2 days
              </span>
            </motion.div>
          </motion.form>
        ) : (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.5 }}
            className="max-w-2xl mx-auto mb-16 p-16 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-[3rem] shadow-2xl"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl"
            >
              <CheckCircle2 className="w-14 h-14 text-green-600" />
            </motion.div>
            <h3 className="text-4xl font-bold text-white mb-6">🎉 You're Subscribed!</h3>
            <p className="text-2xl text-green-50 leading-relaxed">
              Check your inbox in 2 days for your first project.<br />
              Get ready to build something awesome!
            </p>
          </motion.div>
        )}
        
        {/* Social proof with animated avatars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="flex items-center gap-6">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: -20 }}
                  animate={isInView ? { scale: 1, x: 0 } : {}}
                  transition={{ delay: 0.7 + i * 0.1, type: "spring" }}
                  whileHover={{ scale: 1.2, zIndex: 50 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-4 border-white flex items-center justify-center text-2xl shadow-xl cursor-pointer"
                >
                  {['👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '👨‍🏫', '👩‍🔬'][i - 1]}
                </motion.div>
              ))}
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold text-gray-900">2,000+</p>
              <p className="text-lg text-gray-600">subscribers building daily</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ========================================
// � TEAM SECTION
// ========================================
function TeamSection({ openModal }: { openModal: (type: string) => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const team = [
    {
      name: "Alex Huang",
      role: "Founder",
      bio: "Computer Scientist and ZIP Launchpad entrepreneur",
      image: "/team/alexhuang.png", // You'll replace this with actual image path
      skills: ["AI Strategy", "Product Development", "Business Growth"]
    },
    {
      name: "Dylan Rowland",
      role: "Co-Founder",
      bio: "CS Major & Lead Web Developer",
      image: "/team/dylan.jpg",
      skills: ["Curriculum Design", "Adult Learning", "Workplace Training"]
    },
    {
      name: "Barry Tunstall",
      role: "Lead AI Engineer",
      bio: "Expert in machine learning and AI system design",
      image: "/team/barry.png",
      skills: ["Machine Learning", "NLP", "System Architecture"]
    },
    {
      name: "Renea Ramos",
      role: "Lead Marketing Strategist",
      bio: "Professional marketer with a passion for AI-driven growth",
      image: "/team/renea.png",
      skills: ["Marketing Strategy", "Customer Support", "Artistry"]
    }
  ];

  return (
    <section id="team" ref={ref} className="py-32 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-12 sm:px-16 lg:px-24">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            Meet the <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">Team</span>
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto font-light leading-relaxed">
            Industry experts and AI specialists working together to transform how you learn.
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <Card className="border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 h-full bg-white hover:shadow-2xl rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                  {/* Team Member Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-blue-600 font-semibold mb-4">
                      {member.role}
                    </p>
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                      {member.bio}
                    </p>
                    
                    {/* Skills */}
                    <div className="flex flex-wrap gap-2">
                      {member.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 mb-6 text-lg">
            Want to join our mission to transform professional education?
          </p>
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-10 py-6 text-lg font-semibold rounded-2xl transition-all"
            onClick={() => {
              trackButtonClick('team-get-in-touch');
              openModal('team-get-in-touch');
            }}
          >
            <Mail className="mr-2 w-5 h-5" />
            Get in Touch
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

// ========================================
// 🏠 MAIN PAGE COMPONENT
// ========================================
export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCtaType, setModalCtaType] = useState('');

  const openModal = (ctaType: string) => {
    setModalCtaType(ctaType);
    setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen">
      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} ctaType={modalCtaType} />
      
      {/* Logo Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">CapyLearn</span>
            </div>
            <Button 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
              onClick={() => {
                trackButtonClick('header-cta');
                openModal('header-cta');
              }}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      <FloatingNav />
      <HeroSection openModal={openModal} />
      <ExampleProjectsSection />
      <ConsultationSection />
      <ProjectBasedLearningSection />
      <TestimonialsSection />
      {/* <PricingSection openModal={openModal} /> */}
      <TeamSection openModal={openModal} />
      <FinalCTASection />
    </main>
  );
}

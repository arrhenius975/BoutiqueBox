
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Truck, Zap, MapPin, Check, ShoppingBag } from 'lucide-react'; // Added ShoppingBag
import Link from 'next/link'; // Added Link for navigation

const BoutiqueBoxLanding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const slides = [
    {
      id: 'welcome',
      title: 'Welcome to BoutiqueBox!',
      content: 'welcome'
    },
    {
      id: 'about',
      title: 'Transform Your Lifestyle',
      content: 'about'
    },
    {
      id: 'services',
      title: 'Explore Our Range of Services',
      content: 'services'
    }
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Handle wheel scroll for slide navigation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isScrolling.current) return;

      const currentSlideElement = slideRefs.current[currentSlide];
      if (!currentSlideElement) return;

      const { scrollTop, scrollHeight, clientHeight } = currentSlideElement;
      const isAtTop = scrollTop === 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1; // Added -1 for robustness

      if (e.deltaY > 0) { // Scrolling down
        if (isAtBottom && currentSlide < slides.length - 1) {
          e.preventDefault();
          nextSlide();
        }
      } else { // Scrolling up
        if (isAtTop && currentSlide > 0) {
          e.preventDefault();
          prevSlide();
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      // Add type assertion for options if needed, or ensure it's compatible
      container.addEventListener('wheel', handleWheel, { passive: false } as EventListenerOptions);
      return () => container.removeEventListener('wheel', handleWheel, { passive: false } as EventListenerOptions);
    }
  }, [currentSlide]); // Added slides.length to dependency array for robustness

  const nextSlide = () => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
    
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false;
    }, 800); // Animation duration
  };

  const prevSlide = () => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
    
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false;
    }, 800); // Animation duration
  };

  const goToSlide = (index: number) => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    setCurrentSlide(index);
    
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false;
    }, 800); // Animation duration
  };

  const WelcomeSlide = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-xl"></div>
      <div className="absolute bottom-32 right-32 w-48 h-48 bg-emerald-400 bg-opacity-10 rounded-full blur-2xl"></div>
      
      <div className="relative z-10 text-center text-white px-8 max-w-4xl mx-auto">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-6xl md:text-8xl font-serif mb-8 tracking-wider">
            BOUTIQUE<span className="text-emerald-300">BOX</span>
          </h1>
          <div className="w-24 h-0.5 bg-emerald-300 mx-auto mb-8"></div>
          <p className="text-xl md:text-2xl font-light leading-relaxed mb-12 text-gray-200">
            Discover a world of curated luxury and convenience, delivered directly to your doorstep. 
            Experience premium products and personalized service that transforms your everyday routine 
            into something extraordinary.
          </p>
          <button 
            onClick={nextSlide}
            className="bg-white text-green-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-emerald-50 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            Discover More
          </button>
          
          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-sm animate-bounce">
            <div className="flex flex-col items-center space-y-2">
              <span>Scroll Down</span>
              <div className="w-1 h-8 bg-white bg-opacity-50 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AboutSlide = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 py-8">
      <div className="container mx-auto px-8 py-16">
        <div className="grid md:grid-cols-2 gap-16 items-center min-h-[80vh]">
          {/* Left: Image */}
          <div className="relative">
            <div className="aspect-[3/4] bg-gradient-to-br from-emerald-200 to-green-300 rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src="https://placehold.co/600x800.png" 
                alt="Luxury lifestyle"
                className="w-full h-full object-cover"
                data-ai-hint="lifestyle luxury"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center shadow-xl">
              <Check className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Right: Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl md:text-6xl font-serif font-bold uppercase text-gray-900 leading-tight mb-6">
                Too busy with household/work? 
                <span className="text-emerald-600 block">We can make that easy for you.</span>
              </h2>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Why Choose Us?</h3>
              <div className="space-y-4">
                {[
                  'Premium curated products selected by experts',
                  'Personalized service tailored to your lifestyle',
                  'Time-saving convenience that fits your schedule',
                  'Sustainable and locally-sourced options available',
                  'Exceptional customer support every step of the way'
                ].map((point, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full mt-3 flex-shrink-0"></div>
                    <p className="text-gray-700 text-lg leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional content for scrolling */}
        <div className="mt-24 py-12 border-t border-gray-300">
          <div className="text-center space-y-8">
            <h3 className="text-3xl font-serif text-gray-800">Our Promise to You</h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              At BoutiqueBox, we believe that everyone deserves access to premium products and exceptional service. 
              Our commitment goes beyond just delivery – we're here to enhance your lifestyle and give you back 
              the time that matters most.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">24/7</span>
                </div>
                <h4 className="font-semibold text-gray-800">Always Available</h4>
                <p className="text-gray-600 text-sm mt-2">Round-the-clock customer support</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">100%</span>
                </div>
                <h4 className="font-semibold text-gray-800">Satisfaction Guaranteed</h4>
                <p className="text-gray-600 text-sm mt-2">Your happiness is our priority</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">5★</span>
                </div>
                <h4 className="font-semibold text-gray-800">Premium Quality</h4>
                <p className="text-gray-600 text-sm mt-2">Only the finest products</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ServicesSlide = () => {
    const services = [
      {
        icon: <Truck className="w-12 h-12" />,
        title: 'Home Delivery',
        description: 'Fast and reliable delivery straight to your doorstep, ensuring your products arrive fresh and on time.',
        color: 'from-blue-500 to-blue-600',
        features: ['Same-day delivery available', 'Real-time tracking', 'Contactless delivery options', 'Flexible scheduling']
      },
      {
        icon: <Zap className="w-12 h-12" />,
        title: 'Fast & Reliable',
        description: 'Quick turnaround times with dependable service you can count on, every single time.',
        color: 'from-yellow-500 to-orange-500',
        features: ['2-hour express delivery', '99.9% on-time delivery rate', 'Professional handling', 'Quality assurance checks']
      },
      {
        icon: <MapPin className="w-12 h-12" />,
        title: 'Local Sourcing',
        description: 'Supporting local businesses and communities while bringing you the freshest, highest-quality products.',
        color: 'from-green-500 to-emerald-600',
        features: ['Partner with local farmers', 'Support small businesses', 'Reduce carbon footprint', 'Fresh seasonal products']
      }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 py-8">
        <div className="container mx-auto px-8 py-16">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-7xl font-serif text-white mb-8 tracking-wide">
              Explore Our Range of <span className="text-emerald-300">Services</span>
            </h2>
            <div className="w-32 h-0.5 bg-emerald-300 mx-auto mb-8"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Discover how our comprehensive suite of services can transform your daily routine and elevate your lifestyle.
            </p>
          </div>

          <div className="space-y-12">
            {services.map((service, index) => (
              <div key={index} className="group">
                <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 transition-all duration-500 hover:bg-opacity-20 border border-white border-opacity-20">
                  <div className="grid md:grid-cols-3 gap-8 items-center">
                    <div className="text-center md:text-left">
                      <div className={`w-20 h-20 bg-gradient-to-r ${service.color} rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0 text-white shadow-xl group-hover:shadow-2xl transition-all duration-300`}>
                        {service.icon}
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-4">{service.title}</h3>
                      <p className="text-gray-300 leading-relaxed">{service.description}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-xl font-semibold text-white mb-4">Key Features:</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {service.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-24 pt-12 border-t border-gray-700">
            <div className="text-center space-y-12">
              <h3 className="text-4xl font-serif text-white">Ready to Get Started?</h3>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Join thousands of satisfied customers who have transformed their lifestyle with BoutiqueBox.
              </p>
              
              {/* Removed the Individual and Family Plan cards section */}
               
               {/* Add a link to explore stores at the very bottom of the last slide */}
                <div className="mt-16">
                    <a
                        href="/sections" // Link to your sections page
                        className="inline-block bg-white text-gray-900 px-10 py-5 rounded-full font-bold text-xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-2xl"
                    >
                        Explore Our Stores
                    </a>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Navigation */}
      <nav className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-full px-4 py-2 shadow-lg border border-white border-opacity-30">
          <div className="flex space-x-4">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => goToSlide(index)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  currentSlide === index 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'text-gray-700 hover:text-emerald-600'
                }`}
              >
                {slide.title.split(' ')[0]} {/* Show first word of title */}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Slide Navigation Arrows - Top (Previous) */}
      <button 
        onClick={prevSlide}
        disabled={currentSlide === 0}
        className={`fixed left-1/2 top-8 transform -translate-x-1/2 -translate-y-1/2 z-40 backdrop-blur-lg rounded-full p-4 transition-all duration-300 ${ // Adjusted top positioning
          currentSlide === 0 
            ? 'bg-gray-500 bg-opacity-20 text-gray-500 cursor-not-allowed opacity-50' 
            : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
        }`}
        style={{ top: '5vh' }} // Fine-tune vertical position
      >
        <ChevronLeft className="w-6 h-6 transform rotate-90" />
      </button>
      
      {/* Slide Navigation Arrows - Bottom (Next) */}
      <button 
        onClick={nextSlide}
        disabled={currentSlide === slides.length - 1}
        className={`fixed left-1/2 bottom-8 transform -translate-x-1/2 translate-y-1/2 z-40 backdrop-blur-lg rounded-full p-4 transition-all duration-300 ${ // Adjusted bottom positioning
          currentSlide === slides.length - 1 
            ? 'bg-gray-500 bg-opacity-20 text-gray-500 cursor-not-allowed opacity-50' 
            : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
        }`}
        style={{ bottom: '15vh' }} // Fine-tune vertical position from bottom, above nav
      >
        <ChevronRight className="w-6 h-6 transform rotate-90" />
      </button>

      {/* Slide Indicator Dots - Right Side */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-50">
        <div className="flex flex-col space-y-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-8 rounded-full transition-all duration-300 ${ // Made taller for easier clicking
                currentSlide === index 
                  ? 'bg-white shadow-lg scale-110' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Slides Container */}
      <div className="relative h-screen overflow-hidden"> {/* Main container for slides */}
        <div 
          className="flex flex-col transition-transform duration-700 ease-in-out"
          style={{ transform: `translateY(-${currentSlide * 100}vh)` }}
        >
          {/* Each slide wrapper needs to allow internal scrolling if content exceeds vh */}
          <div 
            className="h-screen w-screen flex-shrink-0 overflow-y-auto" // Added w-screen
            ref={(el) => slideRefs.current[0] = el}
          >
            <WelcomeSlide />
          </div>
          <div 
            className="h-screen w-screen flex-shrink-0 overflow-y-auto" // Added w-screen
            ref={(el) => slideRefs.current[1] = el}
          >
            <AboutSlide />
          </div>
          <div 
            className="h-screen w-screen flex-shrink-0 overflow-y-auto" // Added w-screen
            ref={(el) => slideRefs.current[2] = el}
          >
            <ServicesSlide />
          </div>
        </div>
      </div>

      {/* Sticky Button to Sections Page */}
      <Link
        href="/sections"
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center group"
      >
        <ShoppingBag className="h-6 w-6" />
        <span className="absolute right-full mr-2 -translate-y-1/2 top-1/2 bg-background text-foreground px-2 py-1 rounded text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Explore Stores
        </span>
      </Link>

    </div>
  );
};

export default BoutiqueBoxLanding;


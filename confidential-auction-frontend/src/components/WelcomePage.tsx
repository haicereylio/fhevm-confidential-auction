"use client";

import { useState, useEffect } from "react";
import { Shield, Lock, Eye, Zap, ArrowRight, Star, Users, TrendingUp } from "lucide-react";

interface WelcomePageProps {
  onGetStarted: () => void;
}

export function WelcomePage({ onGetStarted }: WelcomePageProps) {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: Shield,
      title: "Complete Privacy Protection",
      description: "Based on FHEVM technology, ensuring all bid information is fully encrypted with no one able to peek at your bidding strategy",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "From bidding to settlement, fully homomorphic encryption protects your privacy throughout the entire process",
      color: "from-cyan-500 to-cyan-600"
    },
    {
      icon: Eye,
      title: "Transparent & Fair",
      description: "Blockchain technology ensures the auction process is transparent and verifiable, eliminating any possibility of cheating",
      color: "from-pink-500 to-pink-600"
    },
    {
      icon: Zap,
      title: "Real-time Bidding",
      description: "Support for real-time bidding, auto-bidding and multiple auction modes so you never miss an opportunity",
      color: "from-orange-500 to-orange-600"
    }
  ];

  const stats = [
    { label: "Active Users", value: "10K+", icon: Users },
    { label: "Successful Auctions", value: "5K+", icon: TrendingUp },
    { label: "Privacy Protection", value: "100%", icon: Shield },
    { label: "User Satisfaction", value: "4.9", icon: Star }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-purple-500/10 via-cyan-500/10 to-purple-500/10 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }}></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo Animation */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center float">
                  <Shield className="w-12 h-12 text-white" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 opacity-30 blur-xl animate-pulse"></div>
              </div>
            </div>

            {/* Main Title */}
            <h1 className="heading-xl gradient-text mb-6 fade-in">
              ConfidentialAuction
            </h1>
            <p className="text-xl text-gray-300 mb-4 fade-in" style={{ animationDelay: '0.2s' }}>
              World's First FHEVM-Based Privacy-Preserving Auction Platform
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto fade-in" style={{ animationDelay: '0.4s' }}>
              Participate in auctions with complete privacy protection, enjoying fair, transparent, and secure bidding experiences
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 fade-in" style={{ animationDelay: '0.6s' }}>
              <button
                onClick={onGetStarted}
                className="neon-button flex items-center space-x-2 text-lg px-8 py-4"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-all duration-300 flex items-center space-x-2">
                <span>Learn More</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="text-center fade-in"
                    style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                  >
                    <div className="flex justify-center mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-400/20 flex items-center justify-center border border-white/10">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="heading-lg gradient-text mb-4">Core Features</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Utilizing cutting-edge homomorphic encryption technology to provide unprecedented privacy protection
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = index === currentFeature;
              
              return (
                <div
                  key={index}
                  className={`cyber-card text-center transition-all duration-500 ${
                    isActive ? 'glow-effect scale-105' : ''
                  }`}
                >
                  <div className="flex justify-center mb-6">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="heading-sm text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* How It Works */}
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="heading-lg gradient-text mb-4">How It Works</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Three simple steps to start your privacy auction journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Connect Wallet",
                description: "Connect your Web3 wallet to ensure account security"
              },
              {
                step: "02", 
                title: "Browse Auctions",
                description: "View ongoing auctions and select items of interest"
              },
              {
                step: "03",
                title: "Private Bidding",
                description: "Submit bids using encryption technology to protect your privacy"
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center mx-auto text-2xl font-bold text-white">
                    {item.step}
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-purple-500 to-cyan-400 opacity-30"></div>
                  )}
                </div>
                <h3 className="heading-sm text-white mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="cyber-card text-center max-w-2xl mx-auto">
            <h2 className="heading-lg gradient-text mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join us and experience the new privacy-preserving auction platform
            </p>
            <button
              onClick={onGetStarted}
              className="neon-button text-lg px-8 py-4 flex items-center space-x-2 mx-auto"
            >
              <span>Start Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

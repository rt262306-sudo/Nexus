import React from 'react';
import { Heart, Globe, Shield, Sparkles } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="page-container fade-in" style={{ paddingBottom: 100 }}>
      <div style={{ textAlign: 'center', marginBottom: 40, marginTop: 20 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 10px 30px rgba(248, 44, 90, 0.3)'
        }}>
          <Heart size={40} color="white" fill="white" />
        </div>
        <h1 className="page-title" style={{ marginBottom: 8 }}>About Nexus</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Connecting you to the rhythm of life.</p>
      </div>

      <div style={{
        background: 'var(--bg-elevated)',
        padding: '32px 24px',
        borderRadius: 24,
        border: '1px solid var(--glass-border)',
        marginBottom: 32,
        lineHeight: '1.8',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
          <Sparkles size={120} color="var(--accent-primary)" />
        </div>

        <p style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 20, fontWeight: 500 }}>
          "Hello friends, I am just a guy who wants freedom, love, and peace to be spread across the globe and music is the only thing that truly fulfills this vision."
        </p>

        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          In a world that often feels loud and divided, I believe music is the universal language that transcends all boundaries. It speaks directly to the soul, reminding us that we are more alike than we are different.
        </p>

        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          I created <strong>Nexus Music</strong> to bring freedom back to your listening experience. No ads, no interruptions just you and the rhythm. I want every person using this app to feel proud of themselves, to find their inner peace, and to carry that light out into the world.
        </p>

        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 20, marginTop: 10 }}>
          <p style={{ fontWeight: 700, fontSize: 20, color: 'var(--accent-primary)' }}>Raj Dadhich</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px' }}>Founder & Visionary</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 20, textAlign: 'center' }}>
          <Globe size={24} color="var(--accent-primary)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 14, marginBottom: 4 }}>Global Peace</h3>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Uniting the world through sound.</p>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 20, textAlign: 'center' }}>
          <Shield size={24} color="var(--accent-primary)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 14, marginBottom: 4 }}>True Freedom</h3>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Ad-free, limit-free listening.</p>
        </div>
      </div>

      <div style={{ marginTop: 40, textAlign: 'center', opacity: 0.5 }}>
        <p style={{ fontSize: 12 }}>v1.0.0 • Crafted with love for a better world</p>
      </div>
    </div>
  );
};

export default AboutPage;

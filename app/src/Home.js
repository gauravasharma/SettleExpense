import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import Friends from './Friends';
import Groups from './Groups';

const Home = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('friends');

  const getTabStyle = (isActive) => {
    const baseStyle = {
      border: 'none',
      backgroundColor: isActive ? '#4285f4' : '#f8f9fa',
      color: isActive ? 'white' : '#333',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s',
      borderRadius: isActive ? '8px 8px 0 0' : '0',
      borderBottom: isActive ? 'none' : '2px solid #e9ecef',
      flex: 1,
      whiteSpace: 'nowrap'
    };

    // Responsive padding
    if (window.innerWidth <= 480) {
      return { ...baseStyle, padding: '0.75rem 0.5rem', fontSize: '14px' };
    } else if (window.innerWidth <= 768) {
      return { ...baseStyle, padding: '0.875rem 1rem', fontSize: '15px' };
    }
    return { ...baseStyle, padding: '1rem 2rem', fontSize: '16px' };
  };

  const getContainerStyle = () => {
    if (window.innerWidth <= 480) {
      return { maxWidth: '100%', margin: '0 auto', padding: '0 0.5rem' };
    } else if (window.innerWidth <= 768) {
      return { maxWidth: '100%', margin: '0 auto', padding: '0 0.75rem' };
    }
    return { maxWidth: '1200px', margin: '0 auto', padding: '0' };
  };

  const getContentPadding = () => {
    if (window.innerWidth <= 480) {
      return '1rem';
    } else if (window.innerWidth <= 768) {
      return '1.5rem';
    }
    return '2rem';
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      backgroundColor: '#f5f5f5',
      paddingTop: '1rem',
      paddingBottom: '1rem'
    }}>
      <div style={getContainerStyle()}>
        {/* Tabs at the top */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px 8px 0 0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginTop: window.innerWidth <= 480 ? '1rem' : '2rem',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #e9ecef'
          }}>
            <button
              onClick={() => setActiveTab('friends')}
              style={getTabStyle(activeTab === 'friends')}
            >
              Friends
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              style={getTabStyle(activeTab === 'groups')}
            >
              Groups
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          padding: getContentPadding(),
          marginBottom: window.innerWidth <= 480 ? '1rem' : '2rem'
        }}>
          {activeTab === 'friends' && <Friends />}
          {activeTab === 'groups' && <Groups />}
        </div>
      </div>
    </div>
  );
};

export default Home;

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import Friends from './Friends';
import Groups from './Groups';

const Home = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('friends');

  const tabStyle = (isActive) => ({
    padding: '1rem 2rem',
    border: 'none',
    backgroundColor: isActive ? '#4285f4' : '#f8f9fa',
    color: isActive ? 'white' : '#333',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s',
    borderRadius: isActive ? '8px 8px 0 0' : '0',
    borderBottom: isActive ? 'none' : '2px solid #e9ecef'
  });

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Tabs at the top */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px 8px 0 0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginTop: '2rem',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #e9ecef'
          }}>
            <button
              onClick={() => setActiveTab('friends')}
              style={tabStyle(activeTab === 'friends')}
            >
              Friends
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              style={tabStyle(activeTab === 'groups')}
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
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          {activeTab === 'friends' && <Friends />}
          {activeTab === 'groups' && <Groups />}
        </div>
      </div>
    </div>
  );
};

export default Home;

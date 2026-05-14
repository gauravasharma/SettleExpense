import React from 'react';
import { useAuth } from './AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          borderBottom: '1px solid #eee',
          paddingBottom: '1rem'
        }}>
          <h1 style={{ color: '#333', margin: 0 }}>SettleExpense Dashboard</h1>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <img
            src={user.photoURL}
            alt={user.displayName}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              marginBottom: '1rem'
            }}
          />
          <h2 style={{ color: '#333', marginBottom: '0.5rem' }}>
            Welcome, {user.displayName}!
          </h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Email: {user.email}
          </p>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ color: '#333', marginTop: 0 }}>Your Account Information</h3>
            <div style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              <p><strong>User ID:</strong> {user.uid}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Name:</strong> {user.displayName}</p>
              <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
              <p><strong>Account Created:</strong> {user.metadata.creationTime}</p>
              <p><strong>Last Login:</strong> {user.metadata.lastSignInTime}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { friendsService } from './friendsService';

const Friends = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Subscribe to friends list
    const unsubscribeFriends = friendsService.getFriends(user.uid, (friendsData) => {
      setFriends(friendsData);
    });

    return () => {
      unsubscribeFriends();
    };
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await friendsService.searchUsers(searchQuery.trim());
      // Filter out current user and existing friends
      const filteredResults = results.filter(result => {
        const isCurrentUser = result.uid === user.uid;
        const isAlreadyFriend = friends.some(friend =>
          (friend.senderId === user.uid && friend.receiverId === result.uid) ||
          (friend.receiverId === user.uid && friend.senderId === result.uid)
        );

        return !isCurrentUser && !isAlreadyFriend;
      });
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (friendData) => {
    setLoading(true);
    try {
      await friendsService.addFriend(user.uid, friendData.uid, {
        currentUserName: user.displayName,
        currentUserEmail: user.email,
        currentUserPhoto: user.photoURL,
        friendName: friendData.displayName,
        friendEmail: friendData.email,
        friendPhoto: friendData.photoURL
      });
      alert('Friend added successfully!');
      setSearchResults(searchResults.filter(result => result.uid !== friendData.uid));
    } catch (error) {
      console.error('Failed to add friend:', error);
      alert(error.message || 'Failed to add friend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h3 style={{ color: '#333', margin: 0 }}>Friends</h3>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {friends.length} friend{friends.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Search Section */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        marginBottom: '2rem'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>Add Friends</h4>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="email"
            placeholder="Search by email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            type="submit"
            disabled={searching}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: searching ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h5 style={{ margin: '0 0 1rem 0', color: '#333' }}>Search Results</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {searchResults.map((result) => (
                <div key={result.uid} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img
                      src={result.photoURL || '/default-avatar.png'}
                      alt={result.displayName}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: '500', color: '#333' }}>{result.displayName}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{result.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddFriend(result)}
                    disabled={loading}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {loading ? 'Adding...' : 'Add Friend'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Friends List */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>Your Friends</h4>
        {friends.length === 0 ? (
          <p style={{ margin: 0, color: '#666', textAlign: 'center' }}>
            No friends added yet. Search for friends above to get started!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {friends.map((friend) => {
              const friendData = friend.senderId === user.uid ? friend.receiverData : friend.senderData;
              return (
                <div key={friend.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <img
                    src={friendData.photoURL || '/default-avatar.png'}
                    alt={friendData.displayName}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginRight: '1rem'
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: '500', color: '#333' }}>{friendData.displayName}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{friendData.email}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;

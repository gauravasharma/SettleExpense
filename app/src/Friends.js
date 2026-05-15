import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { friendsService } from './friendsService';
import { groupsService } from './groupsService';

const Friends = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Subscribe to friends list
    const unsubscribeFriends = friendsService.getFriends(user.uid, (friendsData) => {
      setFriends(friendsData);
    });

    // Subscribe to user's groups
    const unsubscribeGroups = groupsService.getUserGroups(user.uid, (groupsData) => {
      setGroups(groupsData);
    });

    return () => {
      unsubscribeFriends();
      unsubscribeGroups();
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

  const computeFriendBalances = () => {
    const balances = {};

    groups.forEach((group) => {
      const members = group.members || [];
      const expenses = group.expenses || [];

      expenses.forEach((expense) => {
        const amount = Number(expense.amount);
        if (!amount) return;

        const payer = expense.addedBy || {};
        const otherMembers = members.filter((member) => member.uid !== payer.uid);
        if (otherMembers.length === 0) return;

        const perPersonRaw = amount / members.length;
        const perPerson = Number(perPersonRaw.toFixed(2));
        let remainder = Number((amount - perPerson * members.length).toFixed(2));

        otherMembers.forEach((member, index) => {
          let owed = perPerson;
          if (index === otherMembers.length - 1 && remainder !== 0) {
            owed = Number((perPerson + remainder).toFixed(2));
          }

          // If payer is current user, others owe user
          if (payer.uid === user.uid) {
            balances[member.uid] = (balances[member.uid] || 0) + owed;
          }
          // If member is current user, user owes payer
          else if (member.uid === user.uid) {
            balances[payer.uid] = (balances[payer.uid] || 0) - owed;
          }
        });
      });
    });

    return balances;
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

  const isMobile = window.innerWidth <= 480;
  const isTablet = window.innerWidth <= 768;
  
  const getHeaderPadding = () => isMobile ? '1rem 0 1.5rem 0' : isTablet ? '1.25rem 0 1.75rem 0' : '2rem 0';
  const getSectionPadding = () => isMobile ? '1rem' : isTablet ? '1.25rem' : '1.5rem';
  const getFormGap = () => isMobile ? '0.5rem' : '1rem';
  const getCardPadding = () => isMobile ? '0.75rem' : isTablet ? '1rem' : '1rem';
  const getAvatarSize = () => isMobile ? '36px' : '40px';
  const getAvatarMargin = () => isMobile ? '0.5rem' : '1rem';
  const getFontSize = () => isMobile ? '13px' : isTablet ? '13.5px' : '14px';

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: getHeaderPadding(),
        flexWrap: 'wrap',
        gap: isMobile ? '0.5rem' : '1rem'
      }}>
        <h3 style={{ color: '#333', margin: 0, fontSize: isTablet ? '20px' : '24px' }}>Friends</h3>
        <div style={{ fontSize: isMobile ? '12px' : '14px', color: '#666', whiteSpace: 'nowrap' }}>
          {friends.length} friend{friends.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Search Section */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: getSectionPadding(),
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        marginBottom: getHeaderPadding()
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: isTablet ? '16px' : '18px' }}>Add Friends</h4>
        <form onSubmit={handleSearch} style={{ 
          display: 'flex', 
          gap: getFormGap(),
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <input
            type="email"
            placeholder="Search by email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: isMobile ? '0.625rem' : '0.75rem',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: getFontSize(),
              minHeight: isMobile ? '36px' : '40px',
              width: '100%'
            }}
          />
          <button
            type="submit"
            disabled={searching}
            style={{
              padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: searching ? 'not-allowed' : 'pointer',
              fontSize: getFontSize(),
              fontWeight: '500',
              minHeight: isMobile ? '36px' : '40px',
              width: isMobile ? '100%' : 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h5 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: isTablet ? '15px' : '16px' }}>Search Results</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {searchResults.map((result) => (
                <div key={result.uid} style={{
                  display: 'flex',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  justifyContent: 'space-between',
                  padding: getCardPadding(),
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '0.75rem' : '0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: getAvatarMargin(), width: isMobile ? '100%' : 'auto' }}>
                    <img
                      src={result.photoURL || '/default-avatar.png'}
                      alt={result.displayName}
                      style={{
                        width: getAvatarSize(),
                        height: getAvatarSize(),
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#333', fontSize: getFontSize(), overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.displayName}</div>
                      <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddFriend(result)}
                    disabled={loading}
                    style={{
                      padding: isMobile ? '0.5rem 1rem' : '0.5rem 1rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: isMobile ? '12px' : '14px',
                      minHeight: '36px',
                      width: isMobile ? '100%' : 'auto',
                      whiteSpace: 'nowrap'
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
        padding: getSectionPadding(),
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: isTablet ? '16px' : '18px' }}>Your Friends</h4>
        {friends.length === 0 ? (
          <p style={{ margin: 0, color: '#666', textAlign: 'center', fontSize: getFontSize() }}>
            No friends added yet. Search for friends above to get started!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(() => {
              const balances = computeFriendBalances();
              return friends.map((friend) => {
                const friendData = friend.senderId === user.uid ? friend.receiverData : friend.senderData;
                const balance = balances[friendData.uid] || 0;
                const owesYou = balance > 0;
                const youOwe = balance < 0;
                const amount = Math.abs(balance).toFixed(2);
                return (
                  <div key={friend.id} style={{
                    display: 'flex',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    padding: getCardPadding(),
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '0.75rem' : '0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: getAvatarMargin(), width: isMobile ? '100%' : 'auto', minWidth: 0 }}>
                      <img
                        src={friendData.photoURL || '/default-avatar.png'}
                        alt={friendData.displayName}
                        style={{
                          width: getAvatarSize(),
                          height: getAvatarSize(),
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: '500', color: '#333', fontSize: getFontSize(), overflow: 'hidden', textOverflow: 'ellipsis' }}>{friendData.displayName}</div>
                        <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis' }}>{friendData.email}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: isMobile ? 'left' : 'right', fontSize: isMobile ? '12px' : '14px', width: isMobile ? '100%' : 'auto' }}>
                      {balance !== 0 && (
                        <div style={{
                          fontWeight: 'bold',
                          color: owesYou ? '#28a745' : youOwe ? '#dc3545' : '#666'
                        }}>
                          {owesYou ? 'Owes you' : 'You owe'} ${amount}
                        </div>
                      )}
                      {balance === 0 && (
                        <div style={{
                          color: '#666'
                        }}>
                          Settled up
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;

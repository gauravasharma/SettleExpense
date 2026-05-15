import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { groupsService } from './groupsService';
import { friendsService } from './friendsService';

const Groups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Form state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  useEffect(() => {
    if (!user) return;

    // Subscribe to user's groups
    const unsubscribeGroups = groupsService.getUserGroups(user.uid, (groupsData) => {
      setGroups(groupsData);
    });

    // Get friends list
    const unsubscribeFriends = friendsService.getFriends(user.uid, (friendsData) => {
      setFriends(friendsData);
    });

    return () => {
      unsubscribeGroups();
      unsubscribeFriends();
    };
  }, [user]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      await groupsService.createGroup(
        { name: groupName, description: groupDescription },
        user.uid,
        {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        }
      );
      alert('Group created successfully!');
      setGroupName('');
      setGroupDescription('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFriends = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = friends.filter(friend => {
      const friendData = friend.senderId === user.uid ? friend.receiverData : friend.senderData;
      const isAlreadyMember = groups
        .find(g => g.id === selectedGroupId)
        ?.members.some(m => m.uid === friendData.uid);

      return (
        !isAlreadyMember &&
        (friendData.displayName.toLowerCase().includes(query) ||
          friendData.email.toLowerCase().includes(query))
      );
    });
    setSearchResults(results);
  };

  const handleAddMemberToGroup = async (friendData) => {
    const friend = friendData.senderId === user.uid ? friendData.receiverData : friendData.senderData;
    
    setLoading(true);
    try {
      await groupsService.addMemberToGroup(selectedGroupId, {
        uid: friend.uid,
        displayName: friend.displayName,
        email: friend.email,
        photoURL: friend.photoURL
      });
      alert('Member added successfully!');
      setSearchQuery('');
      setSearchResults([]);
      setShowAddMemberForm(false);
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('Failed to add member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (groupId, memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await groupsService.removeMemberFromGroup(groupId, memberId);
      alert('Member removed successfully!');
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member. Please try again.');
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
        <h3 style={{ color: '#333', margin: 0 }}>Groups</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {showCreateForm ? 'Cancel' : '+ Create Group'}
        </button>
      </div>

      {/* Create Group Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          marginBottom: '2rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>Create New Group</h4>
          <form onSubmit={handleCreateGroup}>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Group Name (required)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <textarea
                placeholder="Description (optional)"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  minHeight: '80px'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      )}

      {/* Groups List */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>Your Groups</h4>
        {groups.length === 0 ? (
          <p style={{ margin: 0, color: '#666', textAlign: 'center' }}>
            No groups yet. Create your first group to get started!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {groups.map((group) => (
              <div key={group.id} style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '0.5rem'
                  }}>
                    <h5 style={{ margin: 0, color: '#333', fontSize: '16px' }}>
                      {group.name}
                    </h5>
                    <button
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        setShowAddMemberForm(selectedGroupId === group.id ? !showAddMemberForm : true);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {selectedGroupId === group.id && showAddMemberForm ? 'Close' : '+ Add Member'}
                    </button>
                  </div>
                  {group.description && (
                    <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '14px' }}>
                      {group.description}
                    </p>
                  )}
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '0.5rem',
                    fontSize: '12px',
                    color: '#999'
                  }}>
                    <span>Created by: {group.creatorInfo.displayName}</span>
                    <span>
                      {new Date(group.createdDate.seconds ? group.createdDate.seconds * 1000 : group.createdDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Add Member Form */}
                {selectedGroupId === group.id && showAddMemberForm && (
                  <div style={{
                    backgroundColor: '#e7f3ff',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    border: '1px solid #4285f4'
                  }}>
                    <input
                      type="text"
                      placeholder="Search friends by name or email..."
                      value={searchQuery}
                      onChange={handleSearchFriends}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                        marginBottom: '0.5rem',
                        boxSizing: 'border-box'
                      }}
                    />
                    {searchResults.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {searchResults.map((friend) => {
                          const friendData = friend.senderId === user.uid ? friend.receiverData : friend.senderData;
                          return (
                            <div key={friend.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.75rem',
                              backgroundColor: 'white',
                              borderRadius: '4px',
                              border: '1px solid #e9ecef'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <img
                                  src={friendData.photoURL || '/default-avatar.png'}
                                  alt={friendData.displayName}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    objectFit: 'cover'
                                  }}
                                />
                                <div>
                                  <div style={{ fontWeight: '500', color: '#333', fontSize: '13px' }}>
                                    {friendData.displayName}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#666' }}>
                                    {friendData.email}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAddMemberToGroup(friend)}
                                disabled={loading}
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  backgroundColor: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: loading ? 'not-allowed' : 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                Add
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Members List */}
                <div>
                  <h6 style={{
                    margin: '1rem 0 0.5rem 0',
                    color: '#666',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    Members ({group.members.length})
                  </h6>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {group.members.map((member) => (
                      <div key={member.uid} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={member.photoURL || '/default-avatar.png'}
                            alt={member.displayName}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: '500', color: '#333', fontSize: '13px' }}>
                              {member.displayName}
                              {member.uid === group.createdBy && (
                                <span style={{ fontSize: '11px', color: '#999', marginLeft: '0.5rem' }}>
                                  (Admin)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              {member.email}
                            </div>
                          </div>
                        </div>
                        {member.uid === user.uid && member.uid !== group.createdBy && (
                          <button
                            onClick={() => handleRemoveMember(group.id, member.uid)}
                            style={{
                              padding: '0.4rem 0.8rem',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            Leave
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;

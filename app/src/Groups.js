import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { groupsService } from './groupsService';
import { friendsService } from './friendsService';
import './Groups.css';

const Groups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);
  const [expenseGroupId, setExpenseGroupId] = useState(null);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePayerUid, setExpensePayerUid] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expenseCreatedDate, setExpenseCreatedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Form state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to user's groups
const unsubscribeGroups = groupsService.getUserGroups(user.uid, (groupsData) => {
  const sortedGroups = [...groupsData].sort((a, b) => {
    const aTime = a.createdDate?.seconds
      ? a.createdDate.seconds * 1000
      : new Date(a.createdDate).getTime();
    const bTime = b.createdDate?.seconds
      ? b.createdDate.seconds * 1000
      : new Date(b.createdDate).getTime();
    return bTime - aTime; // newest first
  });
  setGroups(sortedGroups);
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

  useEffect(() => {
    if (user) {
      setExpensePayerUid(user.uid);
    }
  }, [user]);

  const resetExpenseForm = () => {
    setExpenseTitle('');
    setExpenseAmount('');
    setExpensePayerUid(user?.uid || '');
    setExpenseCreatedDate(null);
    setEditingExpenseId(null);
  };

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

  const handleAddExpenseButtonClick = (groupId) => {
    if (expenseGroupId === groupId && !editingExpenseId) {
      setShowAddExpenseForm((prev) => !prev);
    } else {
      setExpenseGroupId(groupId);
      setShowAddExpenseForm(true);
      resetExpenseForm();
    }
    setExpandedGroupId(groupId);
  };

  const handleEditExpense = (groupId, expense) => {
    setExpenseGroupId(groupId);
    setShowAddExpenseForm(true);
    setEditingExpenseId(expense.id);
    setExpenseTitle(expense.title);
    setExpenseAmount(String(expense.amount));
    setExpensePayerUid(expense.addedBy?.uid || user.uid);
    setExpenseCreatedDate(expense.createdDate || new Date());
    setExpandedGroupId(groupId);
  };

  const handleDeleteExpense = async (groupId, expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    setLoading(true);
    try {
      await groupsService.deleteExpenseFromGroup(groupId, expenseId);
      alert('Expense deleted successfully!');
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();

    if (!expenseTitle.trim()) {
      alert('Please enter an expense title');
      return;
    }

    const amount = Number(expenseAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      alert('Please enter a valid expense amount greater than 0');
      return;
    }

    const group = groups.find((g) => g.id === expenseGroupId);
    if (!group) {
      alert('Group not found.');
      return;
    }

    const payer = group.members.find((member) => member.uid === expensePayerUid) || {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    };

    setLoading(true);
    try {
      if (editingExpenseId) {
        await groupsService.updateExpenseInGroup(expenseGroupId, editingExpenseId, {
          title: expenseTitle.trim(),
          amount: Number(amount.toFixed(2)),
          addedBy: payer,
          createdDate: expenseCreatedDate || new Date()
        });
        alert('Expense updated successfully!');
      } else {
        await groupsService.addExpenseToGroup(expenseGroupId, {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          title: expenseTitle.trim(),
          amount: Number(amount.toFixed(2)),
          addedBy: payer,
          createdDate: new Date()
        });
        alert('Expense added successfully!');
      }
      resetExpenseForm();
      setShowAddExpenseForm(false);
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Failed to save expense. Please try again.');
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

  const toggleGroup = (groupId) => {
    setExpandedGroupId((prevId) => (prevId === groupId ? null : groupId));
  };

  const handleAddMemberButtonClick = (groupId) => {
    if (selectedGroupId === groupId) {
      setShowAddMemberForm((prev) => !prev);
    } else {
      setSelectedGroupId(groupId);
      setShowAddMemberForm(true);
    }
    setExpandedGroupId(groupId);
  };

  const computeGroupTotalBalances = (group) => {
    const members = group.members || [];
    const expenses = group.expenses || [];
    const balances = {};

    // Initialize balances for all member pairs
    members.forEach(member1 => {
      members.forEach(member2 => {
        if (member1.uid !== member2.uid) {
          const key = `${member1.uid}-${member2.uid}`;
          balances[key] = { from: member1, to: member2, amount: 0 };
        }
      });
    });

    if (members.length <= 1) return balances;

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

        const key = `${member.uid}-${payer.uid}`;
        if (balances[key]) {
          balances[key].amount += owed;
        }
      });
    });

    // Calculate net balances
    const netBalances = {};
    Object.values(balances).forEach(balance => {
      if (balance.amount > 0) {
        const reverseKey = `${balance.to.uid}-${balance.from.uid}`;

        const reverseBalance = balances[reverseKey];
        const reverseAmount = reverseBalance ? reverseBalance.amount : 0;

        const netAmount = balance.amount - reverseAmount;

        if (netAmount > 0) {
          // from owes to
          const key = `${balance.from.uid}-${balance.to.uid}`;
          netBalances[key] = {
            from: balance.from,
            to: balance.to,
            amount: netAmount
          };
        } else if (netAmount < 0) {
          // to owes from
          const key = `${balance.to.uid}-${balance.from.uid}`;
          netBalances[key] = {
            from: balance.to,
            to: balance.from,
            amount: Math.abs(netAmount)
          };
        }
        // If netAmount === 0, they're settled
      }
    });

    // Return as array of net balances
    return Object.values(netBalances);
  };

  const computeMemberTotals = (group) => {
    const members = group.members || [];
    const expenses = group.expenses || [];
    const totals = members.reduce((acc, member) => {
      acc[member.uid] = { paid: 0, owed: 0 };
      return acc;
    }, {});

    if (members.length === 0) return totals;

    expenses.forEach((expense) => {
      const amount = Number(expense.amount);
      if (!amount) return;

      const perPersonRaw = amount / members.length;
      const perPerson = Number(perPersonRaw.toFixed(2));
      let remainder = Number((amount - perPerson * members.length).toFixed(2));

      members.forEach((member, index) => {
        let share = perPerson;
        if (index === members.length - 1 && remainder !== 0) {
          share = Number((perPerson + remainder).toFixed(2));
        }
        totals[member.uid].owed += share;
      });

      const payerUid = expense.addedBy?.uid;
      if (payerUid && totals[payerUid]) {
        totals[payerUid].paid += amount;
      }
    });

    return totals;
  };

  return (
    <div>
      <div className="groups-header">
        <h3 className="groups-title">Groups</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="groups-create-btn"
        >
          {showCreateForm ? 'Cancel' : '+ Create Group'}
        </button>
      </div>

      {/* Create Group Form */}
      {showCreateForm && (
        <div className="groups-form-section">
          <h4 className="groups-form-title">Create New Group</h4>
          <form onSubmit={handleCreateGroup}>
            <div className="groups-form-group">
              <input
                type="text"
                placeholder="Group Name (required)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="groups-form-input"
              />
            </div>
            <div className="groups-form-group">
              <textarea
                placeholder="Description (optional)"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                className="groups-form-textarea"
              />
            </div>
            <div className="groups-form-buttons">
              <button
                type="submit"
                disabled={loading}
                className="groups-submit-btn"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
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
            {groups.map((group) => {
              const isExpanded = expandedGroupId === group.id;
              const totals = computeMemberTotals(group);
              return (
                <div key={group.id} style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div className="groups-card-top">
                      <div
                        className="groups-card-row-title"
                        onClick={() => toggleGroup(group.id)}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => { if (e.key === 'Enter') toggleGroup(group.id); }}
                      >
                        <h5 className="groups-card-title">{group.name}</h5>
                      </div>
                    </div>
                    <div className="groups-card-bottom">
                      <div className="groups-card-bottom-left">
                        <div className="groups-card-row-meta">
                          <span>Members: {group.members.length}</span>
                          <span>{new Date(group.createdDate.seconds ? group.createdDate.seconds * 1000 : group.createdDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="groups-card-row-actions">
                        <button
                          onClick={() => toggleGroup(group.id)}
                          className="groups-expand-btn"
                          aria-expanded={isExpanded}
                          title={isExpanded ? 'Collapse group' : 'Expand group'}
                        >
                          <svg className={`btn-icon ${isExpanded ? 'rotate' : ''}`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                            <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                          </svg>
                          <span className="btn-label">{isExpanded ? 'Collapse' : 'Expand'}</span>
                        </button>
                        <button
                          onClick={() => handleAddExpenseButtonClick(group.id)}
                          className="groups-add-expense-btn"
                          title={expenseGroupId === group.id && showAddExpenseForm ? 'Close add expense' : 'Add expense'}
                        >
                          <svg className="btn-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                            <path d="M12 5v14m7-7H5" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                          <span className="btn-label">{expenseGroupId === group.id && showAddExpenseForm ? 'Close' : 'Add Expense'}</span>
                        </button>
                        <button
                          onClick={() => handleAddMemberButtonClick(group.id)}
                          className="groups-add-member-btn"
                          title={selectedGroupId === group.id && showAddMemberForm ? 'Close add member' : 'Add member'}
                        >
                          <svg className="btn-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                            <path d="M15 14c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM6 20v-1c0-2 4-3 6-3s6 1 6 3v1H6zM19 11v2" fill="currentColor" />
                          </svg>
                          <span className="btn-label">{selectedGroupId === group.id && showAddMemberForm ? 'Close' : 'Add Member'}</span>
                        </button>
                      </div>
                    </div>
                    {isExpanded && group.description && (
                      <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '14px' }}>
                        {group.description}
                      </p>
                    )}
                    {isExpanded && (
                      <div style={{
                        display: 'flex',
                        gap: '1rem',
                        fontSize: '12px',
                        color: '#999'
                      }}>
                        <span>Created by: {group.creatorInfo.displayName}</span>
                      </div>
                    )}
                  </div>

                {isExpanded && (
                  <div>
                    {/* Add Expense Form */}
                    {expenseGroupId === group.id && showAddExpenseForm && (
                      <div style={{
                        backgroundColor: '#fff3cd',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        border: '1px solid #ffeeba'
                      }}>
                        <h6 style={{ margin: '0 0 0.75rem 0', color: '#856404' }}>
                          {editingExpenseId ? 'Edit Expense' : 'Add Expense'}
                        </h6>
                        <form onSubmit={handleSaveExpense}>
                          <div style={{ marginBottom: '0.75rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '13px', color: '#856404' }}>
                              Paid by
                            </label>
                            <select
                              value={expensePayerUid}
                              onChange={(e) => setExpensePayerUid(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ced4da',
                                borderRadius: '4px',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                              }}
                            >
                              {(group.members || []).map((member) => (
                                <option key={member.uid} value={member.uid}>
                                  {member.displayName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div style={{ marginBottom: '0.75rem' }}>
                            <input
                              type="text"
                              placeholder="Expense title"
                              value={expenseTitle}
                              onChange={(e) => setExpenseTitle(e.target.value)}
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
                          <div style={{ marginBottom: '0.75rem' }}>
                            <input
                              type="number"
                              placeholder="Amount (USD)"
                              step="0.01"
                              min="0"
                              value={expenseAmount}
                              onChange={(e) => setExpenseAmount(e.target.value)}
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
                          <button
                            type="submit"
                            disabled={loading}
                            style={{
                              padding: '0.75rem 1.5rem',
                              backgroundColor: '#fd7e14',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: loading ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                          >
                            {loading ? (editingExpenseId ? 'Saving...' : 'Adding...') : (editingExpenseId ? 'Save Changes' : 'Add Expense')}
                          </button>
                        </form>
                      </div>
                    )}

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
                                <div style={{ fontSize: '11px', marginTop: '0.25rem' }}>
                                  <span style={{ color: '#28a745' }}>Paid: ${totals[member.uid]?.paid.toFixed(2) || '0.00'}</span> • 
                                  <span style={{ color: Math.max(0, (totals[member.uid]?.owed || 0) - (totals[member.uid]?.paid || 0)) > 0 ? '#dc3545' : '#28a745' }}>
                                    Owes: ${Math.max(0, (totals[member.uid]?.owed || 0) - (totals[member.uid]?.paid || 0)).toFixed(2)}
                                  </span>
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

                    <div style={{
                      marginTop: '1rem',
                      backgroundColor: '#f8f9fa',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <h6 style={{ margin: '0 0 0.75rem 0', color: '#333' }}>Expenses</h6>
                      {group.expenses && group.expenses.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {group.expenses.map((expense) => (
                            <div key={expense.id} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.75rem',
                              backgroundColor: 'white',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>
                                  {expense.title}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  Paid by {expense.addedBy?.displayName || 'Unknown'}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ fontWeight: '600', color: '#333' }}>
                                  ${Number(expense.amount).toFixed(2)}
                                </div>
                                <button
                                  onClick={() => handleEditExpense(group.id, expense)}
                                  style={{
                                    padding: '0.4rem 0.8rem',
                                    backgroundColor: '#17a2b8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(group.id, expense.id)}
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
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>No expenses yet.</p>
                      )}
                    </div>

                    <div style={{
                      marginTop: '1rem',
                      backgroundColor: '#f1f3f5',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #dee2e6'
                    }}>
                      <h6 style={{ margin: '0 0 0.75rem 0', color: '#333' }}>Balances</h6>
                      {(() => {
                        const balances = computeGroupTotalBalances(group);

                        return balances.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {balances.map((balance, index) => (
                              <div key={`${balance.from.uid}-${balance.to.uid}-${index}`} style={{
                                padding: '0.75rem',
                                backgroundColor: 'white',
                                borderRadius: '6px',
                                border: '1px solid #dee2e6'
                              }}>
                                <div style={{ 
                                  color: '#333', 
                                  fontWeight: '600', 
                                  fontSize: '14px' 
                                }}>
                                  {balance.from.displayName} owes {balance.to.displayName} ${balance.amount.toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>All settled up!</p>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;

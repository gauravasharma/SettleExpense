import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, increment } from 'firebase/firestore';

export const groupsService = {
  // Create a new group
  createGroup: async (groupData, creatorId, creatorInfo) => {
    try {
      const groupsRef = collection(db, 'groups');
      const docRef = await addDoc(groupsRef, {
        name: groupData.name,
        description: groupData.description || '',
        createdBy: creatorId,
        creatorInfo: {
          uid: creatorId,
          displayName: creatorInfo.displayName,
          email: creatorInfo.email,
          photoURL: creatorInfo.photoURL
        },
        createdDate: new Date(),
        members: [
          {
            uid: creatorId,
            displayName: creatorInfo.displayName,
            email: creatorInfo.email,
            photoURL: creatorInfo.photoURL,
            joinedDate: new Date()
          }
        ],
        expenses: [],
        totalAmount: 0
      });
      return { id: docRef.id };
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  // Get user's groups (groups where user is a member)
  getUserGroups: (userId, callback) => {
    const groupsRef = collection(db, 'groups');

    // Since Firestore doesn't support nested field queries easily, we fetch all and filter
    const unsubscribe = onSnapshot(groupsRef, (snapshot) => {
      const groups = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(group => group.members.some(member => member.uid === userId));
      callback(groups);
    });

    return unsubscribe;
  },

  // Get single group by ID
  getGroup: async (groupId) => {
    try {
      const docSnap = await getDocs(query(collection(db, 'groups'), where('__name__', '==', groupId)));
      if (docSnap.empty) return null;
      return { id: docSnap.docs[0].id, ...docSnap.docs[0].data() };
    } catch (error) {
      console.error('Error getting group:', error);
      throw error;
    }
  },

  // Add member to group
  addMemberToGroup: async (groupId, memberData) => {
    try {
      await updateDoc(doc(db, 'groups', groupId), {
        members: arrayUnion({
          uid: memberData.uid,
          displayName: memberData.displayName,
          email: memberData.email,
          photoURL: memberData.photoURL,
          joinedDate: new Date()
        })
      });
    } catch (error) {
      console.error('Error adding member to group:', error);
      throw error;
    }
  },

  // Remove member from group
  removeMemberFromGroup: async (groupId, memberId) => {
    try {
      const groupSnap = await getDocs(query(collection(db, 'groups'), where('__name__', '==', groupId)));
      if (!groupSnap.empty) {
        const groupData = groupSnap.docs[0].data();
        const memberToRemove = groupData.members.find(m => m.uid === memberId);
        if (memberToRemove) {
          await updateDoc(doc(db, 'groups', groupId), {
            members: arrayRemove(memberToRemove)
          });
        }
      }
    } catch (error) {
      console.error('Error removing member from group:', error);
      throw error;
    }
  },

  // Add expense to group
  addExpenseToGroup: async (groupId, expenseData) => {
    try {
      const roundedAmount = Number(expenseData.amount.toFixed(2));
      await updateDoc(doc(db, 'groups', groupId), {
        expenses: arrayUnion({
          id: expenseData.id,
          title: expenseData.title,
          amount: roundedAmount,
          addedBy: expenseData.addedBy,
          createdDate: expenseData.createdDate || new Date()
        }),
        totalAmount: increment(roundedAmount)
      });
    } catch (error) {
      console.error('Error adding expense to group:', error);
      throw error;
    }
  },

  // Update an existing expense
  updateExpenseInGroup: async (groupId, expenseId, updatedExpenseData) => {
    try {
      const groupSnap = await getDocs(query(collection(db, 'groups'), where('__name__', '==', groupId)));
      if (groupSnap.empty) throw new Error('Group not found');
      const groupData = groupSnap.docs[0].data();
      const existingExpense = (groupData.expenses || []).find(exp => exp.id === expenseId);
      if (!existingExpense) throw new Error('Expense not found');

      const newAmount = Number(updatedExpenseData.amount.toFixed(2));
      const newExpenses = (groupData.expenses || []).map((expense) =>
        expense.id === expenseId
          ? {
              ...expense,
              title: updatedExpenseData.title,
              amount: newAmount,
              addedBy: updatedExpenseData.addedBy,
              createdDate: updatedExpenseData.createdDate || expense.createdDate
            }
          : expense
      );

      await updateDoc(doc(db, 'groups', groupId), {
        expenses: newExpenses,
        totalAmount: increment(newAmount - Number(existingExpense.amount))
      });
    } catch (error) {
      console.error('Error updating expense in group:', error);
      throw error;
    }
  },

  // Delete an expense from group
  deleteExpenseFromGroup: async (groupId, expenseId) => {
    try {
      const groupSnap = await getDocs(query(collection(db, 'groups'), where('__name__', '==', groupId)));
      if (groupSnap.empty) throw new Error('Group not found');
      const groupData = groupSnap.docs[0].data();
      const existingExpense = (groupData.expenses || []).find(exp => exp.id === expenseId);
      if (!existingExpense) throw new Error('Expense not found');

      const newExpenses = (groupData.expenses || []).filter(exp => exp.id !== expenseId);
      await updateDoc(doc(db, 'groups', groupId), {
        expenses: newExpenses,
        totalAmount: increment(-Number(existingExpense.amount))
      });
    } catch (error) {
      console.error('Error deleting expense from group:', error);
      throw error;
    }
  },

  // Check if user is member of group
  isUserMemberOfGroup: async (groupId, userId) => {
    try {
      const groupSnap = await getDocs(query(collection(db, 'groups'), where('__name__', '==', groupId)));
      if (groupSnap.empty) return false;
      const groupData = groupSnap.docs[0].data();
      return groupData.members.some(member => member.uid === userId);
    } catch (error) {
      console.error('Error checking group membership:', error);
      return false;
    }
  }
};
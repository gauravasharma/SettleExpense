import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';

// Helper function to get friend request between two users
const getFriendRequest = async (userId1, userId2) => {
  try {
    const friendsRef = collection(db, 'friends');
    const q1 = query(
      friendsRef,
      where('senderId', '==', userId1),
      where('receiverId', '==', userId2)
    );
    const q2 = query(
      friendsRef,
      where('senderId', '==', userId2),
      where('receiverId', '==', userId1)
    );

    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const allDocs = [...snapshot1.docs, ...snapshot2.docs];

    if (allDocs.length > 0) {
      return { id: allDocs[0].id, ...allDocs[0].data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting friend request:', error);
    throw error;
  }
};

export const friendsService = {
  // Search users by email
  searchUsers: async (email) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '>=', email), where('email', '<=', email + '\uf8ff'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  // Add friend directly (no request system)
  addFriend: async (currentUserId, friendId, friendData) => {
    try {
      // Check if already friends
      const existingFriendship = await getFriendRequest(currentUserId, friendId);
      if (existingFriendship && existingFriendship.status === 'accepted') {
        throw new Error('Already friends');
      }

      // If there's a pending request, accept it
      if (existingFriendship && existingFriendship.status === 'pending') {
        if (existingFriendship.senderId === currentUserId) {
          // Current user sent the request, accept it
          await updateDoc(doc(db, 'friends', existingFriendship.id), {
            status: 'accepted',
            acceptedAt: new Date()
          });
        } else {
          // Current user received the request, accept it
          await updateDoc(doc(db, 'friends', existingFriendship.id), {
            status: 'accepted',
            acceptedAt: new Date()
          });
        }
        return;
      }

      // Create new friendship directly
      const friendsRef = collection(db, 'friends');
      await addDoc(friendsRef, {
        senderId: currentUserId,
        receiverId: friendId,
        senderData: {
          uid: currentUserId,
          displayName: friendData.currentUserName,
          email: friendData.currentUserEmail,
          photoURL: friendData.currentUserPhoto
        },
        receiverData: {
          uid: friendId,
          displayName: friendData.friendName,
          email: friendData.friendEmail,
          photoURL: friendData.friendPhoto
        },
        status: 'accepted',
        createdAt: new Date(),
        acceptedAt: new Date()
      });
    } catch (error) {
      console.error('Error adding friend:', error);
      throw error;
    }
  },

  // Get friend request between two users
  getFriendRequest: getFriendRequest,

  // Get user's friends
  getFriends: (userId, callback) => {
    const friendsRef = collection(db, 'friends');
    const q = query(
      friendsRef,
      where('status', '==', 'accepted'),
      where('senderId', '==', userId)
    );
    const q2 = query(
      friendsRef,
      where('status', '==', 'accepted'),
      where('receiverId', '==', userId)
    );

    let sentFriends = [];
    let receivedFriends = [];

    const unsubscribe1 = onSnapshot(q, (snapshot) => {
      sentFriends = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback([...sentFriends, ...receivedFriends]);
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      receivedFriends = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback([...sentFriends, ...receivedFriends]);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  },
};
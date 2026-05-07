import User from "../models/UserModel.js";

const getCurrentUserId = (req) => req.user?.id || req.user?.userId || req.user?._id;

const sameId = (a, b) => a?.toString?.() === b?.toString?.();

const removeFriendRequest = (list = [], id) => list.filter((item) => !sameId(item, id));

const ensureFriendRequestLists = (user) => {
  if (!user.friendRequests) {
    user.friendRequests = { Sent: [], Received: [] };
  }

  if (!Array.isArray(user.friendRequests.Sent)) {
    user.friendRequests.Sent = [];
  }

  if (!Array.isArray(user.friendRequests.Received)) {
    user.friendRequests.Received = [];
  }
};

const ensureFriendList = (user) => {
  if (!Array.isArray(user.friends)) {
    user.friends = [];
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(currentUserId)
      .populate("friendRequests.Received", "username avatarUrl")
      .populate("friendRequests.Sent", "username avatarUrl")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      received: user.friendRequests?.Received || [],
      sent: user.friendRequests?.Sent || [],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch friend requests" });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const fromUserId = getCurrentUserId(req);
    const toUserId = req.params.id;

    if (!fromUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (sameId(fromUserId, toUserId)) {
      return res.status(400).json({ message: "You cannot friend yourself" });
    }

    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId),
      User.findById(toUserId),
    ]);

    if (!fromUser || !toUser) {
      return res.status(404).json({ message: "User not found" });
    }

    ensureFriendRequestLists(fromUser);
    ensureFriendRequestLists(toUser);
    ensureFriendList(fromUser);
    ensureFriendList(toUser);

    if (fromUser.friends?.some((friendId) => sameId(friendId, toUserId))) {
      return res.status(400).json({ message: "Already friends" });
    }

    const alreadySent = fromUser.friendRequests?.Sent?.some((id) => sameId(id, toUserId));
    const alreadyReceived = fromUser.friendRequests?.Received?.some((id) => sameId(id, toUserId));

    if (alreadySent || alreadyReceived) {
      return res.status(400).json({ message: "Friend request already exists" });
    }

    fromUser.friendRequests.Sent.push(toUser._id);
    toUser.friendRequests.Received.push(fromUser._id);

    await Promise.all([fromUser.save(), toUser.save()]);

    return res.json({ message: "Friend request sent" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to send friend request" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const otherUserId = req.params.id;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [currentUser, otherUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(otherUserId),
    ]);

    if (!currentUser || !otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    ensureFriendRequestLists(currentUser);
    ensureFriendRequestLists(otherUser);
    ensureFriendList(currentUser);
    ensureFriendList(otherUser);

    const requestExists = currentUser.friendRequests?.Received?.some((id) => sameId(id, otherUserId));
    if (!requestExists) {
      return res.status(400).json({ message: "Friend request not found" });
    }

    currentUser.friendRequests.Received = removeFriendRequest(currentUser.friendRequests.Received, otherUser._id);
    otherUser.friendRequests.Sent = removeFriendRequest(otherUser.friendRequests.Sent, currentUser._id);

    if (!currentUser.friends.some((friendId) => sameId(friendId, otherUser._id))) {
      currentUser.friends.push(otherUser._id);
    }

    if (!otherUser.friends.some((friendId) => sameId(friendId, currentUser._id))) {
      otherUser.friends.push(currentUser._id);
    }

    await Promise.all([currentUser.save(), otherUser.save()]);

    return res.json({ message: "Friend request accepted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to accept friend request" });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const otherUserId = req.params.id;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [currentUser, otherUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(otherUserId),
    ]);

    if (!currentUser || !otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    ensureFriendRequestLists(currentUser);
    ensureFriendRequestLists(otherUser);

    currentUser.friendRequests.Received = removeFriendRequest(currentUser.friendRequests.Received, otherUser._id);
    otherUser.friendRequests.Sent = removeFriendRequest(otherUser.friendRequests.Sent, currentUser._id);

    await Promise.all([currentUser.save(), otherUser.save()]);

    return res.json({ message: "Friend request rejected" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to reject friend request" });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const otherUserId = req.params.id;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [currentUser, otherUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(otherUserId),
    ]);

    if (!currentUser || !otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    ensureFriendList(currentUser);
    ensureFriendList(otherUser);

    currentUser.friends = currentUser.friends.filter((friendId) => !sameId(friendId, otherUser._id));
    otherUser.friends = otherUser.friends.filter((friendId) => !sameId(friendId, currentUser._id));

    await Promise.all([currentUser.save(), otherUser.save()]);

    return res.json({ message: "Friend removed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to remove friend" });
  }
};

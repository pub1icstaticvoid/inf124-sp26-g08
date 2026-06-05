let ioInstance = null;

const getUserRoom = (userId) => `user:${userId.toString()}`;

const setIo = (io) => {
  ioInstance = io;
};

const emitToUser = (userId, eventName, payload) => {
  if (!ioInstance || !userId || !eventName) {
    return;
  }

  ioInstance.to(getUserRoom(userId)).emit(eventName, payload);
};

const emitToUsers = (userIds, eventName, payloadOrFactory) => {
  const uniqueUserIds = Array.from(new Set((userIds ?? []).map((userId) => userId?.toString()).filter(Boolean)));

  uniqueUserIds.forEach((userId) => {
    const payload =
      typeof payloadOrFactory === "function" ? payloadOrFactory(userId) : payloadOrFactory;

    emitToUser(userId, eventName, payload);
  });
};

module.exports = {
  emitToUser,
  emitToUsers,
  getUserRoom,
  setIo,
};

function getRoomKey(category, conversationId) {
  return `${category}:${conversationId}`;
}

module.exports = { getRoomKey };

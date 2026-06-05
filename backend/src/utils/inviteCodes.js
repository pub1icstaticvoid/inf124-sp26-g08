async function generateUniqueInviteCode(Model, prefix) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    const inviteCode = `${prefix}-${randomPart}`;
    const existing = await Model.exists({ inviteCode });

    if (!existing) {
      return inviteCode;
    }
  }

  throw new Error("Could not generate a unique invite code.");
}

module.exports = { generateUniqueInviteCode };

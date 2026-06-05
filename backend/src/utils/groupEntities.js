const { Types } = require("mongoose");
const User = require("../models/User");

const toIdString = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (value._id) {
    return value._id.toString();
  }

  return value.toString();
};

const getManagerIds = (entity) => {
  const managerIds = (entity.managers ?? []).map(toIdString).filter(Boolean);

  if (managerIds.length > 0) {
    return Array.from(new Set(managerIds));
  }

  const ownerId = toIdString(entity.ownerId);
  return ownerId ? [ownerId] : [];
};

const hasMember = (entity, userId) =>
  (entity.members ?? []).some((member) => toIdString(member) === userId.toString());

const isManager = (entity, userId) => getManagerIds(entity).includes(userId.toString());

const serializeGroupSummary = (entity, currentUserId) => ({
  id: entity._id.toString(),
  name: entity.name,
  description: entity.description,
  inviteCode: entity.inviteCode,
  lastMsg: entity.description || "No messages yet",
  memberCount: entity.members?.length ?? 0,
  isManager: currentUserId ? isManager(entity, currentUserId) : false,
});

const serializeGroupSearchResult = (entity) => ({
  id: entity._id.toString(),
  name: entity.name,
  description: entity.description,
  memberCount: entity.members?.length ?? 0,
});

const serializeGroupDetail = (entity, currentUserId) => {
  const managerIdSet = new Set(getManagerIds(entity));
  const ownerId = toIdString(entity.ownerId);

  return {
    id: entity._id.toString(),
    name: entity.name,
    description: entity.description,
    inviteCode: entity.inviteCode,
    ownerId,
    isManager: isManager(entity, currentUserId),
    managers: Array.from(managerIdSet),
    members: (entity.members ?? []).map((member) => {
      const memberId = toIdString(member);

      return {
        id: memberId,
        name: member.username ?? "Unknown User",
        email: member.email ?? "",
        isManager: managerIdSet.has(memberId),
      };
    }),
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
};

const ensureValidUserId = (userId) => Types.ObjectId.isValid(userId);

async function findUserByEmail(email) {
  return User.findOne({ email: email.trim().toLowerCase() });
}

module.exports = {
  ensureValidUserId,
  findUserByEmail,
  getManagerIds,
  hasMember,
  isManager,
  serializeGroupDetail,
  serializeGroupSearchResult,
  serializeGroupSummary,
  toIdString,
};

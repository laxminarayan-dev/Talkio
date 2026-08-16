const express = require("express");
const route = express.Router();
const cache = require("../onStart/cache");
const Message = require("../models/Message");
const ConversationSetting = require("../models/ConversationSetting");
const mongoose = require("mongoose");

const buildParticipantsKey = (userA, userB) =>
  [String(userA), String(userB)].sort().join("_");

route.post("/all", async (req, res) => {
  const limit = 50;
  const { sender, receiver, page } = req.body;
  const olderMessages = await Message.find({
    $or: [
      { sender: sender, receiver: receiver },
      { sender: receiver, receiver: sender },
    ],
  })
    .sort({ createdAt: -1 })
    .skip(page * limit)
    .limit(limit);

  res.send(olderMessages);
});

route.post("/add", async (req, res) => {
  try {
    let {
      sender,
      receiver,
      senderName,
      senderUsername,
      receiverName,
      receiverUsername,
      replyMessage,
      replyMessageSender,
      replyMessageSenderName,
      content,
    } = req.body;

    if (!sender || !receiver || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!senderName || !senderUsername) {
      const allUsers = cache.get("allUsers") || [];
      const senderData = allUsers.find(
        (u) => u._id.toString() === sender.toString(),
      );

      if (senderData) {
        senderName = senderData.name || "Unknown";
        senderUsername = senderData.username || "unknown";
      }
    }

    const message = new Message({
      sender,
      senderName,
      senderUsername,
      receiver,
      receiverName,
      receiverUsername,
      content,
      replyMessage: replyMessage,
      replyMessageSender: replyMessageSender,
      replyMessageSenderName: replyMessageSenderName,
      type: "text",
    });

    const savedMessage = await message.save();
    res.status(201).json(savedMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

route.post("/lastConversation", async (req, res) => {
  const { userId } = req.body;
  const messages = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: new mongoose.Types.ObjectId(userId) },
          { receiver: new mongoose.Types.ObjectId(userId) },
        ],
      },
    },
    {
      $addFields: {
        otherUser: {
          $cond: [
            { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
            "$receiver",
            "$sender",
          ],
        },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$otherUser",
        lastMessage: { $first: "$$ROOT" },
      },
    },
    {
      $project: {
        _id: "$lastMessage._id",
        withUser: "$_id",
        message: "$lastMessage.content",
        senderId: "$lastMessage.sender",
        senderName: "$lastMessage.senderName",
        receiverId: "$lastMessage.receiver",
        receiverName: "$lastMessage.receiverName",
        isSeen: "$lastMessage.isSeen",
        reaction: "$lastMessage.reaction",
        createdAt: "$lastMessage.createdAt",
        isOnline: { $literal: false },
      },
    },
  ]);

  const messagesWithOnlineStatus = messages.map((msg) => {
    const withUserId = msg.withUser.toString();
    const userInfo = cache.get(`user_${withUserId}`);
    return {
      ...msg,
      isOnline: userInfo?.isOnline ?? false,
    };
  });

  res.status(200).json(messagesWithOnlineStatus);
});

route.post("/allConversations", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const objectId = new mongoose.Types.ObjectId(userId);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: objectId }, { receiver: objectId }],
        },
      },
      {
        $addFields: {
          withUser: {
            $cond: [{ $eq: ["$sender", objectId] }, "$receiver", "$sender"],
          },
          otherName: {
            $cond: [{ $eq: ["$sender", objectId] }, "$receiverName", "$senderName"],
          },
          otherUsername: {
            $cond: [{ $eq: ["$sender", objectId] }, "$receiverUsername", "$senderUsername"],
          },
        },
      },
      {
        $group: {
          _id: "$withUser",
          messages: { $push: "$$ROOT" },
          lastMessageAt: { $max: "$createdAt" },
          otherName: { $first: "$otherName" },
          otherUsername: { $first: "$otherUsername" },
        },
      },
      {
        $project: {
          _id: 0,
          withUser: "$_id",
          otherName: 1,
          otherUsername: 1,
          lastMessageAt: 1,
          messages: {
            $slice: [
              {
                $filter: {
                  input: "$messages",
                  as: "msg",
                  cond: { $ne: ["$$msg.content", null] },
                },
              },
              -60,
            ],
          },
        },
      },
      {
        $addFields: {
          messages: {
            $map: {
              input: "$messages",
              as: "msg",
              in: {
                _id: "$$msg._id",
                sender: "$$msg.sender",
                senderName: "$$msg.senderName",
                senderUsername: "$$msg.senderUsername",
                receiver: "$$msg.receiver",
                receiverName: "$$msg.receiverName",
                receiverUsername: "$$msg.receiverUsername",
                content: "$$msg.content",
                isSeen: "$$msg.isSeen",
                seenAt: "$$msg.seenAt",
                type: "$$msg.type",
                reaction: "$$msg.reaction",
                replyMessage: "$$msg.replyMessage",
                replyMessageSender: "$$msg.replyMessageSender",
                replyMessageSenderName: "$$msg.replyMessageSenderName",
                createdAt: "$$msg.createdAt",
                updatedAt: "$$msg.updatedAt",
              },
            },
          },
        },
      },
      {
        $addFields: {
          lastMessage: { $arrayElemAt: ["$messages", -1] },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    if (conversations.length === 0) {
      return res.status(200).json([]);
    }

    const messagesWithOnlineStatus = conversations.map((conv) => {
      const userInfo = cache.get(`user_${conv.withUser}`);
      return {
        ...conv,
        isOnline: userInfo?.isOnline ?? false,
      };
    });

    res.status(200).json(messagesWithOnlineStatus);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Server error" });
  }
});

route.post("/toggle-reaction", async (req, res) => {
  try {
    const { messageId, userId, reaction } = req.body;

    if (!messageId || !userId) {
      return res.status(400).json({ message: "messageId and userId are required" });
    }

    const normalizedReaction = reaction === "❤️" ? "❤️" : null;
    const updatedMessage = await Message.findOneAndUpdate(
      { _id: messageId, $or: [{ sender: userId }, { receiver: userId }] },
      { $set: { reaction: normalizedReaction } },
      { new: true },
    );

    if (!updatedMessage) {
      return res.status(404).json({ message: "Message not found" });
    }

    return res.status(200).json(updatedMessage);
  } catch (error) {
    console.error("Error toggling reaction:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

route.post("/conversation-background/get", async (req, res) => {
  try {
    const { userId, withUserId } = req.body;
    if (!userId || !withUserId) {
      return res.status(400).json({ message: "userId and withUserId are required" });
    }

    const participantsKey = buildParticipantsKey(userId, withUserId);
    const setting = await ConversationSetting.findOne({ participantsKey }).lean();

    return res.status(200).json({
      backgroundUrl: setting?.backgroundUrl || "",
    });
  } catch (error) {
    console.error("Error fetching conversation background:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = route;

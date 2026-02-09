const mongoose = require("mongoose");
const { type } = require("node:os");
const {Schema, Model} = mongoose;
const MessageSchema = new Schema(
  {
    text: { type: String },
    file: { type: String },
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    recipient: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);
const MessageModel = model("Message", MessageSchema);
module.exports = MessageModel;
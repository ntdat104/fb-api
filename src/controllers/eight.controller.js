const dotenv = require("dotenv");
dotenv.config();
var ObjectId = require("mongoose").Types.ObjectId;
const User = require("../models/user.model.js");
const Chat = require("../models/chat.model.js");
const Notification = require("../models/notification.model");

const sameFriendsHelper = require("../helpers/sameFriends.helper.js");

const statusCode = require("../constants/statusCode.constant.js");
const statusMessage = require("../constants/statusMessage.constant.js");
const commonConstant = require("../constants/common.constant.js");

const setAcceptFriend = async (req, res) => {
  const { user_id, is_accept } = req.query;
  const { _id } = req.userDataPass;
  try {
    if (!user_id || !ObjectId.isValid(user_id) || user_id == _id) {
      console.log("lỗi user_id không hợp lệ");
      throw Error("params");
    }
    // tim friend muốn accept hoặc unaccept
    var friendData = await User.findById(user_id);
    if (friendData && friendData.friends && friendData.friends.includes(_id)) {
      console.log("Đã kết bạn");
      throw Error("notexist");
    }

    if (!friendData || friendData.is_blocked) {
      console.log("friend bị block");
      throw Error("notexist");
    }
    if (friendData && friendData.blockedIds.includes(_id)) {
      console.log("friend da block user");
      throw Error("action");
    }

    if (is_accept == 0) {
      var friendData = await User.findByIdAndUpdate(user_id, {
        $pull: {
          sendRequestedFriends: {
            receiver: _id,
          },
        },
      });
      await User.findByIdAndUpdate(_id, {
        $pull: {
          requestedFriends: {
            author: user_id,
          },
        },
      });
     
      return res.status(200).json({
        code: statusCode.OK,
        message: statusMessage.OK,
      });
    }
    if (is_accept == 1) {
      // kiểm tra xem đã kết bạn chưa
      
      // tìm user và xoá requested friend có author == user_id
      var userData = await User.findByIdAndUpdate(_id, {
        $pull: {
          requestedFriends: {
            author: user_id,
          },
        },
        $push: {
          friends: user_id,
        },
      });
      res.status(200).json({
        code: statusCode.OK,
        message: statusMessage.OK,
      });
     
      var newNotification =await new Notification({
        type: "trang user",
        object_id: _id,
        title: userData.username+" đã chấp nhận lời mời kết bạn",
        created: Date.now(),
        avatar: userData.avatar,
        group: "1",
        userData: _id,
      }).save();
      var chatData = await new Chat({
        partner_id: [user_id, _id],
        is_blocked: null,
        created: Date.now(),
      }).save();
      var friendData = await User.findByIdAndUpdate(user_id, {
        $pull: {
          sendRequestedFriends: {
            receiver: _id,
          },
        },
        $push: {
          conversations: chatData._id,
          friends: _id,
          notifications: {id:newNotification._id, read: "0"}
        },
      });

      
      // partnerData.conversations.push(chatData._id);
      // await partnerData.save();
      if (_id != user_id) {
        await User.findByIdAndUpdate(_id, {
          $push: {
            conversations: chatData._id,
          },
        });
      }


    }




  } catch (error) {
    console.log(error)
    if (error.message == "params") {
      return res.status(200).json({
        code: statusCode.PARAMETER_VALUE_IS_INVALID,
        message: statusMessage.PARAMETER_VALUE_IS_INVALID,
      });
    } else if (error.message == "notexist") {
      return res.status(200).json({
        code: statusCode.ACTION_HAS_BEEN_DONE_PREVIOUSLY_BY_THIS_USER,
        message: statusMessage.ACTION_HAS_BEEN_DONE_PREVIOUSLY_BY_THIS_USER,
      });
    } else if (error.message == "action") {
      return res.status(200).json({
        code: statusCode.ACTION_HAS_BEEN_DONE_PREVIOUSLY_BY_THIS_USER,
        message: statusMessage.ACTION_HAS_BEEN_DONE_PREVIOUSLY_BY_THIS_USER,
      });
    } else {
      return res.status(200).json({
        code: statusCode.UNKNOWN_ERROR,
        message: statusMessage.UNKNOWN_ERROR,
      });
    }
  }
};

const getListSuggestedFriends = async (req, res) => {
  var {  index, count } = req.query;
  const { _id } = req.userDataPass;
  var {userDataPass}= req;
  try {
    index = index ? index : 0;
    count = count ? count : 20;
    var userData = userDataPass;
    var requestedFriends = userData.requestedFriends.map(e=>{
      return e.author;
    });
    var sendRequestedFriends = userData.sendRequestedFriends.map(e=>{
      return e.receiver;
    })
    var otherUsersData = await User.find({});
    var result = await Promise.all(
      otherUsersData.map((element) => {
        // console.log()
        if (
          userData.friends.includes(element._id) ||
          _id.toString()==element._id.toString() ||
          userData.blockedIds.includes(element._id) ||
          element.blockedIds.includes(_id)||
          userData.not_suggest.includes(element._id)||
          requestedFriends.includes(element._id)||
          sendRequestedFriends.includes(element._id)
        ) {
          return -1;
        }
        return sameFriendsHelper.sameFriends(userData.friends, element._id);
      })
    );
    result = result.filter((x) => x != -1);
    return res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
      data: {
        list_users: result.slice(Number(index),Number(index)+Number(count) ),
      },
    });
  } catch (error) {
    console.log(error);
    if (error.message == "params") {
      return res.status(500).json({
        code: statusCode.PARAMETER_VALUE_IS_INVALID,
        message: statusMessage.PARAMETER_VALUE_IS_INVALID,
      });
    } else {
      return res.status(500).json({
        code: statusCode.UNKNOWN_ERROR,
        message: statusMessage.UNKNOWN_ERROR,
      });
    }
  }
};

const setRequestFriend = async (req, res) => {
  const { token, user_id } = req.query;
  const { _id } = req.userDataPass;
  try {
    if (!user_id || _id == user_id || !ObjectId.isValid(user_id)) {
      console.log("check ");
      throw Error("params");
    }
    // tìm dữ liệu user
    var userData = req.userDataPass;
    // kiểm tra receiver có gửi lời mời đến user không(có thì add bạn luôn)
    var receiverRequested = -1;
    userData.requestedFriends.map((element, index) => {
      if (element && element.author == user_id) {
        receiverRequested = index;
        return;
      }
    });
    if (receiverRequested != -1) {
      userData.requestedFriends.splice(receiverRequested);
      userData.friends.push(user_id);
      var receiverData = await User.findByIdAndUpdate(user_id, {
        $pull: {
          sendRequestedFriends: {
            receiver: _id,
          },
        },
        $push: {
          friends: _id,
        },
      });
      if (
        !receiverData ||
        !userData ||
        receiverData.is_blocked ||
        userData.is_blocked
      ) {
        console.log("không tìm thấy hoặc đã bị block");
        throw Error("notfound");
      }
      await userData.save();

      return res.status(200).json({
        code: statusCode.OK,
        message: statusMessage.OK,
      });
    }

    // kiểm tra lời mời kết bạn đã tốn tại chưa(đã gửi đi chưa)
    var requestExisted = -1;
    userData.sendRequestedFriends.map((element, index) => {
      if (element && element.receiver == user_id) {
        requestExisted = index;
        return;
      }
    });
    if (requestExisted != -1) {
      userData.sendRequestedFriends.splice(requestExisted);
      var receiverData = await User.findByIdAndUpdate(user_id, {
        $pull: {
          requestedFriends: {
            author: _id,
          },
        },
      });
      if (
        !receiverData ||
        !userData ||
        receiverData.is_blocked ||
        userData.is_blocked
      ) {
        console.log("không tìm thấy hoặc đã bị block");
        throw Error("notfound");
      }
      await userData.save();

      return res.status(200).json({
        code: statusCode.OK,
        message: statusMessage.OK,
      });
    }
    if (userData && userData.friends.length > commonConstant.LIMIT_FRIENDS) {
      console.log("Đã đạt số lượng bạn tối đa");
      throw Error("9994");
    }
    userData.sendRequestedFriends.push({
      receiver: user_id,
      created: Date.now(),
    });
    var receiverData = await User.findByIdAndUpdate(user_id, {
      $push: {
        requestedFriends: {
          author: _id,
          created: Date.now(),
        },
      },
    });
    if (
      !receiverData ||
      !userData ||
      receiverData.is_blocked ||
      userData.is_blocked
    ) {
      console.log("không tìm thấy hoặc đã bị block");
      throw Error("notfound");
    }
    await userData.save();

    return res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
    });
  } catch (error) {
    console.log(error);
    if (error.message == "params") {
      return res.status(500).json({
        code: statusCode.PARAMETER_VALUE_IS_INVALID,
        message: statusMessage.PARAMETER_VALUE_IS_INVALID,
      });
    } else if (error.message == "9994") {
      return res.status(500).json({
        code: statusCode.NO_DATA_OR_END_OF_LIST_DATA,
        message: statusMessage.NO_DATA_OR_END_OF_LIST_DATA,
      });
    } else if (error.message == "notfound") {
      return res.status(500).json({
        code: statusCode.ACTION_HAS_BEEN_DONE_PREVIOUSLY_BY_THIS_USER,
        message: statusMessage.ACTION_HAS_BEEN_DONE_PREVIOUSLY_BY_THIS_USER,
      });
    } else {
      return res.status(500).json({
        code: statusCode.UNKNOWN_ERROR,
        message: statusMessage.UNKNOWN_ERROR,
      });
    }
  }
};

const getListBlocks = async (req, res) => {
  const { token, index, count } = req.query;
  const { _id } = req.userDataPass;
  try {
    if (index < 0 || count < 0) {
      throw Error("params");
    }
    var userData = await User.findById(_id).populate({
      path: "blockedIds",
      select: "username avatar",
    });
    var a = await Promise.all(userData.blockedIds.map(async element=>{
      var result = await User.findById(element._id);
      if (result.is_blocked) {
        return false;
      }
      return element;
    }))
    return res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
      data: a.filter(x=>x!=false),
    });
  } catch (error) {
    if (error.message == "params") {
      return res.status(500).json({
        code: statusCode.PARAMETER_VALUE_IS_INVALID,
        message: statusMessage.PARAMETER_VALUE_IS_INVALID,
      });
    } else {
      return res.status(500).json({
        code: statusCode.UNKNOWN_ERROR,
        message: statusMessage.UNKNOWN_ERROR,
      });
    }
  }
};

module.exports = {
  setAcceptFriend,
  getListSuggestedFriends,
  setRequestFriend,
  getListBlocks,
};

const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");
const formidable = require("formidable");
const { getVideoDurationInSeconds } = require("get-video-duration");
const mongoose = require("mongoose");

const Post = require("../models/post.model.js");
const User = require("../models/user.model.js");
const ReportPost = require("../models/report.post.model.js");
const Chat = require("../models/chat.model");

const sameFriendsHelper = require("../helpers/sameFriends.helper.js");

const statusCode = require("../constants/statusCode.constant.js");
const statusMessage = require("../constants/statusMessage.constant.js");

const setConversation = async (req, res) => {
  const { partner_id } = req.query;
  const { _id } = req.userDataPass;
  try {
    var partnerData = await User.findById(partner_id);
    var userData = req.userDataPass;
    if (
      !partnerData ||
      partnerData.is_blocked ||
      partnerData.blockedIds.includes(_id)||
      userData.blockedIds.includes(partner_id)
    ) {
      throw Error("blocked or not existed");
    }
    
    var chatData = await new Chat({
      partner_id: [partner_id, _id],
      is_blocked: null,
      created: Date.now(),
    }).save();
    partnerData.conversations.push(chatData._id);
    await partnerData.save();
    if (_id != partner_id) {
      await User.findByIdAndUpdate(_id, {
        $push: {
          conversations: chatData._id,
        },
      });
    }
    return res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
    });
  } catch (error) {
    return res.status(500).json({
      code: statusCode.UNKNOWN_ERROR,
      message: statusMessage.UNKNOWN_ERROR,
    });
  }
};

const unfriend = async (req, res)=>{
  const {user_id}= req.query;
  const {_id}= req.userDataPass;
  var {userDataPass} = req;
  try {
    await User.findByIdAndUpdate(_id,{
      $pull:{
        friends: user_id
      }
    });
    await User.findByIdAndUpdate(user_id,{
      $pull:{
        friends: _id
      }
    })
    res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: statusCode.UNKNOWN_ERROR,
      message: statusMessage.UNKNOWN_ERROR,
    });
  }


}

const notSuggest = async (req, res)=>{
  const {user_id}= req.query;
  const {_id}= req.userDataPass;
  var {userDataPass} = req;
  try {
    await User.findByIdAndUpdate(_id,{
      $push:{
        not_suggest: user_id
      }
    });
    res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: statusCode.UNKNOWN_ERROR,
      message: statusMessage.UNKNOWN_ERROR,
    });
  }


}

const searchUser = async (req, res) => {
  var { keyword, index, count } = req.query;
  const { _id } = req.userDataPass;
  // check params
  try {
    index = index ? index : 0;
    count = count ? count : 20;
      if (!keyword) {
          throw Error("params");
      }
      // var savedSearchList = req.userDataPass.
      
      // mo ta
      // 
      // Ưu tiên đứng đầu danh sách là các kết quả có chứa đủ các từ và đúng thứ tự
      // var postData1 =await Post.find({ described: new RegExp(keyword, "i") });
      // Tiếp theo là các kết quả đủ từ nhưng không đúng thứ tự
      var userData1 =await User.find({$or: [
          { username: new RegExp(keyword, "i") },
          { username: new RegExp(keyword.replace(" ", "|"), "i") }
      ]}).select("username avatar");
      res.status(200).json({
          code: statusCode.OK,
          message: statusMessage.OK,
          data: userData1
      })
      // await User.findByIdAndUpdate(_id,{
      //     $pull:{
      //         savedSearch: {
      //             keyword: keyword,
      //         }
      //     }
      // })
      // await User.findByIdAndUpdate(_id,{
      //     $push:{
      //         savedSearch: {
      //             keyword: keyword,
      //             created: Date.now(),
      //         }
      //     }
      // })
  } catch (error) {
      if (error.message == "params") {
          return res.status(500).json({
              code: statusCode.PARAMETER_VALUE_IS_INVALID,
              message: statusMessage.PARAMETER_VALUE_IS_INVALID
          })
      } else if (error.message == "nodata") {
          return res.status(500).json({
              code: statusCode.NO_DATA_OR_END_OF_LIST_DATA,
              message: statusMessage.NO_DATA_OR_END_OF_LIST_DATA
          })
      } else {
          return res.status(500).json({
              code: statusCode.UNKNOWN_ERROR,
              message: statusMessage.UNKNOWN_ERROR
          })
      }
  }
}


module.exports = {
  setConversation,
  unfriend,
  notSuggest,
  searchUser
};

const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");
const formidable = require("formidable");
const { getVideoDurationInSeconds } = require("get-video-duration");
const mongoose = require("mongoose");

const Post = require("../models/post.model.js");
const User = require("../models/user.model.js");
const ReportPost = require("../models/report.post.model.js");
const Comment = require("../models/comment.model");

const sameFriendsHelper = require("../helpers/sameFriends.helper.js");

const formidableHelper = require("../helpers/formidable.helper.js");

const statusCode = require("../constants/statusCode.constant.js");
const statusMessage = require("../constants/statusMessage.constant.js");

const setUserInfo = async (req, res) => {
  const {
    username,
    description,
    address,
    city,
    country,
    birthday,
    link,
    songtai,
    dentu,
    hoctai,
    nghenghiep,
    sothich
  } = req.query;
  const {_id}= req.userDataPass;
  try {
    var result = await formidableHelper.parseInfo(req);
    var userData = req.userDataPass;
    userData.avatar = result.avatar?result.avatar.url:userData.avatar;
    userData.cover_image = result.cover_image?result.cover_image.url:userData.cover_image;
    userData.description = description?description:userData.description;
    userData.username = username?username:userData.username;
    userData.address = address?address:userData.address;
    userData.city = city?city:userData.city;
    userData.country = country?country:userData.country;
    userData.link = link?link:userData.link;
    userData.nghenghiep = nghenghiep?nghenghiep:userData.nghenghiep;
    userData.hoctai = hoctai?hoctai:userData.hoctai;
    userData.songtai = songtai?songtai:userData.songtai;
    userData.birthday = birthday?birthday:userData.birthday;
    userData.dentu = dentu?dentu:userData.dentu;
    userData.sothich = sothich?sothich:userData.sothich;
    await userData.save();
    return res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
      data: {
        username: username,
        avatar: result.avatar?result.avatar.url:"",
        cover_image: result.cover_image?result.cover_image.url:"",
        country: country,
        city: city,
        link: link,
        description: description,
        nghenghiep: nghenghiep,
        hoctai: hoctai,
        sothich: sothich,
        songtai: songtai,
        dentu: dentu
      }
    })
  } catch (error) {
    console.log(error)
    if (error.message=="params") {
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

const getUserInfo = async (req, res) => {
  const { token, user_id } = req.query;
  const { _id } = req.userDataPass;
  try {
    // nếu tự xem thông tin của mình
    if (user_id == _id || !user_id) {
      console.log("trùng với id của user");
      var userData = await User.findById(_id).populate({
        path: "friends",
        select: "username avatar"
      });
      var listing = userData.friends.length;
      userData.listing = listing;
      return res.status(200).json({
        code: statusCode.OK,
        message: statusMessage.OK,
        data: userData,
      });
    }
    // nếu xem thông tin của người khác
    try{
      var otherUserData = await User.findById(user_id).select(
          "username created description avatar cover_image link address city country friends blockedIds is_blocked birthday"
      ).populate({
        path: "friends",
        select: "username avatar"
      });
    }catch (e) {
      return res.status(500).json({
        code: statusCode.USER_IS_NOT_VALIDATED,
        message: statusMessage.USER_IS_NOT_VALIDATED,
      });
    }
    if (
      !otherUserData ||
      otherUserData.is_blocked ||
      otherUserData.blockedIds.includes(_id)
    ) {
      throw Error("notfound");
    }
    is_friend = req.userDataPass.friends.find(e=>e==user_id)?"1":"0";
    sendRequested = req.userDataPass.sendRequestedFriends.find(e=>e.receiver==user_id)?"1":"0";
    requested = req.userDataPass.requestedFriends.find(e=>e.author==user_id)?"1":"0";
    otherUserData.listing = otherUserData.friends.length;
    var userData = req.userDataPass;
    var result = await sameFriendsHelper.sameFriends(userData.friends, user_id);
    delete otherUserData.blockedIds;
    return res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
      data: otherUserData,
      sameFriends: result.same_friends,
      is_friend: is_friend,
      sendRequested: sendRequested,
      requested:requested
      
    });
  } catch (error) {
    console.log(error)
    if (error.message == "notfound") {
      return res.status(500).json({
        code: statusCode.USER_IS_NOT_VALIDATED,
        message: statusMessage.USER_IS_NOT_VALIDATED,
      });
    } else {
      return res.status(500).json({
        code: statusCode.UNKNOWN_ERROR,
        message: statusMessage.UNKNOWN_ERROR,
      });
    }
  }
};

const getNotification = async (req, res) => {
  var { index, count } = req.query;
  const {_id}= req.userDataPass;
  if(!index || !count){
    return res.status(200).json({
      code: statusCode.PARAMETER_IS_NOT_ENOUGHT,
      message: statusMessage.PARAMETER_IS_NOT_ENOUGHT,
    });
  }
  try{
    index = parseInt(index);
    count = parseInt(count);
  }catch (e) {
    return res.status(200).json({
      code: statusCode.PARAMETER_TYPE_IS_INVALID,
      message: statusMessage.PARAMETER_TYPE_IS_INVALID,
    });
  }
  if(isNaN(index) || isNaN(count)){
    return res.status(200).json({
      code: statusCode.PARAMETER_TYPE_IS_INVALID,
      message: statusMessage.PARAMETER_TYPE_IS_INVALID,
    });
  }
  if(index < 0 || count < 0){
    return res.status(200).json({
      code: statusCode.PARAMETER_VALUE_IS_INVALID,
      message: statusMessage.PARAMETER_VALUE_IS_INVALID,
    });
  }
  try {
    index=index?index:0; 
    count=count?count:20;
    
    var userData = await User.findById(_id).populate({
      path: "notifications.id",
      
      // select: "username avatar",
    });
    return res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
      data: userData.notifications.sort((a,b)=>b.id.created-a.id.created).slice(Number(index),Number(index)+Number(count)),
    });
  } catch (error) {
    return res.status(500).json({
      code: statusCode.UNKNOWN_ERROR,
      message: statusMessage.UNKNOWN_ERROR,
    });
  }
};

const setReadNotification = async (req, res) => {
  const { notification_id } = req.query;
  const {_id}= req.userDataPass;
  try {
    var userData = req.userDataPass;
    userData.notifications.map(e=>{
      if (e.id==notification_id) {
        e.read="1";
      }
    });
    await userData.save()
    return res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
      data: userData.notifications,
    });
  } catch (error) {
    return res.status(500).json({
      code: statusCode.UNKNOWN_ERROR,
      message: statusMessage.UNKNOWN_ERROR,
    });
  }
};

module.exports = {
  setUserInfo,
  getUserInfo,
  getNotification,
  setReadNotification
};

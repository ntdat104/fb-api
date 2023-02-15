const dotenv = require("dotenv");

const Post = require("../models/post.model.js");
const User = require("../models/user.model.js");

const sameFriendsHelper = require("../helpers/sameFriends.helper.js");

const statusCode = require("../constants/statusCode.constant.js");
const statusMessage = require("../constants/statusMessage.constant.js");

const getRequestedFriends = async (req, res) => {
  var { index, count } = req.query;
  const { _id } = req.userDataPass;
  try {
    index = index ? index : 0;
    count = count ? count : 20;
    var userData = await User.findById(_id).populate({
      path: "requestedFriends.author",
      // select: "author._id author.username author.avatar",
    });
    //.limit(count).skip(index);
    // console.log(userData);
    Promise.all(
      userData.requestedFriends.map((element) => {
        return sameFriendsHelper.sameFriends(
          userData.friends,
          element.author._id
        );
      })
    )
      .then((result) => {
        // console.log(result);
        // console.log(userData.requestedFriends)
        var a = userData.requestedFriends.map((value, index) => {
          // let {_id, username, avatar} = value._doc.author;
          // console.log(value.author._id)
          return {
            _id: value.author._id || null,
            avatar: value.author.avatar || null,
            username: value.author.username || null,
            same_friend: result[index],
          };
        });
        // console.log(a)
        return res.status(200).json({
          code: statusCode.OK,
          message: statusMessage.OK,
          data: {
            request: a,
            total: userData.requestedFriends.length,
          },
        });
      })
      .catch((e) => {
        return res.status(200).json({
          code: statusCode.UNKNOWN_ERROR,
          message: statusMessage.UNKNOWN_ERROR,
        });
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: statusCode.UNKNOWN_ERROR,
      message: statusMessage.UNKNOWN_ERROR,
    });
  }
};

const getListVideos = async (req, res) => {
  var {
    token,
    user_id,
    in_campaign,
    campaign_id,
    latitude,
    longtitude,
    last_id,
    index,
    count,
  } = req.query;
  const {_id}= req.userDataPass;
  index=index||0;
  count=count||20;
  try {
    var postData = await Post.find({
      video: {
        $ne: null,
      },
    }).populate({
      path: "author",
      select: "username avatar"
    }).sort({created: -1});
    postData.map(e=>{
      if(e.like_list){

        e.is_liked=e.like_list.includes(_id);
      }
    })
    var userData = req.userDataPass;
    // user block athor
    var b = await Promise.all(postData.map(async (element, index)=>{
      var result = await User.findById(element.author._id);
      if (result.blockedIds.includes(_id)||userData.blockedIds.includes(element.author._id)) {
        console.log(false)
        return false;
      }
      console.log(true)
      return element;
    }))
    return res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
      data: b.filter(x=>x!=false).slice(Number(index), Number(index)+Number(count)),
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: statusCode.UNKNOWN_ERROR,
      message: statusMessage.UNKNOWN_ERROR,
    });
  }
};

const getUserFriends = async (req, res) => {
  var { index, count, user_id } = req.query;
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
    index = index ? index : 0;
    count = count ? count : 20;
    if(user_id){
      var userData = await User.findById(user_id);
      var resultSameFriend =await Promise.all(
        userData.friends.map((element) => {
          return sameFriendsHelper.sameFriends(
            userData.friends,
            element
          );
        })
      );
      userData = await User.findById(user_id).populate({
        path: "friends",
        select: "avatar username"
      });
      var a= userData.friends.map((value, index)=>{
        return{
          ...value._doc,
          same_friends: resultSameFriend[index],
        }
      })
      return res.status(200).json({
        code: statusCode.OK,
        message: statusMessage.OK,
        data: {
          friends: a,
          total: userData.friends.length,
        },
      });
    }
    var userData = req.userDataPass;
    var resultSameFriend =await Promise.all(
      userData.friends.map((element) => {
        return sameFriendsHelper.sameFriends(
          userData.friends,
          element
        );
      })
    );
    // console.log(resultSameFriend)
    userData = await User.findById(_id).populate({
      path: "friends",
      select: "avatar username"
    });
    var a= userData.friends.map((value, index)=>{
      return{
        ...value._doc,
        same_friends: resultSameFriend[index],
      }
    })
    return res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
      data: {
        friends: a,
        total: userData.friends.length,
      },
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: statusCode.UNKNOWN_ERROR,
      message: statusMessage.UNKNOWN_ERROR,
    });
  }
};

module.exports = {
  getRequestedFriends,
  getListVideos,
  getUserFriends,
};

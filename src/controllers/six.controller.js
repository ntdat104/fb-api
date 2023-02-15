const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");
const formidable = require("formidable");
const { getVideoDurationInSeconds } = require('get-video-duration')
const mongoose = require("mongoose");

const Post = require("../models/post.model.js");
const User = require("../models/user.model.js");
const ReportPost = require("../models/report.post.model.js");
const Comment = require("../models/comment.model")

const cloud = require("../helpers/cloud.helper.js");

const statusCode = require("../constants/statusCode.constant.js");
const statusMessage = require("../constants/statusMessage.constant.js");

const search = async (req, res) => {
    var { keyword, index, count, user_id } = req.query;
    const { _id } = req.userDataPass;
    // check params
    if(!user_id){
        return res.status(200).json({
            code: statusCode.PARAMETER_IS_NOT_ENOUGHT,
            message: statusMessage.PARAMETER_IS_NOT_ENOUGHT,
        });
    }
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
        var postData1 =await Post.find({$or: [
            { keyword: new RegExp(keyword, "i") },
            { keyword: new RegExp(keyword.replace(" ", "|"), "i") }
        ]}).populate({
            path: "author",
            select:"username avatar"
        });
        res.status(200).json({
            code: statusCode.OK,
            message: statusMessage.OK,
            data: postData1
        })
        await User.findByIdAndUpdate(_id,{
            $pull:{
                savedSearch: {
                    keyword: keyword,
                }
            }
        })
        await User.findByIdAndUpdate(_id,{
            $push:{
                savedSearch: {
                    keyword: keyword,
                    created: Date.now(),
                }
            }
        })
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

const getSavedSearch = async (req, res) => {
    var { token, index, count } = req.query;
    const { _id } = req.userDataPass;
    // check params
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
        var userData = req.userDataPass;
        if (!userData) {
            throw Error("nodata");
        }
        return res.status(200).json({
            code: statusCode.OK,
            message: statusMessage.OK,
            data: userData.savedSearch.sort((a,b)=>b.created-a.created).slice(Number(index),Number(index)+Number(count) ),
        })
    } catch (error) {
        if (error.message == "params") {
            return res.status(200).json({
                code: statusCode.PARAMETER_VALUE_IS_INVALID,
                message: statusMessage.PARAMETER_VALUE_IS_INVALID
            })
        } else if (error.message == "nodata") {
            return res.status(200).json({
                code: statusCode.NO_DATA_OR_END_OF_LIST_DATA,
                message: statusMessage.NO_DATA_OR_END_OF_LIST_DATA
            })
        } else {
            return res.status(200).json({
                code: statusCode.UNKNOWN_ERROR,
                message: statusMessage.UNKNOWN_ERROR
            })
        }
    }
}

const delSavedSearch = async (req, res) => {
    var { token, search_id, all } = req.query;
    const { _id } = req.userDataPass;
    // check params
    if(isNaN(all)){
        all = 0;
    }
    try {
        if(Number(all)==1){
            await User.findByIdAndUpdate(_id, {
                $set: {
                    savedSearch: []
                }
            });
            return res.status(200).json({
                code: statusCode.OK,
                message: statusMessage.OK
            })
        }
        else if (Number(all)==0&&search_id) {
                const userData = req.userDataPass.savedSearch.find((i) => i.id === search_id);
                if(!userData){
                    return res.status(500).json({
                        code: statusCode.PARAMETER_VALUE_IS_INVALID,
                        message: statusMessage.PARAMETER_VALUE_IS_INVALID
                    })
                }
            await User.findByIdAndUpdate(_id,{
                $pull:{
                    savedSearch:{
                        _id: search_id
                    }
                }
            });
            return res.status(200).json({
                code: statusCode.OK,
                message: statusMessage.OK
            })
        } else {
            throw Error("params");
        }
    } catch (error) {
        if (error.message == "params") {
            return res.status(200).json({
                code: statusCode.PARAMETER_VALUE_IS_INVALID,
                message: statusMessage.PARAMETER_VALUE_IS_INVALID
            })
        } else if (error.message == "nodata") {
            return res.status(200).json({
                code: statusCode.NO_DATA_OR_END_OF_LIST_DATA,
                message: statusMessage.NO_DATA_OR_END_OF_LIST_DATA
            })
        } else {
            return res.status(200).json({
                code: statusCode.UNKNOWN_ERROR,
                message: statusMessage.UNKNOWN_ERROR
            })
        }
    }
}


module.exports = {
    search,
    getSavedSearch,
    delSavedSearch
};

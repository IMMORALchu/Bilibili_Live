import request from "./request.js";
const url = '/api'
 
 
//获取key
export function getKey(params){
  return request({
    url: url + '?s=App.Dorward.GetDorward',
    method: 'GET',
    params
  })
}

// 上传在线人数

export const uploadOnline = (data) => {
    return request({
        url: url + '?s=App.Linecount.SetLinecount',
        method: 'post',
        data
    })
}

// 上传礼物

export const uploadGift = (data) => {
    return request({
        url: url + '?s=App.Sendgift.SetSendgift',
        method: 'post',
        data
    })
}

// 上传组合礼物

export const uploadGroupGift = (data) => {
    return request({
        url: url + '?s=App.Combosend.SetCombosend',
        method: 'post',
        data
    })
}

// 上传SC

export const uploadSC = (data) => {
    return request({
        url: url + '?s=App.Superchat.SetSuperchat',
        method: 'post',
        data
    })
}

// 上传弹幕

export const uploadDanmu = (data) => {
    return request({
        url: url + '?s=App.Danmu.AddDanmu',
        method: 'post',
        data
    })
}

// 上传舰长

export const uploadNotice = (data) => {
    return request({
        url: url + '?s=App.Notice.SetNotice',
        method: 'post',
        data
    })
}
 

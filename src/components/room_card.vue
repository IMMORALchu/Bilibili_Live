<template>
    <div>
        <div class="card">
            <el-card class="box-card room_card" v-for="index in room_list">
                <div slot="header" class="clearfix">
                    <a :href="index.live_url" target="_blank">{{ index.title }} - {{ index.uname }}</a>
                    <!-- <el-button style="float: right; padding: 3px 0" type="text">删除</el-button> -->
                </div>
                <div>
                    <div class="live_msg">
                        <div class="live_msg_top">
                            <div class="live_msg_time">
                                {{ index.live_time.split(' ')[0] }}
                                <br>
                                {{ index.live_time.split(' ')[1] }}
                            </div>
                            <div class="live_msg_area" style="font-size: 14px;">
                                {{ index.parent_area_name }}
                                <br>
                                {{ index.area_name }}
                            </div>
                        </div>
                        <div class="live_msg_bottom">
                            <div class="live_msg_status">{{ index.live_status == 1 ? '已开播' : '未开播' }}</div>
                            <div class="live_msg_online">在线人数: {{ index.online }}</div>
                        </div>
                    </div>
                    <el-image :style="'width: ' + width + 'px;height: ' + height + 'px'"
                        :src="'https://images.weserv.nl/?url=' + index.cover" fit="contain">
                        <div slot="error" class="image-slot">
                            <el-image :style="'height: ' + height + 'px'"
                                src="https://www.freeimg.cn/i/2024/04/01/660a900588428.png" fit="fill"></el-image>
                        </div>
                    </el-image>
                </div>
            </el-card>
        </div>
    </div>
</template>

<script>
import { makeBrotliDecode } from '../components/decode/decode.js'
import {
    getKey,
    uploadLive
} from '../api/api.js'
export default {
    name: 'room_card',
    props: {
        roomID: {
            type: String,
            default: ''
        },
        info: {
            type: Object,
            default: () => ({})
        },
        token: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            eventTarget: new EventTarget(),
            Cookie: "buvid3=B5D60E82-54FC-2675-DF17-8E3DEFE427F268299infoc; b_nut=1711182668; _uuid=AE108EB99-1CB4-310CC-3867-8FB74AE39EE468340infoc; buvid4=E81691C4-381A-6089-C3A8-F1D6288253CC68993-024032308-QyzHm7lqg%2BI5SECTkR5Jdw%3D%3D; rpdid=|(J~|J|Ymkk)0J'u~uuu)kYYm; enable_web_push=DISABLE; header_theme_version=CLOSE; CURRENT_FNVAL=4048; buvid_fp_plain=undefined; LIVE_BUVID=AUTO9117112934962696; CURRENT_QUALITY=112; hit-dyn-v2=1; bp_video_offset_76775755=912749742346207264; SESSDATA=28580584%2C1727158393%2Cd8992%2A31CjDSC01HFceB5XjLNa_QCexwpvnlGpm4d5jiEdPMMDDsrDtmYt07ThHoZwW2QHJHFNoSVnRqdjhTYmlEWGhZVVp5YjlOcTZZTWY1LVZxN2N0Q1dobFNlVWtkdjhNMTViMHN5NFUxTW1LZDlHUm1xdzVJYXo3bkxzNVFLZFNxZ25ObGVQaC1JSkJRIIEC; bili_jct=b01b921f8e1eb0dcdda6a44723f003f4; DedeUserID=76775755; DedeUserID__ckMd5=3c3d0182e5cd8925; sid=7fpeucd0; FEED_LIVE_VERSION=V_HEADER_LIVE_NO_POP; fingerprint=d294c984b4eb0be5065e9758e3c17b4c; i-wanna-go-back=-1; b_ut=5; bili_ticket=eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MTI3Mjg5MzIsImlhdCI6MTcxMjQ2OTY3MiwicGx0IjotMX0.b2VQnjZqy9Sc0S7po2QkPMb0l95f_Y7naNOs-L1h4SA; bili_ticket_expires=1712728872; buvid_fp=1c692bbd6504f8598b3db455c5a61574; b_lsid=104C102347_18EB83F05CC; browser_resolution=1342-750; home_feed_column=4; PVID=3; Hm_lvt_8a6e55dbd2870f0f5bc9194cddf32a02=1711595486,1711692413,1711942225,1712491641; Hm_lpvt_8a6e55dbd2870f0f5bc9194cddf32a02=1712491641",
            room_id: '', // 用于存储直播间真实房间号
            online_count_time: 0, // 用于存储在线人数数据,每1小时上传一次
            online_count: 0, // 在线人数
            width: 0, // 图片宽度
            height: 0, // 图片高度
            room_list: [], // 用于存储房间列表
            live_status: 0, // 直播状态
            live_id: '', // 直播场次id
            ws: null, // websocket实例
        }
    },
    async created() {
        // 获取屏幕宽度
        let width = document.documentElement.clientWidth;
        this.width = (width / 4) - 70;
        // 16:9
        this.height = this.width * 9 / 16;
        let _this = this;
        // 根据;拆分cookie,=号前为键，=号后为值
        let cookie = this.Cookie.split(";");
        for (let i = 0; i < cookie.length; i++) {
            let key = cookie[i].split("=")[0];
            let value = cookie[i].split("=")[1];
            document.cookie = key + "=" + value;
        }

        //获取直播间真实房间号
        // let params = {
        //     'url': 'https://api.live.bilibili.com/room/v1/Room/room_init?id=' + this.roomID,
        //     'method': 'GET',
        //     'cookie': ''
        // }
        // await getKey(params).then(res => {
        //     this.room_id = res.data.data.data.room_id;
        //     console.log('真实的房间号为:' + this.room_id);
        // });

        this.room_id = this.roomID;

        this.checkLive();

        // // 每5分钟检测一次直播状态
        setInterval(() => {
            this.checkLive();
        }, 30000);

        //认证成功事件
        this.on("Certify_Success", function (e) {
            let data = e;
            if (data.code == 0) {
                console.log("认证成功");
            }
        })


        //弹幕事件
        this.on("DANMU_MSG", function (e) {
            let data = e;
            let content = data.info[1];
            let send_user = data.info[0][15]['user']['base']['name'];
            let send_user_id = data.info[0][15]['user']['uid'];
            let create_time = data.info[9]['ts'];
            let room_id = _this.room_id;
            _this.$parent.danmu_list.push({
                "content": content,
                "send_user": send_user,
                "send_user_id": send_user_id,
                "create_time": create_time,
                "room_id": room_id,
                "live_id": _this.live_id,
            });
        })

        //礼物赠送事件
        this.on("SEND_GIFT", function (e) {
            let data = e;
            // console.log(data);
            let send_user = data.data.sender_uinfo.base.name;
            let send_user_id = data.data.sender_uinfo.uid;
            let gift_name = data.data.giftName;
            let gift_id = data.data.batch_combo_id;
            let gift_num = data.data.num;
            let gift_price = data.data.price;
            let gift_type = data.data.coin_type;
            let create_time = data.data.timestamp;
            let room_id = _this.room_id;
            let up_id = data.data.receiver_uinfo.uid;
            let up_name = data.data.receiver_uinfo.base.name;
            if (gift_type == 'gold') {
                gift_type = 0;
            } else {
                gift_type = 1;
            }
            _this.$parent.gift_list.push({
                "send_user": send_user,
                "send_user_id": send_user_id,
                "gift_name": gift_name,
                "gift_id": gift_id,
                "gift_num": gift_num,
                "gift_price": gift_price,
                "gift_type": gift_type,
                "create_time": create_time,
                "room_id": room_id,
                "up_id": up_id,
                "up_name": up_name,
                "live_id": _this.live_id,
            });
        })

        // SC事件
        this.on("SUPER_CHAT_MESSAGE", function (e) {
            let data = e;
            let content = data.data.message;
            let price = data.data.price;
            let send_user = data.data.user_info.uname;
            let send_user_id = data.data.uid;
            let create_time = data.data.ts;
            let room_id = _this.room_id;
            let up_id = data.data.medal_info.target_id;
            let up_name = data.data.medal_info.medal_name;
            _this.$parent.sc_list.push({
                "content": content,
                "price": price,
                "send_user": send_user,
                "send_user_id": send_user_id,
                "create_time": create_time,
                "room_id": room_id,
                "up_id": up_id,
                "up_name": up_name,
                "live_id": _this.live_id,
            });
        })

        // 舰长事件
        this.on("GUARD_BUY", function (e) {
            let data = e;
            let up_time = data.data.start_time;
            let end_time = data.data.end_time;
            let mouth = data.data.num;
            let price = data.data.price;
            let type = data.data.gift_name;
            let notice_id = data.data.uid;
            let notice_name = data.data.username;
            let room_id = _this.room_id;
            _this.$parent.notice_list.push({
                "up_time": up_time,
                "end_time": end_time,
                "mouth": mouth,
                "price": price,
                "type": type,
                "notice_id": notice_id,
                "notice_name": notice_name,
                "room_id": room_id,
                "live_id": _this.live_id,
            });
        })

        // 组合礼物事件
        this.on("COMBO_SEND", function (e) {
            let data = e;
            let send_user = data.data.sender_uinfo.base.name;
            let send_user_id = data.data.sender_uinfo.uid;
            let gift_name = data.data.gift_name;
            let gift_id = data.data.batch_combo_id;
            let gift_num = data.data.combo_num;
            let gift_price = data.data.combo_total_coin;
            let gift_type = data.data.coin_type;
            let create_time = parseInt(new Date().getTime() / 1000);
            let room_id = _this.room_id;
            let up_id = data.data.receive_user_info.uid;
            let up_name = data.data.receive_user_info.uname;
            if (gift_type == 'gold') {
                gift_type = 0;
            } else {
                gift_type = 1;
            }
            _this.$parent.combo_gift_list.push({
                "send_user": send_user,
                "send_user_id": send_user_id,
                "gift_name": gift_name,
                "gift_id": gift_id,
                "gift_num": gift_num,
                "gift_price": gift_price,
                "gift_type": gift_type,
                "create_time": create_time,
                "room_id": room_id,
                "up_id": up_id,
                "up_name": up_name,
                "live_id": _this.live_id,
            });
        })

        // 在线人数事件
        this.on("ONLINE_RANK_COUNT", function (e) {
            let data = e;
            let content = data.data.count;
            let create_time = parseInt(new Date().getTime() / 1000);
            let room_id = _this.room_id;
            _this.online_count_time == 0 ? _this.online_count_time = create_time : _this.online_count_time = _this.online_count_time;
            _this.online_count = content;
            _this.$parent.online_list.push({
                "content": content,
                "create_time": create_time,
                "room_id": room_id,
                "live_id": _this.live_id,
            });
        })
    },
    methods: {
        //事件注册
        on(eventType, callback) {
            this.$data.eventTarget.addEventListener(eventType, function (e) {
                callback(e.detail);
            });
        },

        //生成认证数据
        getCertification(json) {
            let encoder = new TextEncoder(); //编码器
            let jsonView = encoder.encode(json); //utf-8编码
            let buff = new ArrayBuffer(jsonView.byteLength + 16); //数据包总长度：16位头部长度+bytes长度
            let view = new DataView(buff); //新建操作视窗
            view.setUint32(0, jsonView.byteLength + 16); //整个数据包长度
            view.setUint16(4, 16); //头部长度
            view.setUint16(6, 1); //协议版本
            view.setUint32(8, 7); //类型,7为加入房间认证
            view.setUint32(12, 1); //填1
            for (let r = 0; r < jsonView.byteLength; r++) {
                view.setUint8(16 + r, jsonView[r]); //填入数据
            }
            return buff;
        },

        //处理服务器发送过来的数据，初步打包
        /*打包格式（JSON）
        键        值类型
        Len        int
        HeadLen     int
        Ver        int
        Type       int
        Num        int
        body       JSON（Type != 3）或者int（Type == 3）
        */
        handleMessage(blob, call) {
            let reader = new FileReader();
            reader.onload = function (e) {
                let buff = e.target.result; //ArrayBuffer对象
                let decoder = new TextDecoder(); //解码器
                let view = new DataView(buff); //视图
                let offset = 0;
                let packet = {};
                let result = [];
                while (offset < buff.byteLength) { //数据提取
                    let packetLen = view.getUint32(offset + 0);
                    let headLen = view.getUint16(offset + 4);
                    let packetVer = view.getUint16(offset + 6);
                    let packetType = view.getUint32(offset + 8);
                    let num = view.getUint32(12);
                    if (packetVer == 3) { //解压数据
                        let brArray = new Uint8Array(buff, offset + headLen, packetLen - headLen);
                        let BrotliDecode = makeBrotliDecode(); //生成Brotli格式解压工具的实例
                        let buffFromBr = BrotliDecode(brArray); //返回Int8Array视图
                        let view = new DataView(buffFromBr.buffer);
                        let offset_Ver3 = 0;
                        while (offset_Ver3 < buffFromBr.byteLength) { //解压后数据提取
                            let packetLen = view.getUint32(offset_Ver3 + 0);
                            let headLen = view.getUint16(offset_Ver3 + 4);
                            let packetVer = view.getUint16(offset_Ver3 + 6);
                            let packetType = view.getUint32(offset_Ver3 + 8);
                            let num = view.getUint32(12);
                            packet.Len = packetLen;
                            packet.HeadLen = headLen;
                            packet.Ver = packetVer;
                            packet.Type = packetType;
                            packet.Num = num;
                            let dataArray = new Uint8Array(buffFromBr.buffer, offset_Ver3 + headLen, packetLen - headLen);
                            packet.body = decoder.decode(dataArray); //utf-8格式数据解码，获得字符串
                            result.push(JSON.stringify(packet)); //数据打包后传入数组
                            offset_Ver3 += packetLen;
                        }
                    } else {
                        packet.Len = packetLen;
                        packet.HeadLen = headLen;
                        packet.Ver = packetVer;
                        packet.Type = packetType;
                        packet.Num = num;
                        let dataArray = new Uint8Array(buff, offset + headLen, packetLen - headLen);
                        if (packetType == 3) { //获取人气值
                            packet.body = (new DataView(buff, offset + headLen, packetLen - headLen)).getUint32(0); //若入参为dataArray.buffer，会返回整段buff的视图，而不是截取后的视图
                        } else {
                            packet.body = decoder.decode(dataArray); //utf-8格式数据解码，获得字符串
                        }
                        result.push(JSON.stringify(packet)); //数据打包后传入数组
                    }
                    offset += packetLen;
                }
                call(result); //数据后续处理
            }
            reader.readAsArrayBuffer(blob); //读取服务器传来的数据转换为ArrayBuffer
        },

        async webSocket() {
            const _this = this;
            let room_id = this.room_id;
            if ("WebSocket" in window) {
                // console.log("您的浏览器支持WebSocket");
                var params = {
                    'url': 'https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=' + room_id + '&type=0',
                    'method': 'GET',
                    'cookie': _this.Cookie
                }
                // 获取key
                await getKey(params).then(res => {
                    // console.log(res.data.data.data.token);
                    _this.key = res.data.data.data.token;
                });
                var timer;
                var ws = new WebSocket("wss://broadcastlv.chat.bilibili.com:443/sub");
                _this.ws = ws;
                // console.log(ws);
                ws.onopen = function (e) {
                    // console.log("open");
                    var certification = {
                        "uid": 76775755,
                        "roomid": parseInt(room_id),
                        "protover": 3,
                        // cookie里的buvid3
                        "buvid": "B5D60E82-54FC-2675-DF17-8E3DEFE427F268299infoc",
                        "platform": "web",
                        "type": 2,
                        "key": _this.key //值为空字符串好像也没问题
                    }
                    ws.send(_this.getCertification(JSON.stringify(certification)));
                    // console.log(JSON.stringify(certification))
                    //发送心跳包
                    timer = setInterval(function () {
                        // console.log("发送心跳包");
                        let buff = new ArrayBuffer(16);
                        let i = new DataView(buff);
                        i.setUint32(0, 0); //整个封包
                        i.setUint16(4, 16); //头部
                        i.setUint16(6, 1); //协议版本
                        i.setUint32(8, 2); //操作码,2为心跳包
                        i.setUint32(12, 1); //填1
                        ws.send(buff);
                    }, 30000); //30秒

                }

                ws.onmessage = function (e) {
                    //当客户端收到服务端发来的消息时，触发onmessage事件，参数e.data包含server传递过来的数据
                    let blob = e.data;
                    _this.handleMessage(blob, function (result) {
                        // console.log(result);
                        //触发事件
                        for (let i = 0; i < result.length; i++) {
                            let json = JSON.parse(result[i]);
                            if (json.Type == 5) {
                                let event = new CustomEvent(JSON.parse(json.body).cmd, { detail: JSON.parse(json.body) });
                                // console.log(CustomEvent);
                                var list = ["DANMU_MSG", "SEND_GIFT", "INTERACT_WORD", "DM_INTERACTION", "WATCHED_CHANGE", "COMMON_NOTICE_DANMAKU", "ENTRY_EFFECT", "LIKE_INFO_V3_UPDATE", "WIDGET_BANNER", "ONLINE_RANK_V2", "POPULAR_RANK_CHANGED", "LIKE_INFO_V3_CLICK", "NOTICE_MSG", "LIVE_INTERACTIVE_GAME", "DANMU_AGGREGATION", "ROOM_REAL_TIME_MESSAGE_UPDATE", "STOP_LIVE_ROOM_LIST", "ONLINE_RANK_COUNT"]
                                if (list.includes(JSON.parse(json.body).cmd)) {

                                } else {
                                    // console.log(JSON.parse(json.body));
                                }
                                _this.$data.eventTarget.dispatchEvent(event);
                            }
                            if (json.Type == 8) {
                                let event = new CustomEvent("Certify_Success", { detail: JSON.parse(json.body) });
                                _this.$data.eventTarget.dispatchEvent(event);
                            }
                            if (json.Type == 3) {
                                let event = new CustomEvent("VIEW", { detail: json.body });
                                _this.$data.eventTarget.dispatchEvent(event);
                            }
                        }
                    });
                }

                ws.onclose = function (e) {
                    //当客户端收到服务端发送的关闭连接请求时，触发onclose事件
                    // console.log("close");
                    if (timer != null) {
                        clearInterval(timer); //停止发送心跳包
                    }
                    // setTimeout(_this.webSocket, 4000); //4秒后重连
                }

                ws.onerror = function (e) {
                    //如果出现连接、处理、接收、发送数据失败的时候触发onerror事件
                    console.log(e);
                }
            } else {
                console.log("您的浏览器不支持WebSocket");
            }
        },

        // 检测直播间是否开播
        checkLive() {
            var _this = this;
            // console.log(_this.live_status)
            if (this.info.live_status == 1) {
                _this.live_id = this.info['live_id'];
                // console.log(_this.room_id + '直播间正在直播');
                if (_this.live_status == 0) {
                    uploadLive({
                        'title': this.info.title,
                        'room_id': _this.room_id,
                        'live_id': _this.live_id,
                        'cover': this.info.cover,
                        'live_time': Date.parse(this.info.live_time),
                        'live_end': 0
                    }).then(res => {
                    });
                    _this.room_list.push(this.info);
                    this.webSocket();
                }
                _this.live_status = 1;
                // console.log(_this.live_status)
            } else {
                // console.log(_this.room_id + '直播间未开播');
                _this.live_status = 0;
                // _this.room_list = [];
                // this.$parent.roomID_list中找到自己,并去除
                let index = this.$parent.roomID_list.findIndex(item => item.room_id == this.room_id);
                // this.$parent.roomID_list.splice(index, 1);
                // 销毁这个页面

            }
        },


    },
    beforeDestroy() {
        console.log('销毁');
        this.ws.close();
    }
}
</script>

<style>
a {
    text-decoration: none
}

.card {
    display: flex;
    flex-wrap: wrap;
}

.room_card {
    margin: 10px;
    margin-top: 0;
}

.live_msg {
    display: flex;
    flex-direction: column;
    text-align: center;
    line-height: 20px;
    font-size: 15px;
    margin-bottom: 10px;
}

.live_msg_top,
.live_msg_bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    display: -webkit-flex;

}

.live_msg_top>div,
.live_msg_bottom>div {
    width: 50%;
    margin: 5px 0;
}

.live_msg_bottom {
    background-color: #f5f5f5;
    padding: 5px;
    border-radius: 5px;
}
</style>
<template>
    <div class="home">
        <h1>房间管理</h1>
        <el-divider></el-divider>
        <div id="room_card">
            <room_card v-for="(index, item) in roomID_list" :key="'new_' + item" :roomID="index.room_id"
                :info="index.room_info" :token="index.token" v-if="index.room_info.live_status == 1"></room_card>
        </div>
    </div>
</template>

<script>
import room_card from '../components/room_card.vue'
import {
    getRoomList,
    getRoomListBatch,
    uploadOnline,
    uploadGroupGift,
    uploadGift,
    uploadSC,
    uploadDanmu,
    uploadNotice,
} from '../api/api.js'
export default {
    name: 'HomeView',
    components: {
        room_card
    },
    data() {
        return {
            Cookie: "buvid3=B5D60E82-54FC-2675-DF17-8E3DEFE427F268299infoc; b_nut=1711182668; _uuid=AE108EB99-1CB4-310CC-3867-8FB74AE39EE468340infoc; buvid4=E81691C4-381A-6089-C3A8-F1D6288253CC68993-024032308-QyzHm7lqg%2BI5SECTkR5Jdw%3D%3D; rpdid=|(J~|J|Ymkk)0J'u~uuu)kYYm; enable_web_push=DISABLE; header_theme_version=CLOSE; CURRENT_FNVAL=4048; fingerprint=6577863867841e283357875ce78291e0; buvid_fp_plain=undefined; LIVE_BUVID=AUTO9117112934962696; CURRENT_QUALITY=112; hit-dyn-v2=1; bp_video_offset_76775755=912749742346207264; home_feed_column=4; browser_resolution=1342-750; Hm_lvt_8a6e55dbd2870f0f5bc9194cddf32a02=1711293499,1711595486; bili_ticket=eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MTE4NjU1NDksImlhdCI6MTcxMTYwNjI4OSwicGx0IjotMX0.Jx5dRWiGQsoxY3Du4EjjFnNeoA5BGxwvej3pAIWKWjg; bili_ticket_expires=1711865489; SESSDATA=28580584%2C1727158393%2Cd8992%2A31CjDSC01HFceB5XjLNa_QCexwpvnlGpm4d5jiEdPMMDDsrDtmYt07ThHoZwW2QHJHFNoSVnRqdjhTYmlEWGhZVVp5YjlOcTZZTWY1LVZxN2N0Q1dobFNlVWtkdjhNMTViMHN5NFUxTW1LZDlHUm1xdzVJYXo3bkxzNVFLZFNxZ25ObGVQaC1JSkJRIIEC; bili_jct=b01b921f8e1eb0dcdda6a44723f003f4; DedeUserID=76775755; DedeUserID__ckMd5=3c3d0182e5cd8925; sid=7fpeucd0; buvid_fp=6577863867841e283357875ce78291e0; b_lsid=610576F21_18E87EE68FC; FEED_LIVE_VERSION=V_HEADER_LIVE_NO_POP; PVID=3",
            roomID_list: [], // 用于存储房间ID列表
            danmu_list: [], // 用于存储弹幕数据,每100条上传一次
            gift_list: [], // 用于存储礼物数据,每100条上传一次
            sc_list: [], // 用于存储SC数据,每100条上传一次
            notice_list: [], // 用于存储舰长数据,每100条上传一次
            online_list: [], // 用于存储在线人数数据,每1小时上传一次
            combo_gift_list: [], // 用于存储组合礼物数据,每100条上传一次
        }
    },
    created() {
        let _this = this;
        // 根据;拆分cookie,=号前为键，=号后为值
        let cookie = this.Cookie.split(";");
        let cookieObj = {};
        for (let i = 0; i < cookie.length; i++) {
            let key = cookie[i].split("=")[0];
            let value = cookie[i].split("=")[1];
            document.cookie = key + "=" + value;
        };
        this.getRoomList();
        // 每隔30s刷新一次
        setInterval(() => {
            this.getRoomList();
        }, 30000);

        // 每半个小时上传一次数据
        setInterval(() => {
            _this.updateData()
        }, 60000);
    },
    methods: {
        // 获取房间列表
        getRoomList() {
            var _this = this;
            // 获取自定义上传的房间列表
            getRoomList().then(res => {
                // console.log(res.data.data);

                // 判断是否已经存在，不存在则添加
                if (_this.roomID_list.length == 0) {
                    for (let i = 0; i < res.data.data.length; i++) {
                        _this.roomID_list.push({
                            room_id: String(res.data.data[i].room_id),
                            room_info: res.data.data[i].room_info,
                            token: res.data.data[i].token
                        });
                    }
                } else {
                    for (let item of res.data.data) {
                        if (_this.roomID_list.some(index => index.room_id === String(item.room_id))) {
                            // console.log('已存在');
                            // 更新房间信息
                            _this.roomID_list.forEach(index => {
                                if (index.room_id === String(item.room_id)) {
                                    index.room_info = item.room_info;
                                }
                            });
                        } else {
                            // console.log('不存在');
                            _this.roomID_list.push({
                                room_id: String(item.room_id),
                                room_info: item.room_info
                            });
                        }
                    }
                }

                // console.log(_this.roomID_list);
            }).catch(err => {
                console.log(err);
            })

            // 获取官方接口房间列表
            // 大航海榜单
            let params = {
                'url': 'https://api.live.bilibili.com/room/v2/Index/getNewRankTop?type=guard',
                'method': 'GET',
                'cookie': this.Cookie
            }
            // getKey(params).then(res => {
            //     // console.log(res.data.data.data);
            //     res.data.data.data.forEach(item => {
            //         // 判断是否已经存在，不存在则添加
            //         if (_this.roomID_list.indexOf(String(item.room_id)) == -1) {
            //             _this.roomID_list.push(String(item.room_id));
            //         }
            //     });
            //     console.log(_this.roomID_list);
            // }).catch(err => {
            //     console.log(err);
            // })

            // 人气榜单
            let params2 = {
                'url': 'https://api.live.bilibili.com/xlive/web-interface/v1/index/getHotRankList',
                'method': 'GET',
                'cookie': this.Cookie
            }
            // getKey(params2).then(res => {
            //     console.log(res.data.data.data.list);
            //     res.data.data.data.list.forEach(item => {
            //         // 判断是否已经存在，不存在则添加
            //         if (_this.roomID_list.indexOf(String(item.roomid)) == -1) {
            //             _this.roomID_list.push(String(item.roomid));
            //         }
            //     });
            //     console.log(_this.roomID_list);
            // }).catch(err => {
            //     console.log(err);
            // })
        },
        // 提交数据到数据库
        updateData() {
            let _this = this;
            var danmu_list = _this.$data.danmu_list;
            var gift_list = _this.$data.gift_list;
            var sc_list = _this.$data.sc_list;
            var notice_list = _this.$data.notice_list;
            var online_list = _this.$data.online_list;
            var combo_gift_list = _this.$data.combo_gift_list;
            if (danmu_list.length > 0) {
                uploadDanmu({ data: danmu_list }).then(res => {
                    // console.log(res);
                    _this.$data.danmu_list = [];
                });
            }
            if (gift_list.length > 0) {
                uploadGift({ data: gift_list }).then(res => {
                    // console.log(res);
                    _this.$data.gift_list = [];
                });
            }
            if (sc_list.length > 0) {
                uploadSC({ data: sc_list }).then(res => {
                    // console.log(res);
                    _this.$data.sc_list = [];
                });
            }
            if (notice_list.length > 0) {
                uploadNotice({ data: notice_list }).then(res => {
                    // console.log(res);
                    _this.$data.notice_list = [];
                });
            }
            if (online_list.length > 0) {
                uploadOnline({ data: online_list }).then(res => {
                    // console.log(res);
                    _this.$data.online_list = [];
                });
            }
            if (combo_gift_list.length > 0) {
                uploadGroupGift({ data: combo_gift_list }).then(res => {
                    // console.log(res);
                    _this.$data.combo_gift_list = [];
                });
            }
        }

    }
}
</script>

<style>
#room_card {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    flex-direction: row;
}
</style>
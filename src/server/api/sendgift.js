let db = require('../db/index')
exports.get = (req, res) => {
    // 插入数据
    var sql = 'INSERT INTO sendgift (send_user,send_user_id,gift_name,gift_id,gift_num,gift_price,create_time,room_id,up_id,up_name,gift_type,live_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
    db.query(sql, [req.query.send_user, req.query.send_user_id, req.query.gift_name, req.query.gift_id, req.query.gift_num, req.query.gift_price, req.query.create_time, req.query.room_id, req.query.up_id, req.query.up_name, req.query.gift_type, req.query.live_id], function (err, data) {
        if (err) {
            return res.send('错误：' + err.message)
        }
        res.send(data)
    })
}


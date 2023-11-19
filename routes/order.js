/**
 * Created by CTT VNPAY
 */

let express = require("express");
let router = express.Router();
let $ = require("jquery");
const request = require("request");
const moment = require("moment");
const db = require("./../models/database");
const mailer = require("../utils/mailer");
router.get("/", function (req, res, next) {
  res.render("orderlist", { title: "Danh sách đơn hàng" });
});

router.get("/create_payment_url", function (req, res, next) {
  res.render("order", { title: "Tạo mới đơn hàng", amount: 10000 });
});

router.get("/querydr", function (req, res, next) {
  let desc = "truy van ket qua thanh toan";
  res.render("querydr", { title: "Truy vấn kết quả thanh toán" });
});

router.get("/refund", function (req, res, next) {
  let desc = "Hoan tien GD thanh toan";
  res.render("refund", { title: "Hoàn tiền giao dịch thanh toán" });
});

router.get("/vnpay_return", async function (req, res, next) {
  try {
    const vnp_Params = req.query;
    const { vnp_SecureHash, vnp_SecureHashType, ...otherParams } = vnp_Params;
    const sortedParams = sortObject(otherParams);
    const { vnp_TmnCode, vnp_HashSecret } = require("config");
    const querystring = require("qs");
    const signData = querystring.stringify(sortedParams, { encode: false });
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    console.log("Received vnp_SecureHash:", vnp_SecureHash);
    console.log("Generated signed hash:", signed);

    if (vnp_SecureHash === signed) {
      const orderCode = otherParams.vnp_OrderInfo;
    // Lấy chuỗi ngày thanh toán
const payDateString = otherParams.vnp_PayDate;

// Chuyển đổi chuỗi thành đối tượng Date
const payDate = new Date(
  `${payDateString.substring(0, 4)}-${payDateString.substring(4, 6)}-${payDateString.substring(6, 8)}T${payDateString.substring(8, 10)}:${payDateString.substring(10, 12)}:${payDateString.substring(12, 14)}`
);

// Định dạng lại ngày thanh toán
const formattedPayDate = payDate.toLocaleDateString("vi-VN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

      const updateQuery = `UPDATE \`order\` SET orderStatus = "Đã thanh toán" WHERE orderCode = ?`;

      try {
        await db.query(updateQuery, [orderCode]);

        const subject = "Đặt hàng thành công";
        const content = `
        <!DOCTYPE html>
<html>
<head>
</head>
<body style="background-color: white; color: black;">
    <div style="background-color: red; color: white; padding: 10px; text-align: center;">
        <h1>Thanks for your order!!!</h1>
    </div>
    
    <div style="margin-top: 20px; font-family: Arial, sans-serif;">
    <p style="font-size: 18px;">Cảm ơn bạn đã đặt hàng tại <a href="Jaguarshop.live" style="color: #1a0dab; text-decoration: none;">jaguarshop.live</a>, đây là thông tin đơn hàng đã thanh toán</p>
    <div style="background-color: #f8f9fa; padding: 15px; margin-bottom: 20px;">
        <h2 style="margin-top: 0;">Thông tin đơn hàng</h2>
        <p><strong>Địa chỉ giao hàng:</strong> {order.shipping_address}</p>
    </div>
    <div style="background-color: #f8f9fa; padding: 15px;">
        <h2 style="margin-top: 0;">Thông tin thanh toán</h2>
        <p><strong>Ngân hàng:</strong> ${otherParams.vnp_BankCode}</p>
        <p><strong>Số tiền:</strong> ${parseInt(
          otherParams.vnp_Amount / 100
        ).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</p>
        <p><strong>Mã giao dịch:</strong> ${otherParams.vnp_TxnRef}</p>
        <p><strong>Mã đơn hàng:</strong> ${otherParams.vnp_OrderInfo}</p>
        <p><strong>Ngày thanh toán:</strong> ${formattedPayDate}</p>
    </div>
</div>
</body>
</html>

        
      
        `;
        const to = "thieulinh2508@gmail.com";

        try {
          const result = await mailer.sendMail(to, subject, content);
          console.log("Mail sent:", result);

          // Render success page
          res.render("success", {
            code: otherParams.vnp_ResponseCode,
            vnp_Amount: otherParams.vnp_Amount,
            vnp_TxnRef: otherParams.vnp_TxnRef,
            vnp_OrderInfo: otherParams.vnp_OrderInfo,
            vnp_TransactionNo: otherParams.vnp_TransactionNo,
            vnp_ResponseCode: otherParams.vnp_ResponseCode,
            vnp_TmnCode: otherParams.vnp_TmnCode,
            vnp_PayDate: otherParams.vnp_PayDate,
            vnp_BankCode: otherParams.vnp_BankCode,
          });
        } catch (mailerError) {
          console.error("Error sending mail:", mailerError);

          // Render error page for mail error
          res.render("error", { error: "Error sending mail" });
        }
      } catch (updateError) {
        console.error("Database update error:", updateError);

        // Render error page for database update error
        res.render("error", { error: "Database update error" });
      }
    } else {
      console.log("Invalid vnp_SecureHash");

      // Render error page for invalid vnp_SecureHash
      res.render("error", { error: "Invalid vnp_SecureHash" });
    }
  } catch (error) {
    console.error("Error processing VNPay return:", error);

    // Render general error page
    res.render("error", { error });
  }
});

router.get("/vnpay_ipn", function (req, res, next) {
  let vnp_Params = req.query;
  let secureHash = vnp_Params["vnp_SecureHash"];

  let orderId = vnp_Params["vnp_TxnRef"];
  let rspCode = vnp_Params["vnp_ResponseCode"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);
  let config = require("config");
  let secretKey = config.get("vnp_HashSecret");
  let querystring = require("qs");
  let signData = querystring.stringify(vnp_Params, { encode: false });
  let crypto = require("crypto");
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

  let paymentStatus = "0"; // Giả sử '0' là trạng thái khởi tạo giao dịch, chưa có IPN. Trạng thái này được lưu khi yêu cầu thanh toán chuyển hướng sang Cổng thanh toán VNPAY tại đầu khởi tạo đơn hàng.
  //let paymentStatus = '1'; // Giả sử '1' là trạng thái thành công bạn cập nhật sau IPN được gọi và trả kết quả về nó
  //let paymentStatus = '2'; // Giả sử '2' là trạng thái thất bại bạn cập nhật sau IPN được gọi và trả kết quả về nó

  let checkOrderId = true; // Mã đơn hàng "giá trị của vnp_TxnRef" VNPAY phản hồi tồn tại trong CSDL của bạn
  let checkAmount = true; // Kiểm tra số tiền "giá trị của vnp_Amout/100" trùng khớp với số tiền của đơn hàng trong CSDL của bạn
  if (secureHash === signed) {
    //kiểm tra checksum
    if (checkOrderId) {
      if (checkAmount) {
        if (paymentStatus == "0") {
          //kiểm tra tình trạng giao dịch trước khi cập nhật tình trạng thanh toán
          if (rspCode == "00") {
            //thanh cong
            //paymentStatus = '1'
            // Ở đây cập nhật trạng thái giao dịch thanh toán thành công vào CSDL của bạn
            res.status(200).json({ RspCode: "00", Message: "Success" });
          } else {
            //that bai
            //paymentStatus = '2'
            // Ở đây cập nhật trạng thái giao dịch thanh toán thất bại vào CSDL của bạn
            res.status(200).json({ RspCode: "00", Message: "Success" });
          }
        } else {
          res.status(200).json({
            RspCode: "02",
            Message: "This order has been updated to the payment status",
          });
        }
      } else {
        res.status(200).json({ RspCode: "04", Message: "Amount invalid" });
      }
    } else {
      res.status(200).json({ RspCode: "01", Message: "Order not found" });
    }
  } else {
    res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
  }
});

router.post("/querydr", function (req, res, next) {
  process.env.TZ = "Asia/Ho_Chi_Minh";
  let date = new Date();

  let config = require("config");
  let crypto = require("crypto");

  let vnp_TmnCode = config.get("vnp_TmnCode");
  let secretKey = config.get("vnp_HashSecret");
  let vnp_Api = config.get("vnp_Api");

  let vnp_TxnRef = req.body.orderId;
  let vnp_TransactionDate = req.body.transDate;

  let vnp_RequestId = moment(date).format("HHmmss");
  let vnp_Version = "2.1.0";
  let vnp_Command = "querydr";
  let vnp_OrderInfo = "Truy van GD ma:" + vnp_TxnRef;

  let vnp_IpAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  let currCode = "VND";
  let vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");

  let data =
    vnp_RequestId +
    "|" +
    vnp_Version +
    "|" +
    vnp_Command +
    "|" +
    vnp_TmnCode +
    "|" +
    vnp_TxnRef +
    "|" +
    vnp_TransactionDate +
    "|" +
    vnp_CreateDate +
    "|" +
    vnp_IpAddr +
    "|" +
    vnp_OrderInfo;

  let hmac = crypto.createHmac("sha512", secretKey);
  let vnp_SecureHash = hmac.update(new Buffer(data, "utf-8")).digest("hex");

  let dataObj = {
    vnp_RequestId: vnp_RequestId,
    vnp_Version: vnp_Version,
    vnp_Command: vnp_Command,
    vnp_TmnCode: vnp_TmnCode,
    vnp_TxnRef: vnp_TxnRef,
    vnp_OrderInfo: vnp_OrderInfo,
    vnp_TransactionDate: vnp_TransactionDate,
    vnp_CreateDate: vnp_CreateDate,
    vnp_IpAddr: vnp_IpAddr,
    vnp_SecureHash: vnp_SecureHash,
  };
  // /merchant_webapi/api/transaction
  request(
    {
      url: vnp_Api,
      method: "POST",
      json: true,
      body: dataObj,
    },
    function (error, response, body) {
      console.log(body);
    }
  );
});

router.post("/refund", function (req, res, next) {
  process.env.TZ = "Asia/Ho_Chi_Minh";
  let date = new Date();

  let config = require("config");
  let crypto = require("crypto");

  let vnp_TmnCode = config.get("vnp_TmnCode");
  let secretKey = config.get("vnp_HashSecret");
  let vnp_Api = config.get("vnp_Api");

  let vnp_TxnRef = req.body.orderId;
  let vnp_TransactionDate = req.body.transDate;
  let vnp_Amount = req.body.amount * 100;
  let vnp_TransactionType = req.body.transType;
  let vnp_CreateBy = req.body.user;

  let currCode = "VND";

  let vnp_RequestId = moment(date).format("HHmmss");
  let vnp_Version = "2.1.0";
  let vnp_Command = "refund";
  let vnp_OrderInfo = "Hoan tien GD ma:" + vnp_TxnRef;

  let vnp_IpAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  let vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");

  let vnp_TransactionNo = "0";

  let data =
    vnp_RequestId +
    "|" +
    vnp_Version +
    "|" +
    vnp_Command +
    "|" +
    vnp_TmnCode +
    "|" +
    vnp_TransactionType +
    "|" +
    vnp_TxnRef +
    "|" +
    vnp_Amount +
    "|" +
    vnp_TransactionNo +
    "|" +
    vnp_TransactionDate +
    "|" +
    vnp_CreateBy +
    "|" +
    vnp_CreateDate +
    "|" +
    vnp_IpAddr +
    "|" +
    vnp_OrderInfo;
  let hmac = crypto.createHmac("sha512", secretKey);
  let vnp_SecureHash = hmac.update(new Buffer(data, "utf-8")).digest("hex");

  let dataObj = {
    vnp_RequestId: vnp_RequestId,
    vnp_Version: vnp_Version,
    vnp_Command: vnp_Command,
    vnp_TmnCode: vnp_TmnCode,
    vnp_TransactionType: vnp_TransactionType,
    vnp_TxnRef: vnp_TxnRef,
    vnp_Amount: vnp_Amount,
    vnp_TransactionNo: vnp_TransactionNo,
    vnp_CreateBy: vnp_CreateBy,
    vnp_OrderInfo: vnp_OrderInfo,
    vnp_TransactionDate: vnp_TransactionDate,
    vnp_CreateDate: vnp_CreateDate,
    vnp_IpAddr: vnp_IpAddr,
    vnp_SecureHash: vnp_SecureHash,
  };

  request(
    {
      url: vnp_Api,
      method: "POST",
      json: true,
      body: dataObj,
    },
    function (error, response, body) {
      console.log(response);
    }
  );
});

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

module.exports = router;

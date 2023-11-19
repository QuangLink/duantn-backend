var express = require("express");
var router = express.Router();
const mailer = require("../utils/mailer");
router.get("/", function (req, res, next) {
  res.render("contact", { title: "Contact" });
});
//send to mail some example content
router.post("/", function (req, res, next) {
  const { email, code, vnp_Amount,vnp_TxnRef,vnp_BankCode,vnp_PayDate,vnp_ResponseCode,vnp_TransactionNo,vnp_OrderInfo } = req.body;
  const payDateString = vnp_PayDate;

      // Chuyển đổi chuỗi thành đối tượng Date
      const payDate = new Date(
        `${payDateString.substring(0, 4)}-${payDateString.substring(
          4,
          6
        )}-${payDateString.substring(6, 8)}T${payDateString.substring(
          8,
          10
        )}:${payDateString.substring(10, 12)}:${payDateString.substring(
          12,
          14
        )}`
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
  <p><strong>Ngân hàng:</strong> ${vnp_BankCode}</p>
  <p><strong>Số tiền:</strong> ${parseInt(
    vnp_Amount / 100
  ).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</p>
  <p><strong>Mã giao dịch:</strong> ${vnp_TxnRef}</p>
  <p><strong>Mã đơn hàng:</strong> ${vnp_OrderInfo}</p>
  <p><strong>Ngày thanh toán:</strong> ${formattedPayDate}</p>
</div>
</div>
</body>
</html>

  

  `;
 console.log(email)
  const to = email;
  mailer
    .sendMail(to, subject, content)
    .then((result) => {
      res.json(result);
    })
    .catch((error) => {
      res.json(error);
    });
});

module.exports = router;

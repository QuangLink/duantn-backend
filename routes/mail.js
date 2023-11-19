var express = require("express");
var router = express.Router();
const mailer = require("../utils/mailer");
router.get("/", function (req, res, next) {
  res.render("contact", { title: "Contact" });
});
//send to mail some example content
router.post("/", function (req, res, next) {
  const subject = "Đặt hàng thành công";
  const content = `Đây là email test việc đặt hàng thành công </br> <a href="jaguarshop.live">Jaguarshop.live</a>`;
  const to = "thieulinh2508@gmail.com";
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

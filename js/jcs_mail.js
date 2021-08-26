var nodemailer = require("nodemailer");

// level3を配布するため、コード埋め込み
const from_smtp_host="smtp.jacos.co.jp";
const from_smtp_email="jcs-info@jacos.co.jp";
const from_smtp_pass="#5S5Rjpn";


function mailsend(subject,message) {
  var transporter = nodemailer.createTransport({
    host:from_smtp_host,
    port:587,
    secure:false,
    auth: {
      user: from_smtp_email,
      pass: from_smtp_pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: from_smtp_email, 
    to: send_mail_address,
    subject: subject,
    html: message,
  };

  // send mail
  transporter.sendMail(mailOptions, function (err, info) {
    if (err){
      log.error(err);
    } else{
      log.info(info);
    }
  });
}

// module.exports = mailsend;

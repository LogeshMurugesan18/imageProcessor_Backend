const nodemailer =require('nodemailer');

exports.sendVerificationEmail = async (email,token)=>{
    const verificationUrl = `http://localhost:4200/signup?token=${token}`;
    const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'itteamilink@gmail.com',
      pass: 'aehlcdqfzxairgud',
    },
  });
  const mailOptions = {
    from: 'itteamilink@gmail.com',
    to: email,
    subject: 'Verify your email',
    html: `<p>Click the link to verify your email:</p><a href="${verificationUrl}">Verify Email</a>`,
  };
    await transporter.sendMail(mailOptions);
};
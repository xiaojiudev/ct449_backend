const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.PASS_EMAIL,
    }
})

const sendEmail = async (to, subject, htmlContent) => {
    try {

        await transporter.sendMail({
            from: "Dandelion",
            to,
            subject,
            html: htmlContent,
        });

        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};



module.exports = {
    sendEmail,
}
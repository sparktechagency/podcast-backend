const registrationSuccessEmailBody = (name: string, activationCode: number) => `
  <html lang="en">
    <head>
      <style>
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          background-color: #0f0f0f;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #1c1c1c;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }
        .header {
          background-color: #D93636;
          padding: 30px 0;
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
          color: #ffffff;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 26px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .content {
          padding: 30px;
          color: #ffffff;
        }
        .content h2 {
          font-size: 24px;
          color: #F9C80E;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .content p {
          font-size: 16px;
          color: #cccccc;
          line-height: 1.6;
          margin-bottom: 25px;
        }
        .activation-code {
          font-size: 28px;
          color: #D93636;
          font-weight: 700;
          text-align: center;
          margin-bottom: 25px;
          background-color: #2a2a2a;
          padding: 15px;
          border-radius: 8px;
        }
        .footer {
          padding: 20px;
          font-size: 14px;
          color: #777777;
          text-align: center;
          background-color: #0f0f0f;
          border-bottom-left-radius: 10px;
          border-bottom-right-radius: 10px;
        }
        .footer a {
          color: #F9C80E;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Preach Radio!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Thank you for registering with <strong>Preach Radio</strong>. To activate your account, please use the following activation code:</p>
          <div class="activation-code">${activationCode || 'XXXXXX'}</div>
          <p>Enter this code on the activation page within the next 5 minutes. If you don't verify your account, it will be deleted from our database and you will need to register again.</p>
          <p>If you didn't register, you can safely ignore this email.</p>
          <p>Need help? Contact us at <a href="mailto:support@strato.com">support@strato.com</a>.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Preach Radio. All rights reserved.</p>
          <p><a href="https://strato.com/privacy">Privacy Policy</a> | <a href="https://strato.com/contact">Contact Us</a></p>
        </div>
      </div>
    </body>
  </html>
`;

export default registrationSuccessEmailBody;

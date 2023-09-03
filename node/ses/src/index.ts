import * as SES from "@aws-sdk/client-sesv2";
const sesClient = new SES.SESv2Client();

// メールの送信
const sendEmailCommand = async (
  mailContent: SES.SendEmailCommandInput
): Promise<boolean> => {
  try {
    // メール送信
    const result = await sesClient.send(new SES.SendEmailCommand(mailContent));
    console.log(result);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

// AWS Batch コマンドの実行
const runAll = async (): Promise<void> => {
  // メールコンテンツ
  const mailContent: SES.SendEmailCommandInput = {
    FromEmailAddress: "from@gmail.com",
    Destination: {
      ToAddresses: ["to@gmail.com"],
      CcAddresses: [],
      BccAddresses: [],
    },
    Content: {
      Simple: {
        Subject: {
          Data: "Test email",
        },
        Body: {
          Text: {
            Data: "This is test email.",
          },
        },
      },
    },
  };
  // メール送信
  console.log("SendEmailCommand:");
  await sendEmailCommand(mailContent);
};
runAll();

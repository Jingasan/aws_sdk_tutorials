import * as Cognito from "@aws-sdk/client-cognito-identity-provider";
import { access } from "fs";
const cognitoClient = new Cognito.CognitoIdentityProviderClient({
  region: "ap-northeast-1",
});

/**
 * ユーザープールの作成
 * @param userPoolName 作成するユーザープールの名称
 * @returns ユーザープール情報/false:作成失敗
 */
const createUserPool = async (
  userPoolName: string
): Promise<Cognito.UserPoolType | false> => {
  const input: Cognito.CreateUserPoolCommandInput = {
    // ユーザープール名
    PoolName: userPoolName,
    // ユーザー名の他に認証での利用を許可する属性(email/phone_number/preferred_username)
    // UsernameAttributesと同時利用不可
    AliasAttributes: [Cognito.AliasAttributeType.EMAIL],
    // サインアップ時にユーザー名の代わりに利用可能な属性(email/phone_number)
    // alias_attributesと同時利用不可
    // UsernameAttributes: [Cognito.UsernameAttributeType.EMAIL],
    // ユーザー名の要件
    UsernameConfiguration: {
      // false(default): ユーザー名の大文字と小文字を区別しない
      CaseSensitive: false,
    },
    Policies: {
      // パスワードのポリシー
      PasswordPolicy: {
        MinimumLength: 8, // 最低文字数
        RequireUppercase: false, // 大文字を必須とするか
        RequireLowercase: false, // 小文字を必須とするか
        RequireNumbers: false, // 数字を必須とするか
        RequireSymbols: false, // 記号を必須とするか
        TemporaryPasswordValidityDays: 7, // 管理者によって設定された仮パスワードの有効期間(日)
      },
    },
    // INACTIVE(default):ユーザープールの削除を許可/ACTIVE:ユーザープールの削除を拒否
    DeletionProtection: Cognito.DeletionProtectionType.INACTIVE,
    // 多要素認証(MFA)の強制 ON(default)/OFF/OPTIONAL
    MfaConfiguration: Cognito.UserPoolMfaType.OFF,
    // ユーザーアカウントの復旧方法
    AccountRecoverySetting: {
      RecoveryMechanisms: [
        // メールによる復旧を優先度1に設定
        { Priority: 1, Name: Cognito.RecoveryOptionNameType.VERIFIED_EMAIL },
      ],
    },
    // 管理者によるユーザー作成の設定
    AdminCreateUserConfig: {
      // true:管理者によるユーザー作成のみ許可/false:ユーザー自身による作成も許可
      AllowAdminCreateUserOnly: false,
      // 管理者によるユーザー作成時に送信する招待メールのテンプレート
      InviteMessageTemplate: {
        // メールタイトル
        EmailSubject: "ユーザー登録完了",
        // メール本文
        EmailMessage:
          "{username}様<br><br>初期パスワードは{####}です。<br>初回ログイン後にパスワード変更が必要です。",
        // SMSメッセージ
        SMSMessage:
          "{username}様<br><br>初期パスワードは{####}です。<br>初回ログイン後にパスワード変更が必要です。",
      },
    },
    // 追加のカスタム属性(最大50個まで)
    Schema: [
      {
        // 属性名(「custom:属性名」で利用する)
        Name: "rank",
        // データ型
        AttributeDataType: Cognito.AttributeDataType.STRING,
        // ユーザーによる登録を許可するか false:許可/true:拒否
        DeveloperOnlyAttribute: false,
        // 可変か true:可変
        Mutable: true,
        // 必須か true:必須
        Required: false,
        // 文字数制限
        StringAttributeConstraints: {
          MinLength: "1",
          MaxLength: "2",
        },
      },
    ],
    // ユーザーの検証(Confirm)方法(email/phone_number)
    AutoVerifiedAttributes: [Cognito.VerifiedAttributeType.EMAIL],
    // メッセージ送信設定
    EmailConfiguration: {
      // メールプロバイダーの設定
      // COGNITO_DEFAULT:CognitoでEメールを送信
      // DEVELOPER(default):Amazon SESでEメールを送信(推奨)
      EmailSendingAccount: Cognito.EmailSendingAccountType.COGNITO_DEFAULT,
    },
    // ユーザーの属性情報更新の設定
    UserAttributeUpdateSettings: {
      // 更新するために認証が必要な属性(email/phone_number)
      AttributesRequireVerificationBeforeUpdate: [
        Cognito.VerifiedAttributeType.EMAIL,
      ],
    },
    // 検証メッセージのテンプレート
    VerificationMessageTemplate: {
      // 検証オプション
      // CONFIRM_WITH_CODE:検証コードに検証
      // CONFIRM_WITH_LINK:検証用リンク押下による検証
      DefaultEmailOption: Cognito.DefaultEmailOptionType.CONFIRM_WITH_CODE,
      // 検証コード送信メールのタイトル(検証コードによる検証の場合)
      EmailSubject: "ユーザー登録完了",
      // 検証コード送信メールの本文(検証コードによる検証の場合)
      EmailMessage:
        "検証コード「{####}」を入力し、ユーザーを有効化してください。",
      // 検証コード送信メールのタイトル(検証用リンク押下による検証の場合)
      EmailSubjectByLink: "ユーザー登録完了",
      // 検証コード送信メールの本文(検証用リンク押下による検証の場合)
      EmailMessageByLink:
        "{##こちら##}の検証リンクを押下し、ユーザーを有効化してください。",
      // 検証コード送信SMSの本文
      SmsMessage:
        "検証コード「{####}」を入力し、ユーザーを有効化してください。",
    },
    // ユーザープールのアドオン設定
    UserPoolAddOns: {
      // 高度なセキュリティ設定(OFF/AUDIT/ENFORCED)
      AdvancedSecurityMode: Cognito.AdvancedSecurityModeType.OFF,
    },
    // タグ
    UserPoolTags: {
      NAME: "TAG_SAMPLE",
    },
    // Lambdaトリガーの設定
    // 設定すると、ユーザープールにアクションがあった際にLambda関数を呼び出すことができる
    LambdaConfig: {},
  };
  try {
    const command = new Cognito.CreateUserPoolCommand(input);
    const res = await cognitoClient.send(command);
    if (!res.UserPool) return false;
    return res.UserPool;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * ユーザープール名の一覧取得
 * @returns ユーザープール名の一覧
 */
const listUserPools = async (): Promise<Cognito.UserPoolDescriptionType[]> => {
  const userPools: Cognito.UserPoolDescriptionType[] = [];
  try {
    let nextToken = null;
    while (nextToken !== undefined) {
      const command = new Cognito.ListUserPoolsCommand({
        MaxResults: 60,
        NextToken: nextToken,
      });
      const res = await cognitoClient.send(command);
      if (res.UserPools && res.UserPools.length > 0)
        userPools.push(...res.UserPools);
      else break;
      nextToken = res.NextToken;
    }
  } catch (err) {
    console.error(err);
  }
  return userPools;
};

/**
 * ユーザープールの削除
 * @param userPoolId ユーザープールID
 * @returns true:成功/false:失敗
 */
const deleteUserPool = async (userPoolId: string): Promise<boolean> => {
  try {
    const command = new Cognito.DeleteUserPoolCommand({
      UserPoolId: userPoolId,
    });
    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * アプリケーションクライアントの作成
 * @param userPoolId ユーザープールID
 * @param clientName 作成するアプリケーションクライアント名
 * @returns アプリケーションクライアント情報/false:作成失敗
 */
const createUserPoolClient = async (
  userPoolId: string,
  clientName: string
): Promise<Cognito.UserPoolClientType | false> => {
  try {
    const command = new Cognito.CreateUserPoolClientCommand({
      // アプリケーションクライアント作成先のユーザープールID
      UserPoolId: userPoolId,
      // アプリケーションクライアント名
      ClientName: clientName,
      // false(default):クライアントのシークレットを作成しない
      GenerateSecret: false,
      // 許可する認証フロー
      ExplicitAuthFlows: [
        "ALLOW_ADMIN_USER_PASSWORD_AUTH", // 管理ユーザーによるユーザー名とパスワードでの認証(サーバーサイドで利用)
        "ALLOW_CUSTOM_AUTH", // Lambdaトリガーベースのカスタム認証
        "ALLOW_REFRESH_TOKEN_AUTH", // リフレッシュトークンベースの認証
        "ALLOW_USER_PASSWORD_AUTH", // ユーザー名とパスワードでの認証
        "ALLOW_USER_SRP_AUTH", // SRP(セキュアリモートパスワード)プロトコルベースの認証(最もセキュアなため、利用推奨)
      ],
      // 認証フローセッションの持続期間(分)
      AuthSessionValidity: 3,
      // 各トークンの有効期限の単位: seconds/minutes/hours/days
      TokenValidityUnits: {
        IdToken: Cognito.TimeUnitsType.MINUTES, // IDトークン
        AccessToken: Cognito.TimeUnitsType.MINUTES, // アクセストークン
        RefreshToken: Cognito.TimeUnitsType.DAYS, // リフレッシュトークン
      },
      // IDトークンの有効期限
      IdTokenValidity: 60,
      // アクセストークンの有効期限
      AccessTokenValidity: 60,
      // リフレッシュトークンの有効期限
      RefreshTokenValidity: 3,
      // トークンの取り消しを有効化
      EnableTokenRevocation: true,
      // ユーザー存在エラーの防止
      PreventUserExistenceErrors: "ENABLED",
      // 許可するサインイン後のリダイレクト先URL群
      CallbackURLs: ["https://www.google.com/"],
      // 許可するサインアウト後のリダイレクト先URL群
      LogoutURLs: [],
      // サポートするIDプロバイダー
      SupportedIdentityProviders: ["COGNITO"],
      // false(default)/true:アプリケーションクライアントでOAuth2.0の機能を利用可能とする
      AllowedOAuthFlowsUserPoolClient: true,
      // OAuth2.0で利用する認可フロー(code/implicit/client_credentials)
      AllowedOAuthFlows: [Cognito.OAuthFlowType.code],
      // 許可するOAuth2.0のスコープ(openid/aws.cognito.signin.user.admin)
      AllowedOAuthScopes: ["openid"],
    });
    const res = await cognitoClient.send(command);
    if (!res.UserPoolClient) return false;
    return res.UserPoolClient;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * アプリケーションクライアント一覧の取得
 * @param userPoolId ユーザープールID
 * @returns ユーザープールクライアント一覧
 */
const listUserPoolClients = async (
  userPoolId: string
): Promise<Cognito.UserPoolClientDescription[]> => {
  const userPoolClients: Cognito.UserPoolClientDescription[] = [];
  try {
    let nextToken = null;
    while (nextToken !== undefined) {
      const command = new Cognito.ListUserPoolClientsCommand({
        UserPoolId: userPoolId,
        MaxResults: 60,
        NextToken: nextToken,
      });
      const res = await cognitoClient.send(command);
      if (res.UserPoolClients && res.UserPoolClients.length > 0)
        userPoolClients.push(...res.UserPoolClients);
      else break;
      nextToken = res.NextToken;
    }
  } catch (err) {
    console.error(err);
  }
  return userPoolClients;
};

/**
 * アプリケーションクライアントの削除
 * @param userPoolId ユーザープールID
 * @param clientId 削除対象のアプリケーションクライアントのID
 * @returns true:成功/false:失敗
 */
const deleteUserPoolClient = async (
  userPoolId: string,
  clientId: string
): Promise<boolean> => {
  try {
    const command = new Cognito.DeleteUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
    });
    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * サインアップ（ユーザーによるアカウント作成）
 * @param clientId アプリケーションクライアントID
 * @param username 新規ユーザー名
 * @param email メールアドレス
 * @param rank ランク
 * @param password パスワード
 * @returns ユーザー情報/false:サインアップ失敗
 */
const signUp = async (
  clientId: string,
  username: string,
  email: string,
  rank: string,
  password: string
): Promise<Cognito.SignUpCommandOutput | false> => {
  try {
    const command = new Cognito.SignUpCommand({
      ClientId: clientId,
      Username: username,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "custom:rank", Value: rank },
      ],
    });
    const res = await cognitoClient.send(command);
    return res;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * 管理者による検証コードなしでのサインアップ検証(Confirm)
 * @param userPoolId ユーザープールID
 * @param username ユーザー名
 * @returns true:成功/false:失敗
 */
const adminConfirmSignUp = async (
  userPoolId: string,
  username: string
): Promise<boolean> => {
  try {
    const command = new Cognito.AdminConfirmSignUpCommand({
      UserPoolId: userPoolId,
      Username: username,
    });
    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * ユーザーによるサインアップ検証(Confirm)
 * @param userPoolClientId アプリケーションクライアントのID
 * @param username ユーザー名
 * @param confirmationCode Confirm Code
 * @returns true:成功/false:失敗
 */
const confirmSignUp = async (
  userPoolClientId: string,
  username: string,
  confirmationCode: string
): Promise<boolean> => {
  try {
    const command = new Cognito.ConfirmSignUpCommand({
      ClientId: userPoolClientId,
      Username: username,
      ConfirmationCode: confirmationCode,
    });
    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * アカウント作成（ユーザー自身でのサインアップを許可しない場合に利用）
 * AdminCreateUserCommand関数でユーザー作成後に
 * AdminSetUserPasswordCommandを実行して一時パスワードを変更すれば、
 * すぐにユーザーを利用できるようになる
 * @param userPoolId ユーザープールID
 * @param username 新規ユーザー名
 * @param email メールアドレス
 * @param rank ランク
 * @returns ユーザー情報/false:アカウント作成失敗
 */
const adminCreateUser = async (
  userPoolId: string,
  username: string,
  email: string,
  rank: string
): Promise<Cognito.UserType | false> => {
  try {
    const command = new Cognito.AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: username,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "custom:rank", Value: rank },
      ],
    });
    const res = await cognitoClient.send(command);
    return res.User;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * ユーザーパスワードの変更
 * @param userPoolId ユーザープールID
 * @param username ユーザー名
 * @param password 新規パスワード
 * @returns true:成功/false:失敗
 */
const adminSetUserPassword = async (
  userPoolId: string,
  username: string,
  password: string
): Promise<boolean> => {
  try {
    const command = new Cognito.AdminSetUserPasswordCommand({
      UserPoolId: userPoolId, // ユーザープールID
      Username: username, // パスワード変更対象のユーザー名
      Password: password, // 新規パスワード
      Permanent: true, // true:永続パスワード/false:一時パスワード
    });
    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * ユーザーの属性値の更新
 * @param userPoolId ユーザープールID
 * @param username ユーザー名
 * @param userAttributes 更新する属性と値
 * @returns true:成功/false:失敗
 */
const adminUpdateUserAttributes = async (
  userPoolId: string,
  username: string,
  userAttributes: Cognito.AttributeType[]
): Promise<boolean> => {
  try {
    const command = new Cognito.AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: username,
      UserAttributes: userAttributes,
    });
    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * ユーザー一覧の取得
 * @param userPoolId ユーザープールID
 * @returns ユーザー一覧
 */
const listUsers = async (userPoolId: string): Promise<Cognito.UserType[]> => {
  const users: Cognito.UserType[] = [];
  try {
    let nextToken = null;
    while (nextToken !== undefined) {
      const command = new Cognito.ListUsersCommand({
        UserPoolId: userPoolId,
        Limit: 60,
        PaginationToken: nextToken,
      });
      const res = await cognitoClient.send(command);
      if (res.Users && res.Users.length > 0) users.push(...res.Users);
      else break;
      nextToken = res.PaginationToken;
    }
  } catch (err) {
    console.error(err);
  }
  return users;
};

/**
 * ユーザー情報の取得
 * @param applicationClientId アプリケーションクライアントID
 * @returns ユーザー情報/false:取得失敗
 */
const getUser = async (
  applicationClientId: string
): Promise<Cognito.AdminGetUserCommandOutput | false> => {
  try {
    const command = new Cognito.GetUserCommand({
      AccessToken: applicationClientId,
    });
    const res = await cognitoClient.send(command);
    return res;
  } catch (err) {
    console.error((err as Cognito.InternalErrorException).name);
    return false;
  }
};

/**
 * 管理者によるユーザー情報の取得
 * @param userPoolId ユーザープールID
 * @param username ユーザー名
 * @returns ユーザー情報/false:取得失敗
 */
const adminGetUser = async (
  userPoolId: string,
  username: string
): Promise<Cognito.AdminGetUserCommandOutput | false> => {
  try {
    const command = new Cognito.AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    });
    const res = await cognitoClient.send(command);
    return res;
  } catch (err) {
    console.error((err as Cognito.InternalErrorException).name);
    return false;
  }
};

/**
 * サインイン
 * @param clientId アプリケーションクライアントID
 * @param username ユーザー名
 * @param password パスワード
 * @returns サインイン結果/false:失敗
 */
const initiateAuth = async (
  clientId: string,
  username: string,
  password: string
): Promise<Cognito.AdminInitiateAuthCommandOutput | false> => {
  try {
    const command = new Cognito.InitiateAuthCommand({
      ClientId: clientId,
      // ユーザープールの設定でALLOW_USER_PASSWORD_AUTHの有効化が必要
      AuthFlow: Cognito.AuthFlowType.USER_PASSWORD_AUTH,
      AuthParameters: { USERNAME: username, PASSWORD: password },
    });
    const res = await cognitoClient.send(command);
    return res;
  } catch (err) {
    console.error((err as Cognito.InternalErrorException).name);
    return false;
  }
};

/**
 * 管理者によるサインイン
 * @param userPoolId ユーザープールID
 * @param clientId アプリケーションクライアントID
 * @param username ユーザー名
 * @param password パスワード
 * @returns サインイン結果/false:失敗
 */
const adminInitiateAuth = async (
  userPoolId: string,
  clientId: string,
  username: string,
  password: string
): Promise<Cognito.AdminInitiateAuthCommandOutput | false> => {
  try {
    const command = new Cognito.AdminInitiateAuthCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      // ユーザープールの設定でALLOW_ADMIN_USER_PASSWORD_AUTHの有効化が必要
      AuthFlow: Cognito.AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
      AuthParameters: { USERNAME: username, PASSWORD: password },
    });
    const res = await cognitoClient.send(command);
    return res;
  } catch (err) {
    console.error((err as Cognito.InternalErrorException).name);
    return false;
  }
};

/**
 * サインアウト
 * @param accessToken サインイン中のユーザーのアクセストークン
 * @returns true:成功/false:失敗
 */
const globalSignOut = async (accessToken: string): Promise<boolean> => {
  try {
    const command = new Cognito.GlobalSignOutCommand({
      AccessToken: accessToken,
    });
    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error((err as Cognito.InternalErrorException).name);
    return false;
  }
};

/**
 * 管理者によるサインアウト
 * @param userPoolId ユーザープールID
 * @param username サインアウトするユーザー名
 * @returns true:成功/false:失敗
 */
const adminUserGlobalSignOut = async (
  userPoolId: string,
  username: string
): Promise<boolean> => {
  try {
    const command = new Cognito.AdminUserGlobalSignOutCommand({
      UserPoolId: userPoolId,
      Username: username,
    });
    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error((err as Cognito.InternalErrorException).name);
    return false;
  }
};

/**
 * パスワード変更
 * @param previousPassword 現在のパスワード
 * @param proposedPassword 新規パスワード
 * @param accessToken アクセストークン
 * @returns true:成功/false:失敗
 */
const changePassword = async (
  previousPassword: string,
  proposedPassword: string,
  accessToken: string
): Promise<boolean> => {
  try {
    const command = new Cognito.ChangePasswordCommand({
      PreviousPassword: previousPassword,
      ProposedPassword: proposedPassword,
      AccessToken: accessToken,
    });
    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error((err as Cognito.InternalErrorException).name);
    return false;
  }
};

/**
 * ユーザーパスワードのリセット要求：認証コードが記述されたメールが送信される
 * @param userPoolId ユーザープールID
 * @param username 削除対象のユーザー名
 * @returns true:成功/false:失敗
 */
const adminResetUserPassword = async (
  userPoolId: string,
  username: string
): Promise<boolean> => {
  try {
    const command = new Cognito.AdminResetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: username,
    });
    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error((err as Cognito.InternalErrorException).name);
    return false;
  }
};

/**
 * パスワード忘却時の新しいパスワードの設定と検証(Confirm)
 * @param userPoolId ユーザープールID
 * @param username 対象のユーザー名
 * @param password 新しいパスワード
 * @param confirmationCode 検証コード
 * @returns true:成功/false:失敗
 */
const confirmForgotPassword = async (
  userPoolClientId: string,
  username: string,
  password: string,
  confirmationCode: string
): Promise<boolean> => {
  try {
    const command = new Cognito.ConfirmForgotPasswordCommand({
      ClientId: userPoolClientId,
      Username: username,
      Password: password,
      ConfirmationCode: confirmationCode,
    });
    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error((err as Cognito.InternalErrorException).name);
    return false;
  }
};

/**
 * ユーザーの削除
 * @param accessToken アクセストークン
 * @returns true:成功/false:失敗
 */
const deleteUser = async (accessToken: string): Promise<boolean> => {
  try {
    const command = new Cognito.DeleteUserCommand({
      AccessToken: accessToken,
    });
    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error((err as Cognito.InternalErrorException).name);
    return false;
  }
};

/**
 * 管理者によるユーザーの削除
 * @param userPoolId ユーザープールID
 * @param username 削除対象のユーザー名
 * @returns true:成功/false:失敗
 */
const adminDeleteUser = async (
  userPoolId: string,
  username: string
): Promise<boolean> => {
  try {
    const command = new Cognito.AdminDeleteUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    });
    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error((err as Cognito.InternalErrorException).name);
    return false;
  }
};

/**
 * 各種Cognito操作関数の実行
 * @returns
 */
const runAll = async (): Promise<void> => {
  const userPoolName = "test";
  const account = [
    {
      username: "User1",
      email: "xxxxx@gmail.com",
      rank: "A1",
      password: "password",
    },
    {
      username: "User2",
      email: "xxxxx@gmail.com",
      rank: "B2",
      password: "password",
    },
  ];

  // ユーザープールの作成
  console.log(">>> Create user pool");
  const userPool = await createUserPool(userPoolName);
  if (!userPool) {
    console.error("Failed to create user pool");
    return;
  }
  console.log(userPool);

  // ユーザープール一覧の取得
  console.log(">>> Get user pool list");
  const userPoolList = await listUserPools();
  console.log(userPoolList);

  // アプリケーションクライアントの作成
  console.log(">>> Create user pool client");
  const clientName = "client";
  const userPoolClient = await createUserPoolClient(userPool.Id, clientName);
  if (!userPoolClient) {
    console.error("Failed to create user pool client");
    return;
  }
  console.log(userPoolClient.ClientId);

  // アプリケーションクライアントの一覧取得
  console.log(">>> Get user pool client list");
  for (const userPool of userPoolList) {
    console.log(userPool.Name);
    const userPoolClientList = await listUserPoolClients(userPool.Id);
    console.log(userPoolClientList);
  }

  // サインアップ
  console.log(">>> SignUp");
  const resSignup = await signUp(
    userPoolClient.ClientId,
    account[0].username,
    account[0].email,
    account[0].rank,
    account[0].password
  );
  if (!resSignup) {
    console.error("Failed to sign up");
    return;
  }
  console.log(JSON.stringify(resSignup, null, "  "));

  // 管理者による検証コードなしでのサインアップ検証(Confirm)
  console.log(">>> Confirm sign up by administrator");
  const resAdminConfirmSignUp = await adminConfirmSignUp(
    userPool.Id,
    account[0].username
  );
  if (!resAdminConfirmSignUp) {
    console.error("Failed to confirm signup by administrator");
    return;
  }
  console.log(resAdminConfirmSignUp);

  // サインイン
  console.log(">>> SignIn");
  const resSignIn = await initiateAuth(
    userPoolClient.ClientId,
    account[0].username,
    account[0].password
  );
  if (!resSignIn) {
    console.error("Failed to sign in");
    return;
  }
  console.log(resSignIn);

  // ユーザー情報の取得
  console.log(">>> Get user");
  const user1 = await getUser(resSignIn.AuthenticationResult.AccessToken);
  if (!user1) {
    console.error("Failed to get user info");
    return;
  }
  console.log(JSON.stringify(user1, null, "  "));

  // パスワード変更
  console.log(">>> Change password");
  const resChangePassword = await changePassword(
    account[0].password,
    account[0].password,
    resSignIn.AuthenticationResult.AccessToken
  );
  if (!resChangePassword) {
    console.error("Failed to change password");
    return;
  }
  console.log(resChangePassword);

  // サインアウト
  console.log(">>> SignOut");
  const resSignOut = await globalSignOut(
    resSignIn.AuthenticationResult.AccessToken
  );
  if (!resSignOut) {
    console.error("Failed to sign out");
    return;
  }
  console.log(resSignOut);

  // ユーザーの作成
  console.log(">>> Create user");
  const resAdminCreateUser = await adminCreateUser(
    userPool.Id,
    account[1].username,
    account[1].email,
    account[1].rank
  );
  if (!resAdminCreateUser) {
    console.error("Failed to admin create user");
    return;
  }
  console.log(resAdminCreateUser);

  // ユーザーのパスワード変更
  console.log(">>> Set user password");
  const resAdminSetUserPassword = await adminSetUserPassword(
    userPool.Id,
    account[1].username,
    account[1].password
  );
  if (!resAdminSetUserPassword) {
    console.error("Failed to set user password");
    return;
  }
  console.log(resAdminSetUserPassword);

  // メール検証
  console.log(">>> Set email verified");
  const resAdminUpdateUserAttributes = await adminUpdateUserAttributes(
    userPool.Id,
    account[1].username,
    [{ Name: "email_verified", Value: "true" }]
  );
  if (!resAdminUpdateUserAttributes) {
    console.error("Failed to update user attributes");
    return;
  }
  console.log(resAdminUpdateUserAttributes);

  // 管理者によるサインイン
  console.log(">>> Administrator SignIn");
  const resAdminSignIn = await adminInitiateAuth(
    userPool.Id,
    userPoolClient.ClientId,
    account[1].username,
    account[1].password
  );
  if (!resAdminSignIn) {
    console.error("Failed to sign in by administrator");
    return;
  }
  console.log(resAdminSignIn);

  // 管理者によるユーザー情報の取得
  console.log(">>> Get user by administrator");
  const user2 = await adminGetUser(userPool.Id, account[1].username);
  if (!user2) {
    console.error("Failed to get user info by administrator");
    return;
  }
  console.log(JSON.stringify(user2, null, "  "));

  // 管理者によるサインアウト
  console.log(">>> AdminSignOut");
  const resAdminSignOut = await adminUserGlobalSignOut(
    userPool.Id,
    account[1].username
  );
  if (!resAdminSignOut) {
    console.error("Failed to sign out by administrator");
    return;
  }
  console.log(resAdminSignOut);

  // ユーザー一覧の取得
  console.log(">>> Get user list");
  const userList = await listUsers(userPool.Id);
  console.log(JSON.stringify(userList, null, "  "));

  // ユーザーパスワードのリセット要求：認証コードが記述されたメールが送信される
  console.log(">>> Reset user password");
  const resAdminResetUserPassword = await adminResetUserPassword(
    userPool.Id,
    account[1].username
  );
  if (!resAdminResetUserPassword) {
    console.error("Failed to reset user password");
    return;
  }
  console.log(resAdminResetUserPassword);

  // 管理者によるユーザーの削除
  console.log(">>> Delete user by administrator");
  const resAdminDeleteUser = await adminDeleteUser(
    userPool.Id,
    account[1].username
  );
  if (!resAdminDeleteUser) {
    console.error("Failed to delete user by administrator");
    return;
  }
  console.log(resAdminDeleteUser);

  // アプリケーションクライアントの削除
  console.log(">>> Delete user pool client");
  const resDeleteUserPoolClient = await deleteUserPoolClient(
    userPool.Id,
    userPoolClient.ClientId
  );
  if (!resDeleteUserPoolClient) {
    console.error("Failed to delete user pool client");
    return;
  }
  console.log(resDeleteUserPoolClient);

  // ユーザープールの削除
  console.log(">>> Delete user pool");
  const resDeleteUserPool = await deleteUserPool(userPool.Id);
  if (!resDeleteUserPool) {
    console.error("Failed to delete user pool");
    return;
  }
  console.log(resDeleteUserPool);
};
runAll();

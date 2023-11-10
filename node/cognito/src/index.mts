import * as Cognito from "@aws-sdk/client-cognito-identity-provider";
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
    // サインアップ時にユーザー名の代わりに利用可能な属性(email/phone_number)
    UsernameAttributes: [Cognito.UsernameAttributeType.EMAIL],
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
      // true:ユーザーによるサインアップを有効化/false:管理者によるユーザー作成のみ許可
      AllowAdminCreateUserOnly: false,
    },
    // 追加のカスタム属性(最大50個まで)
    Schema: [
      {
        // 属性名(「custom:属性名」で利用する)
        Name: "username",
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
          MinLength: "4",
          MaxLength: "8",
        },
      },
    ],
    // ユーザーのConfirm(確認)方法
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
      // 更新するために認証が必要な属性
      AttributesRequireVerificationBeforeUpdate: ["email"],
    },
    // 認証メールのタイトル
    EmailVerificationSubject: "認証コード",
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
      UserPoolId: userPoolId, // アプリケーションクライアント作成先のユーザープールID
      ClientName: clientName, // アプリケーションクライアント名
      GenerateSecret: false, // false(default):クライアントのシークレットを生成しない
      ExplicitAuthFlows: [
        // 許可する認証フロー
        "ALLOW_ADMIN_USER_PASSWORD_AUTH", // 管理ユーザーパスワードによる認証
        "ALLOW_CUSTOM_AUTH", // Lambdaトリガーベースのカスタム認証
        "ALLOW_REFRESH_TOKEN_AUTH", // リフレッシュトークンベースの認証
        "ALLOW_USER_PASSWORD_AUTH", // ユーザー名とパスワードによる認証
        "ALLOW_USER_SRP_AUTH", // SRP(セキュアリモートパスワード)プロトコルベースの認証
      ],
      AuthSessionValidity: 3, // 認証フローセッションの持続期間(分)
      TokenValidityUnits: {
        // 各トークンの有効期限の単位: seconds/minutes/hours/days
        RefreshToken: Cognito.TimeUnitsType.DAYS,
        AccessToken: Cognito.TimeUnitsType.MINUTES,
        IdToken: Cognito.TimeUnitsType.MINUTES,
      },
      RefreshTokenValidity: 3, // 更新トークンの有効期限
      AccessTokenValidity: 60, // アクセストークンの有効期限
      IdTokenValidity: 60, // IDトークンの有効期限
      EnableTokenRevocation: true, // トークンの取り消しを有効化
      PreventUserExistenceErrors: "ENABLED", // ユーザー存在エラーの防止
      CallbackURLs: [], // 許可するサインイン後のリダイレクト先URL群
      LogoutURLs: [], // 許可するサインアウト後のリダイレクト先URL群
      SupportedIdentityProviders: ["COGNITO"], // サポートするIDプロバイダー
      AllowedOAuthFlows: [], // OAuth2.0許可タイプ
      AllowedOAuthScopes: [], // 許可するOAuth2.0のスコープ
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
 * @param email 新規ユーザーのメールアドレス(ユーザー名として利用)
 * @param password パスワード
 * @param username 新規ユーザー名
 * @returns ユーザー情報/false:サインアップ失敗
 */
const signUp = async (
  clientId: string,
  email: string,
  password: string,
  username: string
): Promise<Cognito.SignUpCommandOutput | false> => {
  try {
    const command = new Cognito.SignUpCommand({
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: "custom:username", Value: username }],
    });
    const res = await cognitoClient.send(command);
    return res;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * 管理者による確認コードなしでのサインアップ確認(Confirm)
 * @param userPoolId ユーザープールID
 * @param email メールアドレス(ユーザー名として利用)
 * @returns true:成功/false:失敗
 */
const adminConfirmSignUp = async (
  userPoolId: string,
  email: string
): Promise<boolean> => {
  try {
    const command = new Cognito.AdminConfirmSignUpCommand({
      UserPoolId: userPoolId,
      Username: email,
    });
    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * ユーザーによるサインアップ確認(Confirm)
 * @param userPoolClientId アプリケーションクライアントのID
 * @param email メールアドレス(ユーザー名として利用)
 * @param confirmationCode Confirm Code
 * @returns true:成功/false:失敗
 */
const confirmSignUp = async (
  userPoolClientId: string,
  email: string,
  confirmationCode: string
): Promise<boolean> => {
  try {
    const command = new Cognito.ConfirmSignUpCommand({
      ClientId: userPoolClientId,
      Username: email,
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
 * @param email 新規ユーザーのメールアドレス(ユーザー名として利用)
 * @param username 新規ユーザー名
 * @returns ユーザー情報/false:アカウント作成失敗
 */
const adminCreateUser = async (
  userPoolId: string,
  email: string,
  username: string
): Promise<Cognito.UserType | false> => {
  try {
    const command = new Cognito.AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributes: [{ Name: "custom:username", Value: username }],
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
 * @param email メールアドレス(ユーザー名として利用)
 * @param password 新規パスワード
 * @returns true:成功/false:失敗
 */
const adminSetUserPassword = async (
  userPoolId: string,
  email: string,
  password: string
): Promise<boolean> => {
  try {
    const command = new Cognito.AdminSetUserPasswordCommand({
      UserPoolId: userPoolId, // ユーザープールID
      Username: email, // パスワード変更対象のユーザー名
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
 * @param email メールアドレス(ユーザー名として利用)
 * @param userAttributes 更新する属性と値
 * @returns true:成功/false:失敗
 */
const adminUpdateUserAttributes = async (
  userPoolId: string,
  email: string,
  userAttributes: Cognito.AttributeType[]
): Promise<boolean> => {
  try {
    const command = new Cognito.AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributes: userAttributes,
    });
    const res = await cognitoClient.send(command);
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
 * @param userPoolId ユーザープールID
 * @param email メールアドレス(ユーザー名として利用)
 * @returns ユーザー情報/false:取得失敗
 */
const adminGetUser = async (
  userPoolId: string,
  email: string
): Promise<Cognito.AdminGetUserCommandOutput | false> => {
  try {
    const command = new Cognito.AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: email,
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
 * @param userPoolId ユーザープールID
 * @param clientId アプリケーションクライアントID
 * @param email メールアドレス(ユーザー名として利用)
 * @param password パスワード
 * @returns サインイン結果/false:失敗
 */
const adminInitiateAuth = async (
  userPoolId: string,
  clientId: string,
  email: string,
  password: string
): Promise<Cognito.AdminInitiateAuthCommandOutput | false> => {
  try {
    const command = new Cognito.AdminInitiateAuthCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      // ユーザープールの設定でALLOW_ADMIN_USER_PASSWORD_AUTHの有効化が必要
      AuthFlow: Cognito.AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    });
    const res = await cognitoClient.send(command);
    return res;
  } catch (err) {
    console.error((err as Cognito.InternalErrorException).name);
    return false;
  }
};

/**
 * ログアウト
 * @param userPoolId ユーザープールID
 * @param email ログアウトするメールアドレス(ユーザー名として利用)
 * @returns true:成功/false:失敗
 */
const adminUserGlobalSignOut = async (
  userPoolId: string,
  email: string
): Promise<boolean> => {
  try {
    const command = new Cognito.AdminUserGlobalSignOutCommand({
      UserPoolId: userPoolId,
      Username: email,
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
 * @param email 削除対象のメールアドレス(ユーザー名として利用)
 * @returns true:成功/false:失敗
 */
const adminResetUserPassword = async (
  userPoolId: string,
  email: string
): Promise<boolean> => {
  try {
    const command = new Cognito.AdminResetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
    });
    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error((err as Cognito.InternalErrorException).name);
    return false;
  }
};

/**
 * パスワード忘却時の新しいパスワードの設定と確認(Confirm)
 * @param userPoolId ユーザープールID
 * @param email 削除対象のメールアドレス(ユーザー名として利用)
 * @param password 新しいパスワード
 * @param confirmationCode 確認コード
 * @returns true:成功/false:失敗
 */
const confirmForgotPassword = async (
  userPoolClientId: string,
  email: string,
  password: string,
  confirmationCode: string
): Promise<boolean> => {
  try {
    const command = new Cognito.ConfirmForgotPasswordCommand({
      ClientId: userPoolClientId,
      Username: email,
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
 * @param userPoolId ユーザープールID
 * @param email 削除対象のメールアドレス(ユーザー名として利用)
 * @returns true:成功/false:失敗
 */
const adminDeleteUser = async (
  userPoolId: string,
  email: string
): Promise<boolean> => {
  try {
    const command = new Cognito.AdminDeleteUserCommand({
      UserPoolId: userPoolId,
      Username: email,
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
      username: "user1",
      email: "xxx@gmail.com",
      password: "password",
    },
    {
      username: "user2",
      email: "yyy@gmail.com",
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
    account[0].email,
    account[0].password,
    account[0].username
  );
  if (!resSignup) {
    console.error("Failed to sign up");
    return;
  }
  console.log(JSON.stringify(resSignup, null, "  "));

  // 管理者による確認コードなしでのサインアップ確認(Confirm)
  console.log(">>> Confirm sign up by administrator");
  const resAdminConfirmSignUp = await adminConfirmSignUp(
    userPool.Id,
    account[0].email
  );
  if (!resAdminConfirmSignUp) {
    console.error("Failed to confirm signup by administrator");
    return;
  }
  console.log(resAdminConfirmSignUp);

  // ユーザーの作成
  console.log(">>> Create user");
  const resAdminCreateUser = await adminCreateUser(
    userPool.Id,
    account[1].email,
    account[1].username
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
    account[1].email,
    account[1].password
  );
  if (!resAdminSetUserPassword) {
    console.error("Failed to set user password");
    return;
  }
  console.log(resAdminSetUserPassword);

  console.log(">>> Set email verified");
  const resAdminUpdateUserAttributes = await adminUpdateUserAttributes(
    userPool.Id,
    account[1].email,
    [{ Name: "email_verified", Value: "true" }]
  );
  if (!resAdminUpdateUserAttributes) {
    console.error("Failed to update user attributes");
    return;
  }
  console.log(resAdminUpdateUserAttributes);

  // ユーザー一覧の取得
  console.log(">>> Get user list");
  const userList = await listUsers(userPool.Id);
  console.log(JSON.stringify(userList, null, "  "));

  // ユーザー情報の取得
  console.log(">>> Get user");
  const user = await adminGetUser(userPool.Id, account[1].email);
  if (!user) {
    console.error("Failed to get user info");
    return;
  }
  console.log(JSON.stringify(user, null, "  "));

  // サインイン
  console.log(">>> SignIn");
  const resSignIn = await adminInitiateAuth(
    userPool.Id,
    userPoolClient.ClientId,
    account[1].email,
    account[1].password
  );
  if (!resSignIn) {
    console.error("Failed to sign in");
    return;
  }
  console.log(resSignIn);

  // サインアウト
  console.log(">>> SignOut");
  const resSignOut = await adminUserGlobalSignOut(
    userPool.Id,
    account[1].email
  );
  if (!resSignOut) {
    console.error("Failed to sign out");
    return;
  }
  console.log(resSignOut);

  // ユーザーパスワードのリセット要求：認証コードが記述されたメールが送信される
  console.log(">>> Reset user password");
  const resAdminResetUserPassword = await adminResetUserPassword(
    userPool.Id,
    account[1].email
  );
  if (!resAdminResetUserPassword) {
    console.error("Failed to reset user password");
    return;
  }
  console.log(resAdminResetUserPassword);

  // ユーザーの削除
  console.log(">>> Delete user");
  const resAdminDeleteUser = await adminDeleteUser(
    userPool.Id,
    account[1].email
  );
  if (!resAdminDeleteUser) {
    console.error("Failed to delete user");
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

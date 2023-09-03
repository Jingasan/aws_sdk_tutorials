import * as S3 from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as fs from "fs";

// 接続先設定（S3のMockであるs3rverを利用）
const s3config: S3.S3ClientConfig = {
  forcePathStyle: true,
  credentials: {
    accessKeyId: "S3RVER",
    secretAccessKey: "S3RVER",
  },
  endpoint: "http://localhost:4568",
};
const s3client = new S3.S3Client(s3config);

// S3バケットの作成
const runCreateBucket = async (bucketName: string): Promise<boolean> => {
  try {
    const createBucketParam: S3.CreateBucketCommandInput = {
      Bucket: bucketName,
    };
    const res = await s3client.send(
      new S3.CreateBucketCommand(createBucketParam)
    );
    console.log("Success", res);
    return true;
  } catch (err) {
    console.log("Error", err);
    return false;
  }
};

// S3バケットへのBucket Policyの適用
const runPutBucketPolicy = async (
  putBucketPolicyParam: S3.PutBucketPolicyCommandInput
): Promise<boolean> => {
  try {
    const res = await s3client.send(
      new S3.PutBucketPolicyCommand(putBucketPolicyParam)
    );
    console.log("Success", res);
    return true;
  } catch (err) {
    console.log("Error", err);
    return false;
  }
};

// S3バケットへのCORSの設定
const runPutBucketCORS = async (
  putBucketCORSParam: S3.PutBucketCorsCommandInput
): Promise<boolean> => {
  try {
    const res = await s3client.send(
      new S3.PutBucketCorsCommand(putBucketCORSParam)
    );
    console.log("Success", res);
    return true;
  } catch (err) {
    console.log("Error", err);
    return false;
  }
};

// S3バケット一覧の取得
const runListBuckets = async (): Promise<string[]> => {
  const bucketlist: string[] = [];
  try {
    const data = await s3client.send(new S3.ListBucketsCommand({}));
    data.Buckets?.forEach((bucket: S3.Bucket) => {
      if (bucket.Name) bucketlist.push(bucket.Name);
    });
  } catch (err) {
    console.log("Error", err);
  }
  console.log("Success", bucketlist);
  return bucketlist;
};

// S3バケットへのオブジェクト作成
const runPutObject = async (
  bucketName: string,
  key: string,
  json: any
): Promise<boolean> => {
  try {
    const putObjectParam: S3.PutObjectCommandInput = {
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(json),
    };
    const res = await s3client.send(new S3.PutObjectCommand(putObjectParam));
    console.log("Success", res);
    return true;
  } catch (err) {
    console.log("Error", err);
    return false;
  }
};

// S3バケットからのオブジェクト取得
const runGetObject = async (
  bucketName: string,
  key: string
): Promise<string | undefined> => {
  try {
    const getObjectParam: S3.GetObjectCommandInput = {
      Bucket: bucketName,
      Key: key,
    };
    const res = await s3client.send(new S3.GetObjectCommand(getObjectParam));
    console.log("Success");
    return await res.Body?.transformToString();
  } catch (err) {
    console.log("Error", err);
    return undefined;
  }
};

// S3バケットへのファイルアップロード
const runUploadFile = async (bucketName: string): Promise<boolean> => {
  try {
    const putObjectParam: S3.PutObjectCommandInput = {
      Bucket: bucketName,
      Key: "image.png",
      Body: fs.createReadStream("image.png"),
    };
    const res = await s3client.send(new S3.PutObjectCommand(putObjectParam));
    console.log("Success", res);
    return true;
  } catch (err) {
    console.log("Error", err);
    return false;
  }
};

// S3バケットのオブジェクト一覧取得(1000件以上)
const runListObjects = async (
  bucketName: string,
  prefix: string
): Promise<string[]> => {
  const listObjectsParam: S3.ListObjectsCommandInput = {
    Bucket: bucketName,
    Prefix: prefix,
  };
  let truncated: boolean | undefined = true;
  let pageMarker;
  let filelist: string[] = [];
  while (truncated) {
    try {
      const res = await s3client.send(
        new S3.ListObjectsCommand(listObjectsParam)
      );
      res.Contents?.forEach((item) => {
        if (item.Key) filelist.push(item.Key);
      });
      truncated = res.IsTruncated;
      if (truncated) {
        pageMarker = res.Contents?.slice(-1)[0].Key;
        listObjectsParam.Marker = pageMarker;
      }
    } catch (err) {
      console.log("Error", err);
      truncated = false;
    }
  }
  console.log(filelist);
  return filelist;
};

// Presigned URLの取得
const runGetPresignedURL = async (
  bucketName: string,
  key: string,
  json: any
): Promise<string | boolean> => {
  try {
    const putObjectParam: S3.PutObjectCommandInput = {
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(json),
    };
    const url = await getSignedUrl(
      s3client,
      new S3.PutObjectCommand(putObjectParam),
      {
        expiresIn: 3600,
      }
    );
    console.log("Success", url);
    return url;
  } catch (err) {
    console.log("Error", err);
    return false;
  }
};

// S3バケットのオブジェクト削除
const runDeleteObject = async (
  bucketName: string,
  key: string
): Promise<boolean> => {
  try {
    const deleteObjectParam: S3.DeleteObjectCommandInput = {
      Bucket: bucketName,
      Key: key,
    };
    console.log(deleteObjectParam);
    const res = await s3client.send(
      new S3.DeleteObjectCommand(deleteObjectParam)
    );
    console.log("Success", res);
    return true;
  } catch (err) {
    console.log("Error", err);
    return false;
  }
};

// S3バケットの削除
const runDeleteBucket = async (bucketName: string): Promise<boolean> => {
  try {
    const deleteBucketParam: S3.DeleteBucketCommandInput = {
      Bucket: bucketName,
    };
    const res = await s3client.send(
      new S3.DeleteBucketCommand(deleteBucketParam)
    );
    console.log("Success", res);
    return true;
  } catch (err) {
    console.log("Error", err);
    return false;
  }
};

const runAll = async () => {
  const bucketName = "test-bucket";

  // S3バケットの作成
  console.log(">>> Create bucket");
  await runCreateBucket(bucketName);

  // S3バケットへのBucket Policyの適用
  console.log(">>> Put bucket policy");
  const putBucketPolicyParam: S3.PutBucketPolicyCommandInput = {
    Bucket: bucketName,
    Policy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "sample-bucket-policy",
          Effect: "Allow",
          Principal: { AWS: "*" },
          Action: ["s3:GetObject", "s3:PutObject"],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    }),
  };
  await runPutBucketPolicy(putBucketPolicyParam);

  // S3バケットへのCORSの適用
  console.log(">>> Put bucket CORS");
  const putBucketCORSParam: S3.PutBucketCorsCommandInput = {
    Bucket: bucketName,
    CORSConfiguration: {
      CORSRules: [
        {
          ID: "Sample-Bucket-CORS",
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "PUT"],
          AllowedOrigins: ["*"],
          ExposeHeaders: [],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  };
  await runPutBucketCORS(putBucketCORSParam);

  // S3バケット一覧の取得
  console.log(">>> List buckets");
  await runListBuckets();
  const filepath = "json/sample.json";
  const json = {
    data: "sample",
  };

  // S3バケットへのオブジェクト作成
  console.log(">>> Put object");
  await runPutObject(bucketName, filepath, json);

  // S3バケットからのオブジェクト取得
  console.log(">>> Get object");
  const res = await runGetObject(bucketName, filepath);
  console.log(res !== undefined ? JSON.parse(res) : "");

  // S3バケットのオブジェクト一覧取得(1000件以上)
  console.log(">>> List objects");
  const filelist = await runListObjects(bucketName, "");

  // PresignedURLの取得
  console.log(">>> Get presigned URL");
  await runGetPresignedURL(bucketName, filepath, json);

  // S3バケットのオブジェクト削除
  console.log(">>> Delete object");
  for (const filepath of filelist) {
    if (!filepath) continue;
    await runDeleteObject(bucketName, filepath);
  }

  // S3バケットの削除
  console.log(">>> Delete bucket");
  await runDeleteBucket(bucketName);
};
runAll();

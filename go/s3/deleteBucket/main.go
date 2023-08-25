// バケットの削除
package main

import (
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

func main() {
	// セッションの作成
	sess := session.Must(session.NewSessionWithOptions(session.Options{
		SharedConfigState: session.SharedConfigEnable,
	}))

	// S3クライアントインスタンスの作成
	s3client := s3.New(sess)

	bucketName := "xxx-bucket"

	// バケットの削除
	resp, err := s3client.DeleteBucket(&s3.DeleteBucketInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to delete bucket, %v", err)
		log.Fatal(err)
	}
	fmt.Println(resp)

	// バケットが削除されるまで待機
	err = s3client.WaitUntilBucketNotExists(&s3.HeadBucketInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to create bucket, %v", err)
		log.Fatal(err)
	}
}

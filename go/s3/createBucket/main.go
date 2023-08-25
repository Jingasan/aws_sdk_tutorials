// バケットの作成
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

	// バケットの作成
	resp, err := s3client.CreateBucket(&s3.CreateBucketInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to create bucket, %v", err)
		log.Fatal(err)
	}
	fmt.Println(resp)
}

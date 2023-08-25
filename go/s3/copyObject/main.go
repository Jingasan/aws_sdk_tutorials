// バケット間でファイルをコピー
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

	fromBucketName := "xxx-bucket"
	fromObjectKey := "test.txt"
	toBucketName := "yyy-bucket"
	toObjectKey := "test.txt"

	// バケット間でのファイルコピー
	resp, err := s3client.CopyObject(
		&s3.CopyObjectInput{
			CopySource: aws.String(fromBucketName + "/" + fromObjectKey),
			Bucket:     aws.String(toBucketName),
			Key:        aws.String(toObjectKey)})
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to copy object to other bucket, %v", err)
		log.Fatal(err)
	}
	fmt.Println(resp)
}

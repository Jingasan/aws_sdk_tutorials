// オブジェクトの削除
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
	objectKey := "test.txt"

	// オブジェクトの削除
	resp, err := s3client.DeleteObject(
		&s3.DeleteObjectInput{
			Bucket: aws.String(bucketName),
			Key:    aws.String(objectKey)})
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to delete object, %v", err)
		log.Fatal(err)
	}
	fmt.Println(resp)

	// オブジェクトが削除されるまで待機
	err = s3client.WaitUntilObjectNotExists(&s3.HeadObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to delete object, %v", err)
		log.Fatal(err)
	}
}

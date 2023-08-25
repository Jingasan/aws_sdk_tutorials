// ファイルのアップロード
package main

import (
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
)

func main() {
	// セッションの作成
	sess := session.Must(session.NewSessionWithOptions(session.Options{
		SharedConfigState: session.SharedConfigEnable,
	}))

	// アップロードするファイルを開く
	filename := "test.txt"
	f, err := os.Open(filename)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to open file %q, %v", filename, err)
		log.Fatal(err)
	}

	bucketName := "xxx-bucket"
	objectKey := "test.txt"

	// Uploaderを作成し、S3オブジェクトをアップロード
	uploader := s3manager.NewUploader(sess)
	result, err := uploader.Upload(&s3manager.UploadInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
		Body:   f,
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to upload file, %v", err)
		log.Fatal(err)
	}
	fmt.Printf("file uploaded to, %s\n", aws.StringValue(&result.Location))
}

// オブジェクトの一覧取得
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

	// バケット内のオブジェクト一覧の取得
	resp, err := s3client.ListObjects(&s3.ListObjectsInput{Bucket: aws.String(bucketName)})
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to list objects in specified bucket, %v", err)
		log.Fatal(err)
	}

	// 取得したバケット内のオブジェクト一覧の表示
	for _, item := range resp.Contents {
		fmt.Println("Name:         ", *item.Key)
		fmt.Println("Last modified:", *item.LastModified)
		fmt.Println("Size:         ", *item.Size)
		fmt.Println("Storage class:", *item.StorageClass)
		fmt.Println("")
	}
}

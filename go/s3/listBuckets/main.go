// バケットの一覧取得
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

	// バケットの一覧取得
	resp, err := s3client.ListBuckets(nil)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to list buckets, %v", err)
		log.Fatal(err)
	}

	// 取得したバケット一覧の表示
	fmt.Println("Buckets:")
	for _, b := range resp.Buckets {
		fmt.Printf("* %s created on %s\n", aws.StringValue(b.Name), aws.TimeValue(b.CreationDate))
	}
}

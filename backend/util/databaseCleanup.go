package util

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
)

func DropDatabase(client *mongo.Client) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := client.Database("contestify").Drop(ctx)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Database 'contestify' has been dropped successfully")
}

func DropCollection(client *mongo.Client, collectionName string) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := client.Database("contestify").Collection(collectionName).Drop(ctx)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("Collection '%s' has been dropped successfully", collectionName)
}


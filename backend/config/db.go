package config

import (
    "context"
    "log"
    "time"

    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

var MongoClient *mongo.Client

func InitDatabase() (*mongo.Client, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    clientOptions := options.Client().ApplyURI("mongodb+srv://contestify:72riYo4qsQfE6BKs@boardocluster.ysfd69e.mongodb.net/?retryWrites=true&w=majority&appName=BoardoCluster")
    client, err := mongo.Connect(ctx, clientOptions)
    if err != nil {
        return nil, err
    }

    // Ping the database
    err = client.Ping(ctx, nil)
    if err != nil {
        return nil, err
    }

    MongoClient = client
    log.Println("Connected to MongoDB!")
    return client, nil
}
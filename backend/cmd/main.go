package main

import (
	"backend/cmd/api"
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq" // Import the PostgreSQL driver
)

func main() {
	fmt.Println("Project is running")
	connStr := "user=username dbname=mydb sslmode=disable"
	db, err := sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

	initStorage(db)

	server := api.NewAPIServer("localhost:3030", db)
	if err := server.Run(); err != nil {
		log.Fatal(err)
	}

	
}

func initStorage(db *sql.DB){
	err := db.Ping()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("DB: Successfully connected!")
}
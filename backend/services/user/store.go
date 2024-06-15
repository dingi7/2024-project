package user

import (
	"backend/types"
	"database/sql"
)

type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{
		db: db,
	}
}

func (s *Store) CreateUser(u types.User) error {
	_, err := s.db.Exec("INSERT INTO users (name, email) VALUES ($1, $2)", u.FirstName, u.Email)
	return err
}

func (s *Store) GetUserByEmail(email string) (*types.User, error) {
	var u types.User
	err := s.db.QueryRow("SELECT id, name, email FROM users WHERE email = $1", email).Scan(&u.ID, &u.FirstName, &u.Email)
	return &u, err
}

func (s *Store) GetUserByID(id int) (*types.User, error) {
	var u types.User
	err := s.db.QueryRow("SELECT id, name, email FROM users WHERE id = $1", id).Scan(&u.ID, &u.FirstName, &u.Email)
	return &u, err
}

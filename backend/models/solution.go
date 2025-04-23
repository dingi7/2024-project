package models

type Solution struct {
	ID       string `json:"id,omitempty" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Language string `json:"language" gorm:"type:varchar(100)"`
	Code     string `json:"code" gorm:"type:text"`
	Input    string `json:"input" gorm:"type:text"`
}

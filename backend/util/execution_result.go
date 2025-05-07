package util

import (
	"encoding/json"
)

// HTTP status codes
const (
	StatusOK                  = 200
	StatusBadRequest          = 400
	StatusInternalServerError = 500
)

// ExecutionResult contains the result of code execution
type ExecutionResult struct {
	Output   string
	Duration int64
	MemUsage int64
	CPUUsage float64
	Error    error
	TimedOut bool
}

// MarshalToJSON marshals the given object to JSON
func MarshalToJSON(v interface{}) ([]byte, error) {
	return json.Marshal(v)
}

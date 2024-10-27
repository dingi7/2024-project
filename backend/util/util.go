package util

import (
	"os"
)



func CreateTempFile(content string, extension string) (string, error) {
    tmpfile, err := os.CreateTemp("", "*."+extension)
    if err != nil {
        return "", err
    }
    
    if content != "" {
        if _, err := tmpfile.WriteString(content); err != nil {
            return "", err
        }
    }
    
    if err := tmpfile.Close(); err != nil {
        return "", err
    }
    
    return tmpfile.Name(), nil
}

func CreateTempDir() (string, error) {
	tempDir, err := os.MkdirTemp("", "temp-dir-")
	if err != nil {
		return "", err
	}
	return tempDir, nil
}


func CleanupTempDir(tempDir string) error {
	return os.RemoveAll(tempDir)
}

package util

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
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


func HandlePDFUpload(files []*multipart.FileHeader) ([]byte, error) {
    if len(files) == 0 {
        return nil, fmt.Errorf("no files provided")
    }

    fileHeader := files[0]
    file, err := fileHeader.Open()
    if err != nil {
        return nil, fmt.Errorf("failed to open PDF file: %w", err)
    }
    defer file.Close()

    pdfData, err := io.ReadAll(file)
    if err != nil {
        return nil, fmt.Errorf("failed to read PDF file: %w", err)
    }

    return pdfData, nil
}

// SaveTestSuiteFile saves uploaded test suite files to /test-suites/contestId/filename
func SaveTestSuiteFile(files []*multipart.FileHeader, contestId string) (string, error) {
	if len(files) != 1 {
		return "", fmt.Errorf("exactly one file is required")
	}

	file := files[0] 

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".js" && ext != ".py" {
		return "", fmt.Errorf("file must be a .js or .py file")
	}

	// Sanitize the filename to prevent path traversal attacks
	filename := filepath.Base(file.Filename)

	// Create the directory if it doesn't exist
	dirPath := filepath.Join("test-suites", contestId)
	err := os.MkdirAll(dirPath, os.ModePerm)
	if err != nil {
		return "", fmt.Errorf("failed to create directory: %v", err)
	}

	// Full path to save the file
	filePath := filepath.Join(dirPath, filename)

	// Open the uploaded file
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open uploaded file: %v", err)
	}
	defer src.Close()

	// Create the destination file
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create destination file: %v", err)
	}
	defer dst.Close()

	// Copy the uploaded file to the destination file
	if _, err := io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("failed to save file: %v", err)
	}

	return filePath, nil
}

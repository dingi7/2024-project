package util

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"

	"github.com/gofiber/fiber/v2"
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

func HandleTestFileUpload(files []*multipart.FileHeader) ([]byte, error) {
	fileHeader := files[0]
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open test file: %w", err)
	}
	defer file.Close()

	return io.ReadAll(file)
}

func HandleError(c *fiber.Ctx, message string, additional ...fiber.Map) error {
	status := fiber.StatusInternalServerError
	response := fiber.Map{"error": message}

	if len(additional) > 0 {
		for key, value := range additional[0] {
			response[key] = value
		}
	}

	return c.Status(status).JSON(response)
}
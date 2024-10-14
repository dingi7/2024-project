package util

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

func IdentifyCodeEntryPoint(code string) (string, error) {
	promptTemplate := "Given the following code: %s, return ONLY the name of the function that serves as the entry point of the code. Return only the name, trim any other text."
	prompt := fmt.Sprintf(promptTemplate, code)
	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey("AIzaSyCbsmw6BGrfEycp-OashELhIbP6tuM5S9I"))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-1.5-flash")
	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		fmt.Println(err)
		return "", err
	}
	parsedResponse := strings.TrimSpace(extractResponseContent(resp))

	return parsedResponse, nil
}

func extractResponseContent(resp *genai.GenerateContentResponse) string {
	var content strings.Builder
	for _, cand := range resp.Candidates {
		if cand.Content != nil {
			for _, part := range cand.Content.Parts {
				content.WriteString(fmt.Sprintf("%v\n", part))
			}
		}
	}
	return content.String()
}

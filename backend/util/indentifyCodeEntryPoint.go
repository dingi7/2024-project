package util

import (
	"context"
	"fmt"
	"os"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

func IdentifyCodeEntryPoint(code string) (string, error) {
	promptTemplate := "Given the following code:\n\n%s\n\nReturn ONLY the name of the function that serves as the entry point of the code. Return only the name, no extra text."
	prompt := fmt.Sprintf(promptTemplate, code)

	openAIKey := os.Getenv("OPENAI_API_KEY")
	if openAIKey == "" {
		return "main", fmt.Errorf("OpenAI API key not found in environment variables")
	}

	client := openai.NewClient(openAIKey)
	ctx := context.Background()

	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
	})
	if err != nil {
		return "main", err
	}

	output := strings.TrimSpace(resp.Choices[0].Message.Content)
	return output, nil
}

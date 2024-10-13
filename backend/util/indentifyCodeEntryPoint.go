package util

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func IdentifyCodeEntryPoint(code string) (string, error) {
	promptTemplate := "Given the following code: %s, return ONLY the name of the function that serves as the entry point of the code. Return only the name, trim any other text."
	prompt := fmt.Sprintf(promptTemplate, code)

	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{
						"text": prompt,
					},
				},
			},
		},
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("error marshaling request body: %v", err)
	}

	resp, err := http.Post(
		"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyCjJWh3W-DT-AdTxfaJ8Qkn60yEBCY_qKk",
		"application/json",
		bytes.NewBuffer(jsonBody),
	)
	if err != nil {
		return "", fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("error reading response body: %v", err)
	}

	var data map[string]interface{}
	err = json.Unmarshal(body, &data)
	if err != nil {
		return "", fmt.Errorf("error unmarshaling response: %v", err)
	}
	fmt.Println(data)
	candidates, ok := data["candidates"].([]interface{})
	if !ok || len(candidates) == 0 {
		return "", fmt.Errorf("no candidates in response")
	}

	content, ok := candidates[0].(map[string]interface{})["content"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("invalid content structure in response")
	}

	parts, ok := content["parts"].([]interface{})
	if !ok || len(parts) == 0 {
		return "", fmt.Errorf("no parts in content")
	}

	text, ok := parts[0].(map[string]interface{})["text"].(string)
	if !ok {
		return "", fmt.Errorf("invalid text in response")
	}

	return text, nil
}

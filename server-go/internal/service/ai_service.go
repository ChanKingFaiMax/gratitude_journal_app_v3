package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/yourusername/gratitude-journal-api/internal/config"
)

const (
	OpenRouterAPIURL = "https://openrouter.ai/api/v1/chat/completions"
)

type AIService struct {
	apiKey     string
	model      string
	httpClient *http.Client
}

func NewAIService(cfg *config.AIConfig) *AIService {
	return &AIService{
		apiKey: cfg.OpenRouterAPIKey,
		model:  cfg.OpenRouterModel,
		httpClient: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

// ChatMessage represents a message in the chat
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatRequest represents a request to the AI API
type ChatRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
	Temperature float64       `json:"temperature,omitempty"`
}

// ChatResponse represents a response from the AI API
type ChatResponse struct {
	ID      string `json:"id"`
	Choices []struct {
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

// GenerateWisdom generates sage wisdom for a journal entry
func (s *AIService) GenerateWisdom(topic, content, language string) ([]SageWisdom, error) {
	prompt := s.buildWisdomPrompt(topic, content, language)
	
	messages := []ChatMessage{
		{Role: "system", Content: s.getWisdomSystemPrompt(language)},
		{Role: "user", Content: prompt},
	}

	response, err := s.chat(messages, 4096, 0.8)
	if err != nil {
		return nil, err
	}

	// Parse the response
	var wisdoms []SageWisdom
	if err := json.Unmarshal([]byte(response), &wisdoms); err != nil {
		// Try to extract JSON from response
		wisdoms = s.parseWisdomResponse(response, language)
	}

	return wisdoms, nil
}

// SageWisdom represents wisdom from a sage
type SageWisdom struct {
	Sage    string `json:"sage"`
	Emoji   string `json:"emoji"`
	Message string `json:"message"`
}

func (s *AIService) getWisdomSystemPrompt(language string) string {
	if language == "en" {
		return `You are a wisdom generator that creates inspirational messages from four sages: Messenger of Love (✨), Awakened One (🪷), Lao Tzu (☯️), and Plato (🏛️).

Each sage has a unique voice:
- Messenger of Love: Speaks with unconditional love, uses natural metaphors (seeds, light, ripples), addresses the reader as "child"
- Awakened One: Speaks as an observer, uses Zen-like direct pointing, focuses on awareness and presence
- Lao Tzu: Natural poet, uses nature imagery, Taoist dialectics, finds beauty in the ordinary
- Plato: Philosophical inquiry, questions essence and truth, Socratic dialogue style

Return a JSON array with exactly 4 objects, one for each sage:
[{"sage": "Messenger of Love", "emoji": "✨", "message": "..."}, ...]`
	}

	return `你是一个智慧生成器，创建来自四位智者的启示：爱之使者(✨)、觉者(🪷)、老子(☯️)、柏拉图(🏛️)。

每位智者有独特的声音：
- 爱之使者：以无条件的爱说话，使用自然比喻（种子、光、涟漪），称呼读者为"孩子"
- 觉者：以觉察者的视角说话，使用禅宗直指人心的方式，关注觉知和当下
- 老子：自然诗人，使用自然意象，道家辩证法，在平凡中发现美好
- 柏拉图：哲学探究，追问本质和真理，苏格拉底式对话风格

返回一个JSON数组，包含4个对象，每个智者一个：
[{"sage": "爱之使者", "emoji": "✨", "message": "..."}, ...]`
}

func (s *AIService) buildWisdomPrompt(topic, content, language string) string {
	if language == "en" {
		return fmt.Sprintf(`The user is writing about: "%s"

Their current content: "%s"

Generate inspirational wisdom from each of the four sages that:
1. Provides elevated perspective and insight (statement)
2. Ends with ONE thought-provoking question
3. Is deeply personalized to their specific content
4. Helps them write from their heart

Return ONLY a valid JSON array.`, topic, content)
	}

	return fmt.Sprintf(`用户正在写关于："%s"

他们当前的内容："%s"

为四位智者各生成一条启示，要求：
1. 前半段提供高维视角和洞见（陈述句）
2. 后半段只提一个引发思考的问题
3. 必须与用户的具体内容紧密相关
4. 帮助用户写出内心深处的真实感受

只返回有效的JSON数组。`, topic, content)
}

func (s *AIService) parseWisdomResponse(response, language string) []SageWisdom {
	// Default fallback wisdoms
	if language == "en" {
		return []SageWisdom{
			{Sage: "Messenger of Love", Emoji: "✨", Message: "Child, every moment of gratitude is a seed of love you plant in the garden of your soul."},
			{Sage: "Awakened One", Emoji: "🪷", Message: "In this moment of awareness, what do you truly see?"},
			{Sage: "Lao Tzu", Emoji: "☯️", Message: "The river does not struggle to flow. What flows naturally in your heart?"},
			{Sage: "Plato", Emoji: "🏛️", Message: "What is the essence of what you're grateful for?"},
		}
	}

	return []SageWisdom{
		{Sage: "爱之使者", Emoji: "✨", Message: "孩子，每一刻的感恩都是你在心灵花园里播下的爱的种子。"},
		{Sage: "觉者", Emoji: "🪷", Message: "在这觉知的时刻，你真正看到了什么？"},
		{Sage: "老子", Emoji: "☯️", Message: "河水不争而自流。你心中自然流淌的是什么？"},
		{Sage: "柏拉图", Emoji: "🏛️", Message: "你所感恩之事的本质是什么？"},
	}
}

// GenerateSummary generates a summary from the four sages
func (s *AIService) GenerateSummary(topic, content, language string) ([]SageWisdom, error) {
	prompt := s.buildSummaryPrompt(topic, content, language)
	
	messages := []ChatMessage{
		{Role: "system", Content: s.getSummarySystemPrompt(language)},
		{Role: "user", Content: prompt},
	}

	response, err := s.chat(messages, 4096, 0.8)
	if err != nil {
		return nil, err
	}

	var summaries []SageWisdom
	if err := json.Unmarshal([]byte(response), &summaries); err != nil {
		summaries = s.parseWisdomResponse(response, language)
	}

	return summaries, nil
}

func (s *AIService) getSummarySystemPrompt(language string) string {
	if language == "en" {
		return `You are generating concluding wisdom from four sages for a completed journal entry.

Each sage provides a blessing and insight (NOT a question):
- Messenger of Love (✨): Unconditional love, natural metaphors, addresses as "child"
- Awakened One (🪷): Observer perspective, Zen-like direct pointing
- Lao Tzu (☯️): Natural poet, Taoist wisdom
- Plato (🏛️): Philosophical insight about essence and truth

Return a JSON array with exactly 4 objects.`
	}

	return `你正在为完成的日记生成四位智者的总结智慧。

每位智者提供祝福和洞见（不是问题）：
- 爱之使者(✨)：无条件的爱，自然比喻，称呼"孩子"
- 觉者(🪷)：觉察者视角，禅宗直指
- 老子(☯️)：自然诗人，道家智慧
- 柏拉图(🏛️)：关于本质和真理的哲学洞见

返回一个包含4个对象的JSON数组。`
}

func (s *AIService) buildSummaryPrompt(topic, content, language string) string {
	if language == "en" {
		return fmt.Sprintf(`The user wrote about: "%s"

Their entry: "%s"

Generate concluding wisdom from each sage that:
1. Acknowledges what they wrote
2. Provides elevated insight
3. Ends with a blessing (NOT a question)

Return ONLY a valid JSON array.`, topic, content)
	}

	return fmt.Sprintf(`用户写了关于："%s"

他们的内容："%s"

为每位智者生成总结智慧：
1. 认可他们所写的内容
2. 提供高维洞见
3. 以祝福结尾（不是问题）

只返回有效的JSON数组。`, topic, content)
}

// GeneratePersonalizedTopics generates personalized journal topics
func (s *AIService) GeneratePersonalizedTopics(recentEntries []string, language string) ([]string, error) {
	prompt := s.buildTopicsPrompt(recentEntries, language)
	
	messages := []ChatMessage{
		{Role: "system", Content: s.getTopicsSystemPrompt(language)},
		{Role: "user", Content: prompt},
	}

	response, err := s.chat(messages, 2048, 0.9)
	if err != nil {
		return nil, err
	}

	var topics []string
	if err := json.Unmarshal([]byte(response), &topics); err != nil {
		// Return default topics
		if language == "en" {
			return []string{
				"What small moment today made you smile?",
				"Who has influenced your life recently?",
				"What are you looking forward to?",
				"What challenge helped you grow?",
				"What beauty did you notice today?",
			}, nil
		}
		return []string{
			"今天有什么小事让你微笑了？",
			"最近谁影响了你的生活？",
			"你在期待什么？",
			"什么挑战帮助你成长了？",
			"今天你注意到了什么美好？",
		}, nil
	}

	return topics, nil
}

func (s *AIService) getTopicsSystemPrompt(language string) string {
	if language == "en" {
		return `You generate personalized journal prompts based on the user's recent entries.
Create deep, thought-provoking questions that help users explore their inner world.
Return a JSON array of exactly 5 topic strings.`
	}
	return `你根据用户最近的日记生成个性化的写作题目。
创建深刻、引发思考的问题，帮助用户探索内心世界。
返回一个包含5个题目字符串的JSON数组。`
}

func (s *AIService) buildTopicsPrompt(recentEntries []string, language string) string {
	entriesText := ""
	for i, entry := range recentEntries {
		if i > 0 {
			entriesText += "\n---\n"
		}
		entriesText += entry
	}

	if language == "en" {
		return fmt.Sprintf(`Based on these recent journal entries:

%s

Generate 5 personalized, deep questions that:
1. Build on themes from their writing
2. Encourage deeper self-reflection
3. Are specific, not generic
4. Help explore emotions and relationships

Return ONLY a valid JSON array of 5 strings.`, entriesText)
	}

	return fmt.Sprintf(`基于这些最近的日记：

%s

生成5个个性化的深度问题：
1. 基于他们写作中的主题
2. 鼓励更深的自我反思
3. 具体而非泛泛
4. 帮助探索情感和关系

只返回包含5个字符串的有效JSON数组。`, entriesText)
}

// GenerateReview generates a deep review analysis
func (s *AIService) GenerateReview(reviewType string, entries []string, language string) (string, error) {
	prompt := s.buildReviewPrompt(reviewType, entries, language)
	
	messages := []ChatMessage{
		{Role: "system", Content: s.getReviewSystemPrompt(reviewType, language)},
		{Role: "user", Content: prompt},
	}

	return s.chat(messages, 8192, 0.7)
}

func (s *AIService) getReviewSystemPrompt(reviewType, language string) string {
	prompts := map[string]map[string]string{
		"consciousness": {
			"en": `You analyze journal entries to assess consciousness levels based on David Hawkins' Map of Consciousness.
Identify patterns, growth, and provide insights about the user's spiritual evolution.`,
			"zh": `你分析日记条目，基于大卫·霍金斯的意识地图评估意识层级。
识别模式、成长，并提供关于用户灵性进化的洞见。`,
		},
		"growth": {
			"en": `You analyze journal entries to identify personal growth patterns.
Look for themes of learning, overcoming challenges, and spiritual development.`,
			"zh": `你分析日记条目以识别个人成长模式。
寻找学习、克服挑战和灵性发展的主题。`,
		},
		"relationships": {
			"en": `You analyze journal entries to understand relationship patterns.
Identify key people mentioned, gratitude expressed, and relationship dynamics.`,
			"zh": `你分析日记条目以理解人际关系模式。
识别提到的关键人物、表达的感恩和关系动态。`,
		},
		"attention": {
			"en": `You analyze journal entries to provide loving guidance.
From a place of unconditional love, suggest areas for attention and growth.`,
			"zh": `你分析日记条目以提供充满爱的指导。
从无条件的爱的角度，建议需要关注和成长的领域。`,
		},
	}

	lang := "zh"
	if language == "en" {
		lang = "en"
	}

	if p, ok := prompts[reviewType]; ok {
		if prompt, ok := p[lang]; ok {
			return prompt
		}
	}

	return prompts["growth"][lang]
}

func (s *AIService) buildReviewPrompt(reviewType string, entries []string, language string) string {
	entriesText := ""
	for i, entry := range entries {
		entriesText += fmt.Sprintf("\n--- Entry %d ---\n%s", i+1, entry)
	}

	if language == "en" {
		return fmt.Sprintf(`Analyze these journal entries for %s:
%s

Provide a comprehensive analysis with specific examples from the entries.`, reviewType, entriesText)
	}

	typeNames := map[string]string{
		"consciousness": "意识层级",
		"growth":        "成长轨迹",
		"relationships": "人际关系",
		"attention":     "需要关注的方面",
	}
	typeName := typeNames[reviewType]
	if typeName == "" {
		typeName = reviewType
	}

	return fmt.Sprintf(`分析这些日记条目的%s：
%s

提供全面的分析，包含日记中的具体例子。`, typeName, entriesText)
}

// chat sends a chat request to the AI API
func (s *AIService) chat(messages []ChatMessage, maxTokens int, temperature float64) (string, error) {
	if s.apiKey == "" {
		return "", fmt.Errorf("OpenRouter API key not configured")
	}

	request := ChatRequest{
		Model:       s.model,
		Messages:    messages,
		MaxTokens:   maxTokens,
		Temperature: temperature,
	}

	body, err := json.Marshal(request)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", OpenRouterAPIURL, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("HTTP-Referer", "https://github.com/gratitude-journal")
	req.Header.Set("X-Title", "Gratitude Journal App")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API error: %s - %s", resp.Status, string(respBody))
	}

	var chatResp ChatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("no response from AI")
	}

	return chatResp.Choices[0].Message.Content, nil
}

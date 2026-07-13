package fit.iuh.config.ai;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Map;

@Configuration
public class OpenRouterAiConfig {

    @Bean
    public OpenAiChatModel openRouterChatModel(
            @Value("${app.ai.openrouter.base-url}") String baseUrl,
            @Value("${app.ai.openrouter.api-key}") String apiKey,
            @Value("${app.ai.openrouter.model}") String model,
            @Value("${app.ai.openrouter.site-url:}") String siteUrl,
            @Value("${app.ai.openrouter.app-name:ott-edu}") String appName) {
        OpenAiChatOptions.Builder optionsBuilder = OpenAiChatOptions.builder()
                .baseUrl(baseUrl)
                .apiKey(apiKey)
                .model(model)
                .temperature(0.0)
                .maxTokens(2048);

        Map<String, String> customHeaders = new LinkedHashMap<>();
        if (StringUtils.hasText(siteUrl)) {
            customHeaders.put("HTTP-Referer", siteUrl);
        }
        if (StringUtils.hasText(appName)) {
            customHeaders.put("X-Title", appName);
        }
        if (!customHeaders.isEmpty()) {
            optionsBuilder.customHeaders(customHeaders);
        }

        return OpenAiChatModel.builder()
                .options(optionsBuilder.build())
                .build();
    }

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }
}
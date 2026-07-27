package com.lumiedu.ai.service.impl;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.lumiedu.ai.dto.QuizResponse;
import com.lumiedu.ai.dto.QuizQuestionResponse;
import com.lumiedu.ai.dto.QuizSubmitResponse;
import com.lumiedu.ai.entity.*;
import com.lumiedu.ai.repository.*;
import com.lumiedu.ai.service.AiAssistantService;
import com.lumiedu.ai.service.AiLimitService;
import com.lumiedu.ai.service.DocumentChunkingService;
import com.lumiedu.ai.service.OpenAiService;
import com.lumiedu.ai.service.OpenAiService.ChatMessageDto;
import com.lumiedu.ai.service.OpenAiService.OpenAiResponse;
import com.lumiedu.ai.service.GeminiService;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class AiAssistantServiceImpl implements AiAssistantService {

    private final AiSummaryRepository aiSummaryRepository;
    private final AiChatSessionRepository aiChatSessionRepository;
    private final AiChatMessageRepository aiChatMessageRepository;
    private final FlashcardRepository flashcardRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final DocumentRepository documentRepository;

    private final DocumentChunkRepository documentChunkRepository;
    private final AiUsageLogRepository aiUsageLogRepository;
    private final StudyPlanRepository studyPlanRepository;

    private final OpenAiService openAiService;
    private final DocumentChunkingService documentChunkingService;
    private final AiLimitService aiLimitService;
    private final GeminiService geminiService;
    private final com.lumiedu.prompt.service.PromptEngineService promptEngineService;
    private final com.lumiedu.user.repository.UserRepository userRepository;

    private final Gson gson = new Gson();

    @Override
    public AiSummary generateSummary(Long documentId, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();

        // 1. Check cache
        Optional<AiSummary> existing = aiSummaryRepository.findByDocumentIdAndLanguage(documentId, lang);
        if (existing.isPresent()) {
            return existing.get();
        }

        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) {
            throw new IllegalArgumentException("Document not found.");
        }

        // 2. Ensure chunks exist
        List<DocumentChunk> chunks = getOrWaitForChunks(documentId);
        if (chunks.isEmpty()) {
            return AiSummary.builder()
                    .documentId(documentId)
                    .language(lang)
                    .summaryText("Tài liệu đang được hệ thống phân tích và chia nhỏ dữ liệu. Vui lòng đợi trong giây lát và tải lại trang.")
                    .summaryBullets("[]")
                    .build();
        }

        // 3. Build summary context from first few chunks
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(chunks.size(), 3); i++) {
            sb.append(chunks.get(i).getContent()).append("\n");
        }
        String context = sb.toString();

        // 4. Construct prompt variables and execute via PromptEngineService
        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("language", lang);
        promptVars.put("subject", doc.getSubject() != null ? doc.getSubject() : "General");
        promptVars.put("title", doc.getTitle() != null ? doc.getTitle() : "Untitled Document");
        promptVars.put("content", context);

        Long userId = doc.getUserId() != null ? doc.getUserId() : 1L;
        com.lumiedu.user.entity.User currentUser = userRepository.findById(userId).orElse(null);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "DOCUMENT_SUMMARY",
                promptVars,
                currentUser,
                currentUser != null ? currentUser.getEmail() : null,
                "DOCUMENT_SUMMARY",
                String.valueOf(documentId),
                "doc-v" + documentId,
                true
        );

        String rawResponseText = execResult.getContent();

        // 7. Parse response
        String summaryText = "";
        String summaryBulletsJson = "";
        try {
            JsonObject jsonObj = gson.fromJson(rawResponseText, JsonObject.class);
            summaryText = jsonObj.get("summaryText").getAsString();
            JsonElement bulletsElem = jsonObj.get("summaryBullets");
            if (bulletsElem.isJsonArray()) {
                summaryBulletsJson = gson.toJson(bulletsElem.getAsJsonArray());
            } else {
                summaryBulletsJson = bulletsElem.getAsString();
            }
        } catch (Exception e) {
            System.err.println("Failed to parse summary JSON response: " + e.getMessage());
            // Fallback
            summaryText = rawResponseText;
            summaryBulletsJson = gson
                    .toJson(Arrays.asList("Tổng quan kiến thức cốt lõi.", "Chi tiết phương pháp và bài học."));
        }

        AiSummary summary = AiSummary.builder()
                .documentId(documentId)
                .language(lang)
                .summaryText(summaryText)
                .summaryBullets(summaryBulletsJson)
                .build();

        return aiSummaryRepository.save(summary);
    }

    @Override
    public AiSummary getSummary(Long documentId, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        return aiSummaryRepository.findByDocumentIdAndLanguage(documentId, lang)
                .orElseGet(() -> generateSummary(documentId, lang));
    }

    @Override
    public AiChatSession createOrGetChatSession(List<Long> documentIds, Long userId) {
        List<Long> sortedIds = new ArrayList<>();
        if (documentIds != null) {
            for (Long id : documentIds) {
                if (id != null) {
                    sortedIds.add(id);
                }
            }
            Collections.sort(sortedIds);
        }

        // Find user's sessions ordered by update time
        List<AiChatSession> userSessions = aiChatSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        for (AiChatSession s : userSessions) {
            List<Long> sessionDocIds = new ArrayList<>();
            if (s.getDocuments() != null) {
                for (Document d : s.getDocuments()) {
                    sessionDocIds.add(d.getId());
                }
            }
            Collections.sort(sessionDocIds);
            
            if (sessionDocIds.equals(sortedIds)) {
                return s;
            }
        }

        // If not found, create new session
        List<Document> docs = new ArrayList<>();
        StringBuilder titleBuilder = new StringBuilder();
        if (documentIds != null) {
            for (int i = 0; i < documentIds.size(); i++) {
                Long docId = documentIds.get(i);
                if (docId == null) continue;
                Document doc = documentRepository.findById(docId).orElse(null);
                if (doc != null) {
                    docs.add(doc);
                    if (titleBuilder.length() > 0) {
                        titleBuilder.append(", ");
                    }
                    titleBuilder.append(doc.getTitle());
                }
            }
        }

        String title = titleBuilder.toString();
        if (title.length() > 255) {
            title = title.substring(0, 252) + "...";
        }
        if (title.isEmpty()) {
            title = "LumiEdu AI Assistant";
        }

        Long firstDocId = (documentIds != null && !documentIds.isEmpty()) ? documentIds.get(0) : null;

        AiChatSession session = AiChatSession.builder()
                .documentId(firstDocId)
                .userId(userId)
                .title(title)
                .documents(docs)
                .build();

        return aiChatSessionRepository.save(session);
    }

    @Override
    public List<AiChatSession> getUserSessions(Long userId) {
        return aiChatSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    @Override
    public List<AiChatMessage> getChatHistory(Long sessionId) {
        return aiChatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    @Override
    public AiChatMessage sendMessage(Long sessionId, String messageText, boolean thinkingMode) {
        AiChatSession session = aiChatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Chat session not found."));

        // 1. Check billing limit
        if (!aiLimitService.isWithinDailyLimit(session.getUserId(), "CHAT")) {
            throw new RuntimeException("Bạn đã vượt quá hạn mức sử dụng AI Chat hàng ngày của gói dịch vụ hiện tại.");
        }

        // Save User Message
        AiChatMessage userMessage = AiChatMessage.builder()
                .sessionId(sessionId)
                .sender("USER")
                .messageText(messageText)
                .build();
        aiChatMessageRepository.save(userMessage);

        // 2. Ensure chunks exist, then perform RAG search
        String ragContext = "";
        StringBuilder docMetaContext = new StringBuilder();
        List<Document> docObjects = new ArrayList<>();

        if (session.getDocuments() != null && !session.getDocuments().isEmpty()) {
            docObjects.addAll(session.getDocuments());
        } else if (session.getDocumentId() != null) {
            Document doc = documentRepository.findById(session.getDocumentId()).orElse(null);
            if (doc != null) {
                docObjects.add(doc);
            }
        }

        List<Long> docIds = new ArrayList<>();
        for (Document doc : docObjects) {
            docIds.add(doc.getId());
            docMetaContext.append("Tài liệu: ").append(doc.getTitle());
            if (doc.getSubject() != null) docMetaContext.append(" | Môn học: ").append(doc.getSubject());
            if (doc.getDescription() != null && !doc.getDescription().isEmpty()) {
                docMetaContext.append("\nMô tả: ").append(doc.getDescription());
            }
            docMetaContext.append("\n");
            
            // Auto-index chunks if not yet indexed
            List<DocumentChunk> existingChunks = documentChunkRepository.findByDocumentId(doc.getId());
            if (existingChunks.isEmpty()) {
                try {
                    documentChunkingService.chunkAndIndexDocument(doc.getId());
                    System.out.println("Auto-indexed chunks for document: " + doc.getTitle());
                } catch (Exception e) {
                    System.err.println("Failed to auto-index chunks for doc " + doc.getId() + ": " + e.getMessage());
                }
            }
        }

        if (!docIds.isEmpty()) {
            ragContext = performRagSearch(docIds, messageText);
            if (!ragContext.isEmpty()) {
                System.out.println("========== RETRIEVE CONTEXT ==========");
                System.out.println("Question: " + messageText);
                System.out.print(ragContext);
                System.out.println("======================================");
            }
        }

        // 3. Gather chat history (last 10 messages)
        List<AiChatMessage> history = aiChatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        if (history.size() > 10) {
            history = history.subList(history.size() - 10, history.size());
        }

        // 4. Construct context and variables for CHAT_QA
        StringBuilder fullContextBuilder = new StringBuilder();
        if (!docMetaContext.isEmpty()) {
            fullContextBuilder.append("Attached Documents Metadata:\n").append(docMetaContext).append("\n\n");
        }
        if (!ragContext.isEmpty()) {
            fullContextBuilder.append("Extracted Document Content:\n").append(ragContext);
        }

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("context", fullContextBuilder.toString().isEmpty() ? "No additional document context available." : fullContextBuilder.toString());
        promptVars.put("question", userMessage);

        com.lumiedu.user.entity.User currentUser = userRepository.findById(session.getUserId()).orElse(null);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "CHAT_QA",
                promptVars,
                currentUser,
                currentUser != null ? currentUser.getEmail() : null,
                "CHAT_QA",
                String.valueOf(session.getId()),
                "session-v" + session.getId(),
                false
        );

        OpenAiResponse response = OpenAiResponse.builder()
                .content(execResult.getContent())
                .promptTokens(execResult.getPromptTokens())
                .completionTokens(execResult.getCompletionTokens())
                .build();

        // 7. Save and return AI Message
        AiChatMessage aiMessage = AiChatMessage.builder()
                .sessionId(sessionId)
                .sender("AI")
                .messageText(response.getContent())
                .thought(response.getThought())
                .build();

        return aiChatMessageRepository.save(aiMessage);
    }

    @Override
    public List<Flashcard> generateFlashcards(Long documentId) {
        flashcardRepository.deleteByDocumentId(documentId);

        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) {
            throw new IllegalArgumentException("Document not found.");
        }

        List<DocumentChunk> chunks = getOrWaitForChunks(documentId);
        if (chunks.isEmpty()) {
            throw new IllegalStateException("Tài liệu đang được phân tích hoặc không chứa nội dung văn bản. Vui lòng thử lại sau.");
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(chunks.size(), 3); i++) {
            sb.append(chunks.get(i).getContent()).append("\n");
        }
        String context = sb.toString();

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("count", 5);
        promptVars.put("language", "vi");
        promptVars.put("content", context);

        Long userId = doc.getUserId() != null ? doc.getUserId() : 1L;
        com.lumiedu.user.entity.User currentUser = userRepository.findById(userId).orElse(null);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "FLASHCARD_GENERATION",
                promptVars,
                currentUser,
                currentUser != null ? currentUser.getEmail() : null,
                "FLASHCARD_GENERATION",
                String.valueOf(documentId),
                "doc-v" + documentId,
                true
        );

        String rawResponseText = execResult.getContent();

        List<Flashcard> list = new ArrayList<>();
        try {
            JsonArray arr = null;
            try {
                JsonObject jsonObj = gson.fromJson(rawResponseText, JsonObject.class);
                if (jsonObj.has("flashcards")) {
                    arr = jsonObj.getAsJsonArray("flashcards");
                }
            } catch (Exception e) {
                // If direct array
                arr = gson.fromJson(rawResponseText, JsonArray.class);
            }

            if (arr != null) {
                for (int i = 0; i < arr.size(); i++) {
                    JsonObject item = arr.get(i).getAsJsonObject();
                    list.add(Flashcard.builder()
                            .documentId(documentId)
                            .question(item.get("front").getAsString())
                            .answer(item.get("back").getAsString())
                            .build());
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to parse flashcards JSON response: " + e.getMessage());
            list.add(new Flashcard(null, documentId, "Mẫu thiết kế Singleton dùng để làm gì?",
                    "Đảm bảo một lớp chỉ có duy nhất một thực thể."));
            list.add(new Flashcard(null, documentId, "Mẫu thiết kế Observer hoạt động theo cơ chế nào?",
                    "Mối quan hệ phụ thuộc một-nhiều giữa các đối tượng."));
        }

        return flashcardRepository.saveAll(list);
    }

    @Override
    public List<QuizQuestion> generateQuiz(Long documentId, String difficulty, int count, String customPrompt) {
        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) {
            throw new IllegalArgumentException("Document not found.");
        }

        Long userId = doc.getUserId() != null ? doc.getUserId() : 1L;
        // 1. Check billing limit
        if (!aiLimitService.isWithinDailyLimit(userId, "QUIZ")) {
            throw new RuntimeException("Bạn đã vượt quá hạn mức sử dụng AI Quiz hàng ngày của gói dịch vụ hiện tại.");
        }

        List<DocumentChunk> chunks = getOrWaitForChunks(documentId);
        if (chunks.isEmpty()) {
            throw new IllegalStateException("Tài liệu đang được phân tích hoặc không chứa nội dung văn bản. Vui lòng thử lại sau.");
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(chunks.size(), 4); i++) {
            sb.append(chunks.get(i).getContent()).append("\n");
        }
        String context = sb.toString();

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("count", count);
        promptVars.put("difficulty", difficulty != null ? difficulty : "Medium");
        promptVars.put("language", "vi");
        promptVars.put("content", context);

        com.lumiedu.user.entity.User currentUser = userRepository.findById(userId).orElse(null);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "QUIZ_GENERATION",
                promptVars,
                currentUser,
                currentUser != null ? currentUser.getEmail() : null,
                "QUIZ_GENERATION",
                String.valueOf(documentId),
                "doc-v" + documentId,
                true
        );

        String rawResponseText = execResult.getContent();

        Quiz quiz = Quiz.builder()
                .documentId(documentId)
                .title("Quiz for " + doc.getTitle())
                .promptUsed(customPrompt)
                .build();
        quiz = quizRepository.save(quiz);

        List<QuizQuestion> questions = new ArrayList<>();
        try {
            JsonObject jsonObj = gson.fromJson(rawResponseText, JsonObject.class);
            JsonArray arr = jsonObj.getAsJsonArray("questions");
            for (int i = 0; i < arr.size(); i++) {
                JsonObject item = arr.get(i).getAsJsonObject();
                JsonArray optsArr = item.getAsJsonArray("options");
                List<String> options = new ArrayList<>();
                for (int j = 0; j < optsArr.size(); j++) {
                    options.add(optsArr.get(j).getAsString());
                }

                String qText = item.has("questionText") ? item.get("questionText").getAsString()
                        : (item.has("question") ? item.get("question").getAsString() : item.get("q").getAsString());

                int ansIdx = 0;
                if (item.has("answerIndex")) {
                    ansIdx = item.get("answerIndex").getAsInt();
                } else if (item.has("answer")) {
                    try {
                        ansIdx = item.get("answer").getAsInt();
                    } catch (Exception ex) {
                        String ansStr = item.get("answer").getAsString();
                        ansIdx = Math.max(0, options.indexOf(ansStr));
                    }
                } else if (item.has("correctAnswer")) {
                    String ansStr = item.get("correctAnswer").getAsString();
                    ansIdx = Math.max(0, options.indexOf(ansStr));
                }

                String explainText = item.has("explanation") ? item.get("explanation").getAsString()
                        : (item.has("explain") ? item.get("explain").getAsString() : "No explanation provided.");

                questions.add(QuizQuestion.builder()
                        .quiz(quiz)
                        .questionText(qText)
                        .options(gson.toJson(options))
                        .answerIndex(ansIdx)
                        .explanation(explainText)
                        .build());
            }
        } catch (Exception e) {
            System.err.println("Failed to parse quiz JSON response: " + e.getMessage());
            // Fallback
            questions.add(QuizQuestion.builder()
                    .quiz(quiz)
                    .questionText("Câu hỏi trắc nghiệm ôn tập về " + doc.getSubject())
                    .options(gson.toJson(Arrays.asList("Đáp án A", "Đáp án B (Đúng)", "Đáp án C", "Đáp án D")))
                    .answerIndex(1)
                    .explanation("Đây là giải thích đáp án mẫu vì lỗi phân tích dữ liệu AI.")
                    .build());
        }

        return quizQuestionRepository.saveAll(questions);
    }

    @Override
    public List<QuizQuestion> modifyQuizWithAi(Long documentId, String prompt) {
        return generateQuiz(documentId, "medium", 5, prompt);
    }

    @Override
    public List<QuizQuestion> getQuiz(Long documentId) {
        Optional<Quiz> latestQuizOpt = quizRepository.findFirstByDocumentIdOrderByCreatedAtDesc(documentId);
        if (latestQuizOpt.isEmpty()) {
            return generateQuiz(documentId, "medium", 5, "");
        }
        return quizQuestionRepository.findByQuizId(latestQuizOpt.get().getId());
    }

    @Override
    public QuizResponse getQuizResponse(Long documentId) {
        return getQuizResponse(documentId, null);
    }

    @Override
    public QuizResponse getQuizResponse(Long documentId, Long userId) {
        if (userId != null) {
            boolean hasAttempted = quizAttemptRepository.existsByUserIdAndDocumentId(userId, documentId);
            if (hasAttempted) {
                generateQuiz(documentId, "medium", 5, "Generate fresh new questions for user re-attempt");
            }
        }

        List<Quiz> quizzes = quizRepository.findByDocumentId(documentId);
        if (quizzes.isEmpty()) {
            generateQuiz(documentId, "medium", 5, "");
            quizzes = quizRepository.findByDocumentId(documentId);
        }

        List<QuizQuestion> pool = new ArrayList<>();
        for (Quiz q : quizzes) {
            pool.addAll(quizQuestionRepository.findByQuizId(q.getId()));
        }

        Collections.shuffle(pool);

        int selectCount = Math.min(pool.size(), 5);
        List<QuizQuestion> selectedQuestions = pool.subList(0, selectCount);

        List<QuizQuestionResponse> questionResponses = new ArrayList<>();
        for (QuizQuestion qq : selectedQuestions) {
            List<String> optionsList;
            try {
                optionsList = gson.fromJson(qq.getOptions(), new com.google.gson.reflect.TypeToken<List<String>>() {
                }.getType());
            } catch (Exception e) {
                optionsList = Arrays.asList("Option A", "Option B", "Option C", "Option D");
            }

            questionResponses.add(QuizQuestionResponse.builder()
                    .id(qq.getId())
                    .text(qq.getQuestionText())
                    .options(optionsList)
                    .answerIndex(qq.getAnswerIndex())
                    .explanation(qq.getExplanation())
                    .build());
        }

        Optional<Quiz> latestQuizOpt = quizRepository.findFirstByDocumentIdOrderByCreatedAtDesc(documentId);
        Quiz latestQuiz = latestQuizOpt.orElse(quizzes.get(0));

        return QuizResponse.builder()
                .id(latestQuiz.getId())
                .documentId(documentId)
                .title(latestQuiz.getTitle())
                .promptUsed(latestQuiz.getPromptUsed())
                .questions(questionResponses)
                .build();
    }

    @Override
    public QuizResponse regenerateQuizResponse(Long documentId, String prompt) {
        generateQuiz(documentId, "medium", 5, prompt);
        return getQuizResponse(documentId);
    }

    @Override
    public QuizSubmitResponse submitQuiz(Long userId, Long documentId, Map<Long, Integer> answers) {
        int correctCount = 0;
        int totalQuestions = answers.size();
        Map<Long, Integer> correctAnswers = new HashMap<>();
        Map<Long, String> explanations = new HashMap<>();

        for (Map.Entry<Long, Integer> entry : answers.entrySet()) {
            Long questionId = entry.getKey();
            Integer selectedIndex = entry.getValue();

            Optional<QuizQuestion> qqOpt = quizQuestionRepository.findById(questionId);
            if (qqOpt.isPresent()) {
                QuizQuestion qq = qqOpt.get();
                correctAnswers.put(questionId, qq.getAnswerIndex());
                explanations.put(questionId, qq.getExplanation());

                if (selectedIndex != null && selectedIndex.equals(qq.getAnswerIndex())) {
                    correctCount++;
                }
            }
        }

        int scorePercentage = totalQuestions > 0 ? Math.round(((float) correctCount / totalQuestions) * 100) : 0;

        Optional<Quiz> latestQuizOpt = quizRepository.findFirstByDocumentIdOrderByCreatedAtDesc(documentId);
        Long latestQuizId = latestQuizOpt.map(Quiz::getId).orElse(null);

        QuizAttempt attempt = QuizAttempt.builder()
                .userId(userId)
                .documentId(documentId)
                .quizId(latestQuizId)
                .score(scorePercentage)
                .submittedAnswers(gson.toJson(answers))
                .build();
        attempt = quizAttemptRepository.save(attempt);

        return QuizSubmitResponse.builder()
                .attemptId(attempt.getId())
                .score(scorePercentage)
                .correctCount(correctCount)
                .totalQuestions(totalQuestions)
                .correctAnswers(correctAnswers)
                .explanations(explanations)
                .build();
    }

    @Override
    public StudyPlan generateStudyPlan(Long userId, String subject, String goal, int durationWeeks,
            List<Long> documentIds) {
        StringBuilder docContextBuilder = new StringBuilder();
        Set<Document> sourceDocs = new HashSet<>();

        if (documentIds != null && !documentIds.isEmpty()) {
            for (Long documentId : documentIds) {
                if (documentId == null)
                    continue;
                Document doc = documentRepository.findById(documentId).orElse(null);
                if (doc != null) {
                    sourceDocs.add(doc);
                    List<DocumentChunk> chunks = getOrWaitForChunks(documentId);
                    if (chunks.isEmpty()) {
                        docContextBuilder.append("[").append(doc.getTitle()).append("]: (Tài liệu đang được phân tích)\n");
                        continue;
                    }
                    for (int i = 0; i < Math.min(chunks.size(), 2); i++) {
                        docContextBuilder.append("[").append(doc.getTitle()).append("]: ")
                                .append(chunks.get(i).getContent()).append("\n");
                    }
                }
            }
        }
        String docContext = docContextBuilder.toString();

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("subject", subject);
        promptVars.put("durationWeeks", durationWeeks);
        promptVars.put("goal", goal != null ? goal : "Comprehensive Mastery");
        promptVars.put("dailyHours", 2);
        promptVars.put("context", docContext.isEmpty() ? "No additional reference materials uploaded." : docContext);

        com.lumiedu.user.entity.User currentUser = userRepository.findById(userId).orElse(null);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "STUDY_PLAN",
                promptVars,
                currentUser,
                currentUser != null ? currentUser.getEmail() : null,
                "STUDY_PLAN",
                documentIds != null ? documentIds.toString() : "0",
                "docs-v1",
                true
        );

        String rawResponseText = execResult.getContent();

        String title = "Kế hoạch học tập " + subject;
        String planText = rawResponseText;
        String curriculumJson = "";

        try {
            JsonObject jsonObj = gson.fromJson(rawResponseText, JsonObject.class);
            title = jsonObj.get("title").getAsString();
            planText = jsonObj.get("planText").getAsString();
            JsonObject wrapper = new JsonObject();
            if (jsonObj.has("curriculum")) {
                wrapper.add("modules", jsonObj.get("curriculum"));
            }
            if (jsonObj.has("difficulty")) {
                wrapper.addProperty("difficulty", jsonObj.get("difficulty").getAsString());
            } else {
                wrapper.addProperty("difficulty", "Medium");
            }
            if (jsonObj.has("hoursEst")) {
                wrapper.addProperty("hoursEst", jsonObj.get("hoursEst").getAsNumber());
            } else {
                wrapper.addProperty("hoursEst", 28);
            }
            curriculumJson = gson.toJson(wrapper);
        } catch (Exception e) {
            System.err.println("Failed to parse study plan JSON: " + e.getMessage());
        }

        StudyPlan plan = StudyPlan.builder()
                .userId(userId)
                .title(title)
                .subject(subject)
                .planText(planText)
                .curriculumJson(curriculumJson)
                .documentId(documentIds != null && !documentIds.isEmpty() ? documentIds.get(0) : null)
                .sourceDocuments(sourceDocs)
                .build();

        return studyPlanRepository.save(plan);
    }

    @Override
    public List<StudyPlan> getStudyPlans(Long userId) {
        return studyPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<String> getCompletedLessons(Long planId) {
        StudyPlan plan = studyPlanRepository.findById(planId).orElse(null);
        if (plan == null || plan.getCompletedLessonsJson() == null || plan.getCompletedLessonsJson().isBlank()) {
            return new ArrayList<>();
        }
        try {
            com.google.gson.reflect.TypeToken<List<String>> typeToken = new com.google.gson.reflect.TypeToken<>() {};
            return gson.fromJson(plan.getCompletedLessonsJson(), typeToken.getType());
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    @Override
    public List<String> updateCompletedLessons(Long planId, List<String> lessonIds) {
        StudyPlan plan = studyPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Study plan not found: " + planId));
        plan.setCompletedLessonsJson(gson.toJson(lessonIds));
        studyPlanRepository.save(plan);
        return lessonIds;
    }

    @Override
    public StudyPlan saveStudyPlan(StudyPlan studyPlan) {
        if (studyPlan.getPlanText() == null || studyPlan.getPlanText().trim().isEmpty()) {
            studyPlan.setPlanText("Lộ trình học tập cá nhân");
        }
        if (studyPlan.getSubject() == null || studyPlan.getSubject().trim().isEmpty()) {
            studyPlan.setSubject("General");
        }
        if (studyPlan.getUserId() == null) {
            studyPlan.setUserId(1L);
        }
        return studyPlanRepository.save(studyPlan);
    }

    @Override
    public StudyPlan updateStudyPlan(Long id, StudyPlan studyPlan) {
        StudyPlan existing = studyPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Study plan not found: " + id));
        existing.setTitle(studyPlan.getTitle());
        existing.setSubject(studyPlan.getSubject());
        existing.setPlanText(studyPlan.getPlanText());
        if (studyPlan.getCurriculumJson() != null) {
            existing.setCurriculumJson(studyPlan.getCurriculumJson());
        }
        if (studyPlan.getCompletedLessonsJson() != null) {
            existing.setCompletedLessonsJson(studyPlan.getCompletedLessonsJson());
        }
        if (studyPlan.getDocumentId() != null) {
            existing.setDocumentId(studyPlan.getDocumentId());
        }
        return studyPlanRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteStudyPlan(Long id) {
        studyPlanRepository.findById(id).ifPresent(plan -> {
            if (plan.getSourceDocuments() != null) {
                plan.getSourceDocuments().clear();
                studyPlanRepository.saveAndFlush(plan);
            }
            studyPlanRepository.delete(plan);
        });
    }


    // --- Helpers ---

    private void saveUsageLog(Long userId, String featureType, OpenAiResponse response) {
        try {
            AiUsageLog log = AiUsageLog.builder()
                    .userId(userId)
                    .featureType(featureType)
                    .model("gpt-4o-mini")
                    .promptTokens(response.getPromptTokens())
                    .completionTokens(response.getCompletionTokens())
                    .costEstimate(response.getCostEstimate() != null ? response.getCostEstimate() : BigDecimal.ZERO)
                    .usageDate(LocalDate.now())
                    .build();
            aiUsageLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Failed to save AI Usage Log: " + e.getMessage());
        }
    }

    private String performRagSearch(List<Long> documentIds, String query) {
        if (documentIds == null || documentIds.isEmpty()) {
            return "";
        }
        
        List<DocumentChunk> chunks = new ArrayList<>();
        for (Long documentId : documentIds) {
            chunks.addAll(documentChunkRepository.findByDocumentId(documentId));
        }

        if (chunks.isEmpty()) {
            return "";
        }

        // 1. Get embedding for the query
        float[] queryVector = geminiService.getEmbedding(query);

        class ChunkVectorScore implements Comparable<ChunkVectorScore> {
            DocumentChunk chunk;
            double similarity;
            
            ChunkVectorScore(DocumentChunk chunk, double similarity) {
                this.chunk = chunk;
                this.similarity = similarity;
            }
            
            @Override
            public int compareTo(ChunkVectorScore o) {
                return Double.compare(o.similarity, this.similarity); // descending
            }
        }
        
        List<ChunkVectorScore> scoredChunks = new ArrayList<>();
        for (DocumentChunk chunk : chunks) {
            if (chunk.getEmbedding() != null && !chunk.getEmbedding().isEmpty()) {
                try {
                    float[] chunkVector = gson.fromJson(chunk.getEmbedding(), float[].class);
                    double similarity = cosineSimilarity(queryVector, chunkVector);
                    scoredChunks.add(new ChunkVectorScore(chunk, similarity));
                } catch (Exception e) {
                    System.err.println("Failed to parse or compute similarity for chunk ID " + chunk.getId() + ": " + e.getMessage());
                }
            }
        }
        
        // 2. If no chunks have embeddings, fallback to keyword search
        if (scoredChunks.isEmpty()) {
            System.out.println("No chunk embeddings found. Falling back to keyword search.");
            return performKeywordSearch(chunks, query);
        }
        
        Collections.sort(scoredChunks);
        StringBuilder result = new StringBuilder();
        Set<String> seenSnippets = new HashSet<>();
        int count = 0;
        for (ChunkVectorScore item : scoredChunks) {
            if (count >= 5) break;
            DocumentChunk c = item.chunk;
            String snippet = c.getContent() != null ? c.getContent().trim() : "";
            if (!snippet.isEmpty() && seenSnippets.add(snippet)) {
                result.append("--- Source Document ID: ").append(c.getDocumentId()).append(" ---\n");
                result.append(snippet).append("\n\n");
                count++;
            }
        }
        
        return result.toString();
    }

    private double cosineSimilarity(float[] vectorA, float[] vectorB) {
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < Math.min(vectorA.length, vectorB.length); i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += Math.pow(vectorA[i], 2);
            normB += Math.pow(vectorB[i], 2);
        }
        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private String performKeywordSearch(List<DocumentChunk> chunks, String query) {
        String[] keywords = query.toLowerCase().split("\\s+");

        class ChunkScore implements Comparable<ChunkScore> {
            DocumentChunk chunk;
            int score;

            ChunkScore(DocumentChunk chunk, int score) {
                this.chunk = chunk;
                this.score = score;
            }

            @Override
            public int compareTo(ChunkScore o) {
                return Integer.compare(o.score, this.score); // descending
            }
        }
        
        List<ChunkScore> scoredChunks = new ArrayList<>();
        for (DocumentChunk chunk : chunks) {
            int score = 0;
            String contentLower = chunk.getContent().toLowerCase();
            for (String kw : keywords) {
                if (kw.length() > 2 && contentLower.contains(kw)) {
                    score++;
                }
            }
            if (score > 0) {
                scoredChunks.add(new ChunkScore(chunk, score));
            }
        }

        if (scoredChunks.isEmpty()) {
            StringBuilder fallback = new StringBuilder();
            Map<Long, DocumentChunk> firstChunks = new HashMap<>();
            for (DocumentChunk chunk : chunks) {
                firstChunks.putIfAbsent(chunk.getDocumentId(), chunk);
            }
            for (DocumentChunk firstChunk : firstChunks.values()) {
                fallback.append("--- Source Document ID: ").append(firstChunk.getDocumentId()).append(" ---\n");
                fallback.append(firstChunk.getContent()).append("\n\n");
            }
            return fallback.toString();
        }
        
        Collections.sort(scoredChunks);
        StringBuilder result = new StringBuilder();
        Set<String> seenSnippets = new HashSet<>();
        int count = 0;
        for (ChunkScore item : scoredChunks) {
            if (count >= 5) break;
            DocumentChunk c = item.chunk;
            String snippet = c.getContent() != null ? c.getContent().trim() : "";
            if (!snippet.isEmpty() && seenSnippets.add(snippet)) {
                result.append("--- Source Document ID: ").append(c.getDocumentId()).append(" ---\n");
                result.append(snippet).append("\n\n");
                count++;
            }
        }

        return result.toString();
    }

    private List<DocumentChunk> getOrWaitForChunks(Long documentId) {
        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(documentId);
        if (chunks.isEmpty()) {
            if (!documentChunkingService.isProcessing(documentId)) {
                documentChunkingService.chunkAndIndexDocument(documentId);
            }
            // Polling wait for async task to complete
            for (int i = 0; i < 15; i++) {
                try {
                    Thread.sleep(1000L);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                chunks = documentChunkRepository.findByDocumentId(documentId);
                if (!chunks.isEmpty()) {
                    break;
                }
            }
        }
        return chunks;
    }
}
// Force JDT LS revalidation 2
